const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Allow alphanumeric and hyphens, must start/end with alphanumeric
        return /^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$/.test(v);
      },
      message: 'Subdomain must contain only lowercase letters, numbers, and hyphens'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  companySize: {
    type: String,
    enum: ['0-10', '10-100', '100+'],
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled'],
    default: 'active'
  },
  settings: {
    customDomain: {
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          if (!v) return true;
          // Basic domain validation
          return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/.test(v);
        },
        message: 'Invalid domain format'
      }
    },
    logo: {
      type: String,
      default: null
    },
    favicon: {
      type: String,
      default: null
    },
    primaryColor: {
      type: String,
      default: '#3b82f6',
      validate: {
        validator: function(v) {
          return /^#[0-9a-fA-F]{6}$/.test(v);
        },
        message: 'Primary color must be a valid hex color'
      }
    },
    secondaryColor: {
      type: String,
      default: '#64748b',
      validate: {
        validator: function(v) {
          return /^#[0-9a-fA-F]{6}$/.test(v);
        },
        message: 'Secondary color must be a valid hex color'
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    allowPublicVoting: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    customCSS: {
      type: String,
      default: null
    },
    contactEmail: {
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    supportUrl: {
      type: String,
      default: null
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  limits: {
    maxRoadmaps: {
      type: Number,
      default: 5
    },
    maxItemsPerRoadmap: {
      type: Number,
      default: 50
    },
    maxUsers: {
      type: Number,
      default: 1
    }
  },
  billing: {
    subscriptionId: {
      type: String,
      default: null
    },
    billingEmail: {
      type: String,
      default: null
    },
    nextBillingDate: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for fast lookups
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'settings.customDomain': 1 });

module.exports = mongoose.model('Tenant', tenantSchema);