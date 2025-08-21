const { Tenant } = require('../models');

const resolveTenant = async (req, res, next) => {
  try {
    console.log(`🔍 Tenant Resolution Debug:`);
    console.log(`  - Host header: ${req.get('host')}`);
    console.log(`  - Hostname: ${req.hostname}`);
    console.log(`  - Original URL: ${req.originalUrl}`);
    
    // Check for debug tenant header first
    const debugTenant = req.get('X-Debug-Tenant');
    if (debugTenant) {
      const tenant = await Tenant.findOne({ 
        subdomain: debugTenant.toLowerCase(),
        status: 'active'
      });
      
      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant._id;
        req.hostname = `${debugTenant}.forehq.com`; // Simulate subdomain
        return next();
      }
    }
    
    // Extract hostname and clean it
    const hostname = (req.get('host') || req.hostname).toLowerCase();
    
    let tenant = null;
    
    // First, try to find tenant by custom domain
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      // Remove www. prefix for domain matching
      const cleanDomain = hostname.replace(/^www\./, '');
      
      tenant = await Tenant.findOne({ 
        'settings.customDomain': cleanDomain,
        status: 'active'
      });
    }
    
    // If no tenant found by domain, try subdomain resolution
    if (!tenant) {
      let subdomain;
      
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        // For local development, use DEFAULT_TENANT environment variable
        subdomain = process.env.DEFAULT_TENANT || null;
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
          // If no subdomain and it's the main forehq.com domain, don't assign a tenant
          if (hostname === 'forehq.com' || hostname === 'www.forehq.com') {
            subdomain = null;
          } else {
            // For other domains without subdomain, use environment variable or default to hiver
            subdomain = process.env.DEFAULT_TENANT || 'hiver';
          }
        }
      }

      // Find tenant by subdomain (if subdomain is not null)
      if (subdomain) {
        tenant = await Tenant.findOne({ 
          subdomain: subdomain.toLowerCase(),
          status: 'active'
        });
      }
    }

    if (!tenant) {
      // For localhost and main forehq.com domain, allow requests without a tenant (main domain behavior)
      if (hostname.includes('localhost') || 
          hostname.includes('127.0.0.1') || 
          hostname === 'forehq.com' || 
          hostname === 'www.forehq.com') {
        // Don't set tenant info, let the route handle it
        req.tenant = null;
        req.tenantId = null;
        req.hostname = hostname;
        return next();
      }
      
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or inactive',
        hostname: hostname
      });
    }

    // Add tenant to request object
    req.tenant = tenant;
    req.tenantId = tenant._id;
    req.hostname = hostname;
    
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