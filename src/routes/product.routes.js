const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts
} = require('../controllers/product.controller');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/products
 * @desc Get all products with pagination, filtering, and sorting
 * @access Public
 */
router.get('/', getProducts);

/**
 * @route GET /api/products/top
 * @desc Get top rated products
 * @access Public
 */
router.get('/top', getTopProducts);

/**
 * @route GET /api/products/:id
 * @desc Get product by ID or slug
 * @access Public
 */
router.get('/:id', getProductById);

/**
 * @route POST /api/products
 * @desc Create a new product
 * @access Private
 */
router.post('/', protect, admin, createProduct);

/**
 * @route PUT /api/products/:id
 * @desc Update a product
 * @access Private
 */
router.put('/:id', protect, admin, updateProduct);

/**
 * @route DELETE /api/products/:id
 * @desc Delete a product
 * @access Private
 */
router.delete('/:id', protect, admin, deleteProduct);

/**
 * @route POST /api/products/:id/reviews
 * @desc Create a product review
 * @access Private
 */
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;