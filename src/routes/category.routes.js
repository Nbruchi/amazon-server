const express = require('express');
const {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category.controller');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/categories
 * @desc Get all categories
 * @access Public
 */
router.get('/', getCategories);

/**
 * @route GET /api/categories/:idOrSlug
 * @desc Get category by ID or slug
 * @access Public
 */
router.get('/:idOrSlug', getCategoryByIdOrSlug);

/**
 * @route POST /api/categories
 * @desc Create a new category
 * @access Private
 */
router.post('/', protect, admin, createCategory);

/**
 * @route PUT /api/categories/:id
 * @desc Update a category
 * @access Private
 */
router.put('/:id', protect, admin, updateCategory);

/**
 * @route DELETE /api/categories/:id
 * @desc Delete a category
 * @access Private
 */
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;