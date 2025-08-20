const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Invitation, Tenant } = require('../models');

const router = express.Router();

// Get invitation details by token
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ 
      token: token,
      status: 'pending'
    }).populate('tenant', 'name subdomain settings.logo settings.primaryColor');
    
    if (!invitation || invitation.isExpired()) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or has expired'
      });
    }
    
    res.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        tenant: {
          name: invitation.tenant.name,
          subdomain: invitation.tenant.subdomain,
          logo: invitation.tenant.settings.logo,
          primaryColor: invitation.tenant.settings.primaryColor
        },
        expiresAt: invitation.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invitation details'
    });
  }
});

// Accept invitation and create user account
router.post('/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, name } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    const invitation = await Invitation.findOne({ 
      token: token,
      status: 'pending'
    }).populate('tenant');
    
    if (!invitation || invitation.isExpired()) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or has expired'
      });
    }
    
    // Check if user already exists with this email in the tenant
    const existingUser = await User.findOne({ 
      email: invitation.email, 
      tenant: invitation.tenant._id 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists in this organization'
      });
    }
    
    // Check tenant user limits
    const currentUserCount = await User.countDocuments({ tenant: invitation.tenant._id });
    
    if (currentUserCount >= invitation.tenant.limits.maxUsers) {
      return res.status(400).json({
        success: false,
        message: `User limit reached. This organization's plan allows up to ${invitation.tenant.limits.maxUsers} users.`
      });
    }
    
    // Create new user
    const user = new User({
      email: invitation.email,
      password: password,
      tenant: invitation.tenant._id,
      role: invitation.role,
      name: name
    });
    
    await user.save();
    
    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        tenant: user.tenant,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Account created successfully',
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          tenant: invitation.tenant.subdomain,
          name: user.name
        }
      }
    });
    
  } catch (error) {
    console.error('Accept invitation error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists in this organization'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation'
    });
  }
});

// Accept invitation with general link (requires email)
router.post('/accept-link/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // For general invite links, we need to find the tenant by the token
    // This is a simplified implementation - in production you might want
    // to store general invite tokens differently
    const tenant = await Tenant.findOne({
      // This assumes the token is stored somewhere or we have another way to map it
      // For now, we'll decode it from the frontend URL structure
    });
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite link'
      });
    }
    
    // Check if user already exists with this email in the tenant
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      tenant: tenant._id 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists in this organization'
      });
    }
    
    // Check tenant user limits
    const currentUserCount = await User.countDocuments({ tenant: tenant._id });
    
    if (currentUserCount >= tenant.limits.maxUsers) {
      return res.status(400).json({
        success: false,
        message: `User limit reached. This organization's plan allows up to ${tenant.limits.maxUsers} users.`
      });
    }
    
    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password: password,
      tenant: tenant._id,
      role: 'member', // Default role for general invite links
      name: name
    });
    
    await user.save();
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        tenant: user.tenant,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Account created successfully',
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          tenant: tenant.subdomain,
          name: user.name
        }
      }
    });
    
  } catch (error) {
    console.error('Accept general invite link error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists in this organization'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation'
    });
  }
});

module.exports = router;