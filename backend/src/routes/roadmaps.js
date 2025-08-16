const express = require('express');
const { body } = require('express-validator');
const {
  createRoadmap,
  getRoadmaps,
  getRoadmapBySlug,
  updateRoadmap,
  deleteRoadmap,
  getPublicRoadmaps
} = require('../controllers/roadmapController');
const auth = require('../middleware/auth');

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    return auth(req, res, next);
  }
  next();
};

router.get('/public', getPublicRoadmaps);

router.get('/', auth, getRoadmaps);

router.post('/', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('isPublic').optional().isBoolean()
], createRoadmap);

router.get('/:slug', optionalAuth, getRoadmapBySlug);

router.put('/:slug', auth, [
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('isPublic').optional().isBoolean()
], updateRoadmap);

router.delete('/:slug', auth, deleteRoadmap);

module.exports = router;