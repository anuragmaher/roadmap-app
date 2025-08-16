const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  quarter: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate format: YYYY-QN (e.g., "2025-Q1")
        return /^\d{4}-Q[1-4]$/.test(v);
      },
      message: 'Quarter must be in format YYYY-QN (e.g., "2025-Q1")'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['planned', 'in-progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  roadmap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);