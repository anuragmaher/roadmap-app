const express = require('express');
const { body } = require('express-validator');
const {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  getItemsByQuarter
} = require('../controllers/itemController');
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

router.get('/roadmap/:roadmapSlug/quarter/:quarter', resolveTenant, optionalAuth, getItemsByQuarter);

router.get('/roadmap/:roadmapId', resolveTenant, getItems);

router.post('/roadmap/:roadmapId', resolveTenant, auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('quarter').matches(/^\d{4}-Q[1-4]$|^Q[1-4]$/).withMessage('Quarter must be in format YYYY-QN (e.g., "2025-Q1") or legacy format (e.g., "Q1")'),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['planned', 'in-progress', 'completed', 'cancelled']),
  body('order').optional().isNumeric(),
  body('image').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return true;
    throw new Error('Image must be a string or null');
  })
], createItem);

router.put('/:itemId', resolveTenant, auth, [
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('quarter').optional().matches(/^\d{4}-Q[1-4]$|^Q[1-4]$/),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['planned', 'in-progress', 'completed', 'cancelled']),
  body('order').optional().isNumeric(),
  body('image').optional({ nullable: true }).custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return true;
    throw new Error('Image must be a string or null');
  })
], updateItem);

router.delete('/:itemId', resolveTenant, auth, deleteItem);

module.exports = router;