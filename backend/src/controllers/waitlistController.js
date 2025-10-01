const { validationResult } = require('express-validator');
const Waitlist = require('../models/Waitlist');

// Join waitlist
const joinWaitlist = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      email,
      firstName,
      lastName,
      companyName,
      companySize,
      role
    } = req.body;

    // Check if email already exists
    const existingEntry = await Waitlist.findOne({ email: email.toLowerCase() });
    if (existingEntry) {
      return res.status(400).json({
        message: 'This email is already registered for our beta program'
      });
    }

    // Create waitlist entry
    const waitlistEntry = new Waitlist({
      email: email.toLowerCase(),
      firstName,
      lastName,
      companyName,
      companySize,
      role
    });

    await waitlistEntry.save();

    res.status(201).json({
      message: 'Successfully joined the beta program',
      data: {
        email: waitlistEntry.email,
        firstName: waitlistEntry.firstName,
        lastName: waitlistEntry.lastName,
        companyName: waitlistEntry.companyName,
        status: waitlistEntry.status
      }
    });
  } catch (error) {
    console.error('Beta signup error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

// Get waitlist entries (admin only - we'll add this later)
const getWaitlist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const waitlistEntries = await Waitlist.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Waitlist.countDocuments(query);

    res.json({
      data: waitlistEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

// Update waitlist entry status (admin only)
const updateWaitlistStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'approved', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be pending, approved, or declined'
      });
    }

    const updateData = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (status === 'approved') {
      updateData.invitedAt = new Date();
    }

    const waitlistEntry = await Waitlist.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!waitlistEntry) {
      return res.status(404).json({
        message: 'Waitlist entry not found'
      });
    }

    res.json({
      message: 'Waitlist entry updated successfully',
      data: waitlistEntry
    });
  } catch (error) {
    console.error('Update waitlist error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

module.exports = {
  joinWaitlist,
  getWaitlist,
  updateWaitlistStatus
};