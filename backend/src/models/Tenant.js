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
      default: null
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

// Index for fast subdomain lookups
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ status: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);