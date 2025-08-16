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

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    return auth(req, res, next);
  }
  next();
};

router.get('/roadmap/:roadmapSlug/quarter/:quarter', optionalAuth, getItemsByQuarter);

router.get('/roadmap/:roadmapId', getItems);

router.post('/roadmap/:roadmapId', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('quarter').isIn(['Q1', 'Q2', 'Q3', 'Q4']).withMessage('Quarter must be Q1, Q2, Q3, or Q4'),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['planned', 'in-progress', 'completed', 'cancelled']),
  body('order').optional().isNumeric()
], createItem);

router.put('/:itemId', auth, [
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('quarter').optional().isIn(['Q1', 'Q2', 'Q3', 'Q4']),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['planned', 'in-progress', 'completed', 'cancelled']),
  body('order').optional().isNumeric()
], updateItem);

router.delete('/:itemId', auth, deleteItem);

module.exports = router;