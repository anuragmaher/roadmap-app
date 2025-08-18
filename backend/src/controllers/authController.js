const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Tenant } = require('../models');

const generateToken = (userId, tenantId) => {
  return jwt.sign({ userId, tenantId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateSubdomain = (companyName) => {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, companyName, companySize } = req.body;

    // Generate subdomain from company name
    let subdomain = generateSubdomain(companyName);
    
    // Check if subdomain already exists and make it unique
    let existingTenant = await Tenant.findOne({ subdomain });
    let counter = 1;
    while (existingTenant) {
      subdomain = `${generateSubdomain(companyName)}-${counter}`;
      existingTenant = await Tenant.findOne({ subdomain });
      counter++;
    }

    // Create new tenant
    const tenant = new Tenant({
      subdomain,
      name: companyName,
      companySize,
      plan: 'free',
      status: 'active'
    });
    await tenant.save();

    // Check if user already exists in this tenant
    const existingUser = await User.findOne({ email, tenant: tenant._id });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ 
      email, 
      password, 
      tenant: tenant._id,
      role: 'owner'
    });
    await user.save();

    const token = generateToken(user._id, tenant._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email
      },
      tenant: {
        id: tenant._id,
        subdomain: tenant.subdomain,
        name: tenant.name,
        companySize: tenant.companySize
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email, tenant: req.tenantId });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, req.tenantId);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email
      },
      tenant: {
        id: req.tenant._id,
        subdomain: req.tenant.subdomain,
        name: req.tenant.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email
    }
  });
};

module.exports = {
  register,
  login,
  getMe
};