const { validationResult } = require('express-validator');
const { Roadmap, Item } = require('../models');

const generateSlug = (title) => {
  return title.toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

const createRoadmap = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, isPublic = true } = req.body;
    let slug = generateSlug(title);
    
    let existingRoadmap = await Roadmap.findOne({ slug, tenant: req.tenantId });
    let counter = 1;
    while (existingRoadmap) {
      slug = `${generateSlug(title)}-${counter}`;
      existingRoadmap = await Roadmap.findOne({ slug, tenant: req.tenantId });
      counter++;
    }

    const roadmap = new Roadmap({
      title,
      description,
      owner: req.user._id,
      tenant: req.tenantId,
      isPublic,
      slug
    });

    await roadmap.save();
    await roadmap.populate('owner', 'email');

    res.status(201).json(roadmap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ owner: req.user._id, tenant: req.tenantId })
      .populate('owner', 'email')
      .sort({ createdAt: -1 });

    res.json(roadmaps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRoadmapBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const roadmap = await Roadmap.findOne({ slug, tenant: req.tenantId })
      .populate('owner', 'email');

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    if (!roadmap.isPublic && (!req.user || roadmap.owner._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const items = await Item.find({ roadmap: roadmap._id, tenant: req.tenantId }).sort({ order: 1, createdAt: 1 });
    
    res.json({
      ...roadmap.toJSON(),
      items
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateRoadmap = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slug } = req.params;
    const { title, description, isPublic } = req.body;

    const roadmap = await Roadmap.findOne({ slug, tenant: req.tenantId });
    
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    if (roadmap.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (title && title !== roadmap.title) {
      let newSlug = generateSlug(title);
      let existingRoadmap = await Roadmap.findOne({ slug: newSlug, tenant: req.tenantId });
      let counter = 1;
      while (existingRoadmap && existingRoadmap._id.toString() !== roadmap._id.toString()) {
        newSlug = `${generateSlug(title)}-${counter}`;
        existingRoadmap = await Roadmap.findOne({ slug: newSlug, tenant: req.tenantId });
        counter++;
      }
      roadmap.slug = newSlug;
      roadmap.title = title;
    }

    if (description !== undefined) roadmap.description = description;
    if (isPublic !== undefined) roadmap.isPublic = isPublic;

    await roadmap.save();
    await roadmap.populate('owner', 'email');

    res.json(roadmap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteRoadmap = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const roadmap = await Roadmap.findOne({ slug, tenant: req.tenantId });
    
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    if (roadmap.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Item.deleteMany({ roadmap: roadmap._id, tenant: req.tenantId });
    await Roadmap.findByIdAndDelete(roadmap._id);

    res.json({ message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPublicRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ isPublic: true, tenant: req.tenantId })
      .populate('owner', 'email')
      .sort({ createdAt: -1 });

    res.json(roadmaps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createRoadmap,
  getRoadmaps,
  getRoadmapBySlug,
  updateRoadmap,
  deleteRoadmap,
  getPublicRoadmaps
};