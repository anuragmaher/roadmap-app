const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');

const router = express.Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required'),
  body('companySize').isIn(['0-10', '10-100', '100+']).withMessage('Company size must be 0-10, 10-100, or 100+')
], register);

router.post('/login', resolveTenant, [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], login);

router.get('/me', resolveTenant, auth, getMe);

module.exports = router;