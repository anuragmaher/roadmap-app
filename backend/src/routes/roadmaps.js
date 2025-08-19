const express = require('express');
const { body } = require('express-validator');
const {
  createRoadmap,
  getRoadmaps,
  getRoadmapBySlug,
  updateRoadmap,
  deleteRoadmap,
  getPublicRoadmaps,
  getHomePageData
} = require('../controllers/roadmapController');
const auth = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    return auth(req, res, next);
  }
  next();
};

router.get('/home-data', resolveTenant, getHomePageData);

router.get('/public', resolveTenant, getPublicRoadmaps);

router.get('/', resolveTenant, auth, getRoadmaps);

router.post('/', resolveTenant, auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('isPublic').optional().isBoolean()
], createRoadmap);

router.get('/:slug', resolveTenant, optionalAuth, getRoadmapBySlug);

router.put('/:slug', resolveTenant, auth, [
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('isPublic').optional().isBoolean()
], updateRoadmap);

router.delete('/:slug', resolveTenant, auth, deleteRoadmap);

module.exports = router;