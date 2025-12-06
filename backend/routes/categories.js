const express = require('express');
const Category = require('../models/Category');
const { validateCreateCategory, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all categories for user
// @route   GET /api/categories
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { type, active = 'true' } = req.query;
    
    const query = { userId: req.user._id };
    if (type) query.type = type;
    if (active !== 'all') query.isActive = active === 'true';

    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
router.post('/', validateCreateCategory, async (req, res, next) => {
  try {
    const categoryData = {
      ...req.body,
      userId: req.user._id
    };

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;