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
  isPublic: {
    type: Boolean,
    default: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
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

module.exports = mongoose.model('Roadmap', roadmapSchema);