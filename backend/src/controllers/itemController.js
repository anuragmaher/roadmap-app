const { validationResult } = require('express-validator');
const { Item, Roadmap } = require('../models');
const redisService = require('../services/redis');

const createItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roadmapId } = req.params;
    const { title, description, quarter, tags, status, order, image, prdLink, figmaLink } = req.body;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, tenant: req.tenantId });
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    if (roadmap.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const item = new Item({
      title,
      description: description || '',
      quarter,
      tags: tags || [],
      status: status || 'planned',
      roadmap: roadmapId,
      tenant: req.tenantId,
      order: order || 0,
      image: image || null,
      prdLink: prdLink || null,
      figmaLink: figmaLink || null
    });

    await item.save();
    
    // Invalidate home data cache for this tenant
    await redisService.invalidateHomeData(req.tenantId);
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message,
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

const getItems = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const { quarter } = req.query;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, tenant: req.tenantId });
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    let query = { roadmap: roadmapId, tenant: req.tenantId };
    if (quarter) {
      query.quarter = quarter;
    }

    const items = await Item.find(query).sort({ order: 1, createdAt: 1 });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId } = req.params;
    const { title, description, quarter, tags, status, order, image, prdLink, figmaLink } = req.body;

    const item = await Item.findOne({ _id: itemId, tenant: req.tenantId }).populate('roadmap');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.roadmap.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (quarter !== undefined) item.quarter = quarter;
    if (tags !== undefined) item.tags = tags;
    if (status !== undefined) item.status = status;
    if (order !== undefined) item.order = order;
    if (image !== undefined) item.image = image;
    if (prdLink !== undefined) item.prdLink = prdLink;
    if (figmaLink !== undefined) item.figmaLink = figmaLink;

    await item.save();
    
    // Invalidate home data cache for this tenant
    await redisService.invalidateHomeData(req.tenantId);
    
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findOne({ _id: itemId, tenant: req.tenantId }).populate('roadmap');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.roadmap.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Item.findOneAndDelete({ _id: itemId, tenant: req.tenantId });
    
    // Invalidate home data cache for this tenant
    await redisService.invalidateHomeData(req.tenantId);
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getItemsByQuarter = async (req, res) => {
  try {
    const { roadmapSlug, quarter } = req.params;

    const roadmap = await Roadmap.findOne({ slug: roadmapSlug, tenant: req.tenantId });
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    if (!roadmap.isPublic && (!req.user || roadmap.owner.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const items = await Item.find({ 
      roadmap: roadmap._id, 
      quarter: quarter.toUpperCase(),
      tenant: req.tenantId
    }).sort({ order: 1, createdAt: 1 });

    res.json({
      roadmap: {
        title: roadmap.title,
        description: roadmap.description,
        slug: roadmap.slug
      },
      quarter: quarter.toUpperCase(),
      items
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  getItemsByQuarter
};