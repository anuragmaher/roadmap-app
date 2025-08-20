const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Invitations expire after 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  },
  acceptedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Generate unique token before saving
invitationSchema.pre('save', function(next) {
  if (this.isNew) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Compound index to ensure one pending invitation per email per tenant
invitationSchema.index({ email: 1, tenant: 1, status: 1 }, { unique: true });
invitationSchema.index({ token: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create invite link
invitationSchema.statics.generateInviteLink = function(tenant) {
  const token = crypto.randomBytes(32).toString('hex');
  const baseUrl = process.env.FRONTEND_URL || 'https://forehq.com';
  return {
    token,
    inviteLink: `${baseUrl}/invite/${token}?tenant=${tenant.subdomain}`
  };
};

// Instance method to generate invite URL
invitationSchema.methods.getInviteUrl = function() {
  const baseUrl = process.env.FRONTEND_URL || 'https://forehq.com';
  return `${baseUrl}/invite/${this.token}`;
};

// Check if invitation is expired
invitationSchema.methods.isExpired = function() {
  return this.expiresAt < new Date() || this.status !== 'pending';
};

module.exports = mongoose.model('Invitation', invitationSchema);