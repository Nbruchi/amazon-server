const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} = require('../controllers/wishlist.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/wishlist
 * @desc Get user's wishlist
 * @access Private
 */
router.get('/', protect, getWishlist);

/**
 * @route POST /api/wishlist
 * @desc Add item to wishlist
 * @access Private
 */
router.post('/', protect, addToWishlist);

/**
 * @route DELETE /api/wishlist/:id
 * @desc Remove item from wishlist
 * @access Private
 */
router.delete('/:id', protect, removeFromWishlist);

/**
 * @route DELETE /api/wishlist
 * @desc Clear wishlist
 * @access Private
 */
router.delete('/', protect, clearWishlist);

module.exports = router;