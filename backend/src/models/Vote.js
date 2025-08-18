const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  notified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure one vote per email per item per tenant
voteSchema.index({ email: 1, item: 1, tenant: 1 }, { unique: true });
voteSchema.index({ tenant: 1 });

module.exports = mongoose.model('Vote', voteSchema);