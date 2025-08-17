const { validationResult } = require('express-validator');
const { Vote, Item } = require('../models');

const createVote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId } = req.params;
    const { email } = req.body;

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Don't allow voting on completed items
    if (item.status === 'completed') {
      return res.status(400).json({ message: 'Cannot vote on completed items' });
    }

    // Check if user already voted
    const existingVote = await Vote.findOne({ email, item: itemId });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted for this item' });
    }

    // Create new vote
    const vote = new Vote({
      email,
      item: itemId
    });

    await vote.save();

    // Get updated vote count
    const voteCount = await Vote.countDocuments({ item: itemId });
    const isHighDemand = voteCount > 5;

    res.status(201).json({ 
      message: 'Vote recorded successfully',
      voteCount,
      isHighDemand
    });
  } catch (error) {
    console.error('Create vote error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already voted for this item' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const removeVote = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { email } = req.body;

    const vote = await Vote.findOneAndDelete({ email, item: itemId });
    if (!vote) {
      return res.status(404).json({ message: 'Vote not found' });
    }

    // Get updated vote count
    const voteCount = await Vote.countDocuments({ item: itemId });
    const isHighDemand = voteCount > 5;

    res.json({ 
      message: 'Vote removed successfully',
      voteCount,
      isHighDemand
    });
  } catch (error) {
    console.error('Remove vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getItemVotes = async (req, res) => {
  try {
    const { itemId } = req.params;

    const voteCount = await Vote.countDocuments({ item: itemId });
    const isHighDemand = voteCount > 5;

    res.json({
      voteCount,
      isHighDemand
    });
  } catch (error) {
    console.error('Get item votes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const checkUserVote = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const vote = await Vote.findOne({ email, item: itemId });
    
    res.json({
      hasVoted: !!vote
    });
  } catch (error) {
    console.error('Check user vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const notifyVoters = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Check if item exists and is completed
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'completed') {
      return res.status(400).json({ message: 'Item is not completed yet' });
    }

    // Get all voters who haven't been notified
    const votes = await Vote.find({ item: itemId, notified: false });
    
    // Mark all votes as notified
    await Vote.updateMany(
      { item: itemId, notified: false },
      { notified: true }
    );

    // TODO: Send actual email notifications here
    // For now, we'll just return the email list
    const emailsToNotify = votes.map(vote => vote.email);

    res.json({
      message: `Notification sent to ${emailsToNotify.length} voters`,
      emails: emailsToNotify
    });
  } catch (error) {
    console.error('Notify voters error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createVote,
  removeVote,
  getItemVotes,
  checkUserVote,
  notifyVoters
};