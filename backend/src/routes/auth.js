const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');

const router = express.Router();

// Registration disabled - users must join beta program
router.post('/register', (req, res) => {
  res.status(403).json({
    message: 'Registration is currently closed. Please join our beta program to get early access.',
    redirectTo: '/register'
  });
});

router.post('/login', resolveTenant, [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], login);

router.get('/me', resolveTenant, auth, getMe);

module.exports = router;