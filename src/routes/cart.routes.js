const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All cart routes are protected
router.use(protect);

/**
 * @route GET /api/cart
 * @desc Get user cart
 * @access Private
 */
router.get('/', getCart);

/**
 * @route POST /api/cart
 * @desc Add item to cart
 * @access Private
 */
router.post('/', addToCart);

/**
 * @route PUT /api/cart/:id
 * @desc Update cart item quantity
 * @access Private
 */
router.put('/:id', updateCartItem);

/**
 * @route DELETE /api/cart/:id
 * @desc Remove item from cart
 * @access Private
 */
router.delete('/:id', removeFromCart);

/**
 * @route DELETE /api/cart
 * @desc Clear cart
 * @access Private
 */
router.delete('/', clearCart);

module.exports = router;