const express = require('express');
const auth = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { Tenant, User, Invitation } = require('../models');
const crypto = require('crypto');

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
    const hostname = req.hostname;
    
    // Determine if this is the main domain or a tenant-specific access
    const isMainDomain = hostname === 'forehq.com' || hostname === 'www.forehq.com' || hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const isSubdomain = hostname.endsWith('.forehq.com') && !isMainDomain;
    const isCustomDomain = !isMainDomain && !isSubdomain;
    
    // Handle localhost/main domain case (no tenant)
    if (!tenant) {
      return res.json({
        success: true,
        data: {
          name: 'fore',
          subdomain: null,
          domainInfo: {
            hostname: hostname,
            isMainDomain: true,
            isSubdomain: false,
            isCustomDomain: false
          },
          settings: {
            logo: null,
            favicon: null,
            primaryColor: null,
            secondaryColor: null,
            theme: 'light',
            customCSS: null,
            allowPublicVoting: false,
            contactEmail: null,
            supportUrl: null,
            timezone: 'UTC'
          }
        }
      });
    }
    
    // Return tenant information
    res.json({
      success: true,
      data: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        domainInfo: {
          hostname: hostname,
          isMainDomain: isMainDomain,
          isSubdomain: isSubdomain,
          isCustomDomain: isCustomDomain
        },
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

// Get all users in tenant
router.get('/users', resolveTenant, auth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    // Get all users for this tenant
    const users = await User.find({ tenant: tenantId })
      .select('email name role createdAt updatedAt')
      .sort({ createdAt: 1 });
    
    // Get pending invitations
    const invitations = await Invitation.find({ 
      tenant: tenantId, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).select('email role createdAt');
    
    // Combine users and invitations
    const allUsers = [
      ...users.map(user => ({
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: 'active',
        joinedAt: user.createdAt,
        lastActive: user.updatedAt
      })),
      ...invitations.map(invitation => ({
        _id: invitation._id,
        email: invitation.email,
        name: null,
        role: invitation.role,
        status: 'invited',
        joinedAt: invitation.createdAt,
        lastActive: null
      }))
    ];
    
    res.json({
      success: true,
      data: allUsers
    });
    
  } catch (error) {
    console.error('Get tenant users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant users'
    });
  }
});

// Invite user by email
router.post('/invite-user', resolveTenant, auth, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const tenantId = req.tenantId;
    const userId = req.user.id;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Check if user already exists in this tenant
    const existingUser = await User.findOne({ email: email.toLowerCase(), tenant: tenantId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this organization'
      });
    }
    
    // Check if there's already a pending invitation
    const existingInvitation = await Invitation.findOne({ 
      email: email.toLowerCase(), 
      tenant: tenantId, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'An invitation has already been sent to this email'
      });
    }
    
    // Check tenant user limits
    const tenant = await Tenant.findById(tenantId);
    const currentUserCount = await User.countDocuments({ tenant: tenantId });
    
    if (currentUserCount >= tenant.limits.maxUsers) {
      return res.status(400).json({
        success: false,
        message: `User limit reached. Your plan allows up to ${tenant.limits.maxUsers} users.`
      });
    }
    
    // Create invitation
    const invitation = new Invitation({
      email: email.toLowerCase(),
      tenant: tenantId,
      invitedBy: userId,
      role: role
    });
    
    await invitation.save();
    
    // TODO: Send email invitation here
    // For now, we'll just return success
    console.log(`Invitation sent to ${email} for tenant ${tenant.subdomain}`);
    console.log(`Invitation URL: ${invitation.getInviteUrl()}`);
    
    res.json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        email: invitation.email,
        inviteUrl: invitation.getInviteUrl(),
        expiresAt: invitation.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Invite user error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation'
    });
  }
});

// Generate invite link
router.post('/generate-invite-link', resolveTenant, auth, async (req, res) => {
  try {
    const tenant = req.tenant;
    const { token, inviteLink } = Invitation.generateInviteLink(tenant);
    
    res.json({
      success: true,
      data: {
        inviteLink: inviteLink,
        token: token,
        expiresIn: '7 days'
      }
    });
    
  } catch (error) {
    console.error('Generate invite link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invite link'
    });
  }
});

// Remove user from tenant
router.delete('/users/:userId', resolveTenant, auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.tenantId;
    const currentUserId = req.user.id;
    
    // Prevent users from removing themselves
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove yourself'
      });
    }
    
    // Check if it's a user or an invitation
    let removed = false;
    
    // Try to find and remove user
    const user = await User.findOneAndDelete({ 
      _id: userId, 
      tenant: tenantId 
    });
    
    if (user) {
      removed = true;
      console.log(`User ${user.email} removed from tenant ${tenantId}`);
    } else {
      // Try to find and remove invitation
      const invitation = await Invitation.findOneAndDelete({ 
        _id: userId, 
        tenant: tenantId 
      });
      
      if (invitation) {
        removed = true;
        console.log(`Invitation for ${invitation.email} removed from tenant ${tenantId}`);
      }
    }
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User removed successfully'
    });
    
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove user'
    });
  }
});

module.exports = router;