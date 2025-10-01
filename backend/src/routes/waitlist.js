const express = require('express');
const { body } = require('express-validator');
const { joinWaitlist, getWaitlist, updateWaitlistStatus } = require('../controllers/waitlistController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public route to join waitlist
router.post('/', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required'),
  body('companySize').isIn(['1-10', '11-50', '51-200', '201-1000', '1000+']).withMessage('Valid company size is required'),
  body('role').trim().isLength({ min: 1 }).withMessage('Role is required')
], joinWaitlist);

// Admin routes (protected)
router.get('/', auth, getWaitlist);
router.put('/:id', auth, [
  body('status').isIn(['pending', 'approved', 'declined']).withMessage('Valid status is required'),
  body('notes').optional().trim()
], updateWaitlistStatus);

module.exports = router;