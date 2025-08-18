const express = require('express');
const { body } = require('express-validator');
const { checkSubdomainAvailability } = require('../controllers/subdomainController');

const router = express.Router();

router.post('/check-availability', [
  body('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required')
], checkSubdomainAvailability);

module.exports = router;