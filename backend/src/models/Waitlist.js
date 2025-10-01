const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companySize: {
    type: String,
    required: true,
    enum: ['1-10', '11-50', '51-200', '201-1000', '1000+']
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending'
  },
  invitedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Create index for faster queries
waitlistSchema.index({ email: 1 });
waitlistSchema.index({ status: 1 });
waitlistSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);