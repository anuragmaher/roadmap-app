const express = require('express');
const { body } = require('express-validator');
const { createVote, removeVote, getItemVotes, checkUserVote, notifyVoters } = require('../controllers/voteController');
const auth = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');

const router = express.Router();

// Create a vote for an item
router.post('/items/:itemId/vote', resolveTenant, [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address')
], createVote);

// Remove a vote for an item
router.delete('/items/:itemId/vote', resolveTenant, [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address')
], removeVote);

// Get vote statistics for an item
router.get('/items/:itemId/votes', resolveTenant, getItemVotes);

// Check if a user has voted for an item
router.get('/items/:itemId/vote/check', resolveTenant, checkUserVote);

// Notify voters (admin only)
router.post('/items/:itemId/notify-voters', resolveTenant, auth, notifyVoters);

module.exports = router;