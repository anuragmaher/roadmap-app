const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true
});

roadmapSchema.virtual('items', {
  ref: 'Item',
  localField: '_id',
  foreignField: 'roadmap'
});

roadmapSchema.set('toJSON', { virtuals: true });
roadmapSchema.set('toObject', { virtuals: true });

// Compound index for slug uniqueness per tenant
roadmapSchema.index({ slug: 1, tenant: 1 }, { unique: true });
roadmapSchema.index({ tenant: 1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);