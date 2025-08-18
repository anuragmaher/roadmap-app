const { Tenant } = require('../models');

const resolveTenant = async (req, res, next) => {
  try {
    // Extract subdomain from hostname
    const hostname = req.get('host') || req.hostname;
    
    // Handle different environments
    let subdomain;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      // For local development, use hiver as default
      subdomain = 'hiver';
    } else if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
      // For staging/preview deployments, use hiver as default
      subdomain = 'hiver';
    } else if (hostname.includes('hiver-ai.com')) {
      // For hiver-ai.com domain (both www.hiver-ai.com and hiver-ai.com), use hiver
      subdomain = 'hiver';
    } else {
      // Extract subdomain from hostname (e.g., "customer.yourdomain.com" -> "customer")
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        subdomain = parts[0];
      } else {
        // If no subdomain, use environment variable or default to hiver
        subdomain = process.env.DEFAULT_TENANT || 'hiver';
      }
    }

    // Find tenant by subdomain
    const tenant = await Tenant.findOne({ 
      subdomain: subdomain.toLowerCase(),
      status: 'active'
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or inactive'
      });
    }

    // Add tenant to request object
    req.tenant = tenant;
    req.tenantId = tenant._id;
    
    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = { resolveTenant };