const express = require('express');
const auth = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { Tenant } = require('../models');

const router = express.Router();

// Get tenant settings
router.get('/settings', resolveTenant, auth, async (req, res) => {
  try {
    const tenant = req.tenant;
    
    res.json({
      success: true,
      data: {
        _id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        companySize: tenant.companySize,
        plan: tenant.plan,
        status: tenant.status,
        settings: tenant.settings,
        limits: tenant.limits,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt
      }
    });
  } catch (error) {
    console.error('Get tenant settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant settings'
    });
  }
});

// Update tenant settings
router.put('/settings', resolveTenant, auth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated through this endpoint
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.plan; // Plan changes should go through billing
    delete updates.status; // Status changes should be handled separately
    delete updates.limits; // Limits are tied to plan
    delete updates.billing;
    
    // Validate subdomain if being updated
    if (updates.subdomain) {
      const existingTenant = await Tenant.findOne({
        subdomain: updates.subdomain.toLowerCase(),
        _id: { $ne: tenantId }
      });
      
      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: 'Subdomain already exists'
        });
      }
    }
    
    // Validate custom domain if being updated
    if (updates.settings && updates.settings.customDomain) {
      const domain = updates.settings.customDomain.toLowerCase();
      const existingTenant = await Tenant.findOne({
        'settings.customDomain': domain,
        _id: { $ne: tenantId }
      });
      
      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: 'Custom domain already in use'
        });
      }
    }
    
    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      updates,
      { 
        new: true, 
        runValidators: true,
        select: '-billing.subscriptionId -billing.billingEmail -billing.nextBillingDate'
      }
    );
    
    if (!updatedTenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedTenant,
      message: 'Tenant settings updated successfully'
    });
    
  } catch (error) {
    console.error('Update tenant settings error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant settings'
    });
  }
});

// Get tenant info (public endpoint for branding)
router.get('/info', resolveTenant, async (req, res) => {
  try {
    const tenant = req.tenant;
    
    // Return only public information
    res.json({
      success: true,
      data: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        settings: {
          logo: tenant.settings.logo,
          favicon: tenant.settings.favicon,
          primaryColor: tenant.settings.primaryColor,
          secondaryColor: tenant.settings.secondaryColor,
          theme: tenant.settings.theme,
          customCSS: tenant.settings.customCSS,
          allowPublicVoting: tenant.settings.allowPublicVoting,
          contactEmail: tenant.settings.contactEmail,
          supportUrl: tenant.settings.supportUrl,
          timezone: tenant.settings.timezone
        }
      }
    });
  } catch (error) {
    console.error('Get tenant info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant info'
    });
  }
});

// Check domain availability
router.post('/check-domain', auth, async (req, res) => {
  try {
    const { domain, type = 'custom' } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }
    
    let query;
    if (type === 'custom') {
      query = { 'settings.customDomain': domain.toLowerCase() };
    } else {
      query = { subdomain: domain.toLowerCase() };
    }
    
    const existingTenant = await Tenant.findOne(query);
    
    res.json({
      success: true,
      available: !existingTenant
    });
    
  } catch (error) {
    console.error('Check domain availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check domain availability'
    });
  }
});

module.exports = router;