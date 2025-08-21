const { validationResult } = require('express-validator');
const { Roadmap, Item } = require('../models');
const redisService = require('../services/redis');

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

    // Invalidate home data cache for this tenant
    await redisService.invalidateHomeData(req.tenantId);

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

    // Invalidate home data cache for this tenant
    await redisService.invalidateHomeData(req.tenantId);

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

    // Invalidate home data cache for this tenant
    await redisService.invalidateHomeData(req.tenantId);

    res.json({ message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPublicRoadmaps = async (req, res) => {
  try {
    // For main domain (no tenant), return empty array - should show marketing page
    if (!req.tenantId) {
      return res.json([]);
    }
    
    const roadmaps = await Roadmap.find({ isPublic: true, tenant: req.tenantId })
      .populate('owner', 'email')
      .sort({ createdAt: -1 });

    res.json(roadmaps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Optimized endpoint for home page - fetches all data in one call with Redis caching
const getHomePageData = async (req, res) => {
  try {
    const hostname = req.hostname || 'localhost';
    const tenantId = req.tenantId;
    
    // Try to get cached data first
    const cachedData = await redisService.getHomeData(tenantId, hostname);
    if (cachedData) {
      console.log(`Cache HIT for home data: tenant=${tenantId}, hostname=${hostname}`);
      return res.json(cachedData);
    }
    
    console.log(`Cache MISS for home data: tenant=${tenantId}, hostname=${hostname}`);
    
    // For main domain (no tenant), return marketing page data
    if (!tenantId) {
      const mainDomainData = {
        tenant: {
          name: 'fore',
          subdomain: null,
          domainInfo: {
            hostname: hostname,
            isMainDomain: true,
            isSubdomain: false,
            isCustomDomain: false
          },
          settings: {
            logo: null,
            favicon: null,
            primaryColor: null,
            secondaryColor: null,
            theme: 'light',
            customCSS: null,
            allowPublicVoting: false,
            contactEmail: null,
            supportUrl: null,
            timezone: 'UTC'
          }
        },
        roadmaps: [],
        items: [],
        firstRoadmapSlug: null
      };
      
      // Cache main domain data for 5 minutes
      await redisService.setHomeData(tenantId, hostname, mainDomainData, 300);
      return res.json(mainDomainData);
    }
    
    // Get tenant info
    const tenant = req.tenant;
    
    // If we have a tenant, this is not the main domain (regardless of hostname)
    const isMainDomain = !tenantId && (hostname === 'forehq.com' || hostname === 'www.forehq.com' || hostname.includes('localhost') || hostname.includes('127.0.0.1'));
    const isSubdomain = hostname.endsWith('.forehq.com') && !isMainDomain;
    const isCustomDomain = !isMainDomain && !isSubdomain;
    
    // Get all public roadmaps for this tenant
    const roadmaps = await Roadmap.find({ isPublic: true, tenant: tenantId })
      .populate('owner', 'email')
      .sort({ createdAt: -1 });
    
    // Get all items for these roadmaps in one query (much more efficient)
    const roadmapIds = roadmaps.map(r => r._id);
    const items = await Item.find({ 
      roadmap: { $in: roadmapIds },
      tenant: tenantId 
    })
    .populate('roadmap', 'title slug')
    .sort({ order: 1, createdAt: 1 });
    
    // Add roadmap info to items
    const itemsWithRoadmapInfo = items.map(item => ({
      ...item.toJSON(),
      roadmapTitle: item.roadmap.title,
      roadmapSlug: item.roadmap.slug
    }));
    
    const responseData = {
      tenant: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        domainInfo: {
          hostname: hostname,
          isMainDomain: isMainDomain,
          isSubdomain: isSubdomain,
          isCustomDomain: isCustomDomain
        },
        settings: {
          logo: tenant.settings.logo,
          favicon: tenant.settings.favicon,
          primaryColor: tenant.settings.primaryColor,
          secondaryColor: tenant.settings.secondaryColor,
          theme: tenant.settings.theme,
          customCSS: tenant.settings.customCSS,
          allowPublicVoting: tenant.settings.allowPublicVoting,
          contactEmail: tenant.settings.contactEmail,
          supportUrl: tenant.settings.supportUrl,
          timezone: tenant.settings.timezone
        }
      },
      roadmaps: roadmaps,
      items: itemsWithRoadmapInfo,
      firstRoadmapSlug: roadmaps.length > 0 ? roadmaps[0].slug : null
    };
    
    // Cache the response data for 5 minutes
    await redisService.setHomeData(tenantId, hostname, responseData, 300);
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Get home page data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get home page data'
    });
  }
};

const getPublicRoadmapsWithItems = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ isPublic: true, tenant: req.tenantId })
      .populate('owner', 'email')
      .sort({ createdAt: -1 });

    const roadmapsWithItems = await Promise.all(
      roadmaps.map(async (roadmap) => {
        const items = await Item.find({ roadmap: roadmap._id, tenant: req.tenantId }).sort({ order: 1, createdAt: 1 });
        return {
          ...roadmap.toJSON(),
          items
        };
      })
    );

    res.json(roadmapsWithItems);
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
  getPublicRoadmaps,
  getHomePageData,
  getPublicRoadmapsWithItems
};