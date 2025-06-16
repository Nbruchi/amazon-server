const express = require('express');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  getAllOrders
} = require('../controllers/order.controller');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

// All order routes are protected
router.use(protect);

/**
 * @route POST /api/orders
 * @desc Create a new order
 * @access Private
 */
router.post('/', createOrder);

/**
 * @route GET /api/orders
 * @desc Get all user orders
 * @access Private
 */
router.get('/', getUserOrders);

/**
 * @route GET /api/orders/admin
 * @desc Get all orders (admin only)
 * @access Private
 */
router.get('/admin', admin, getAllOrders);

/**
 * @route GET /api/orders/:id
 * @desc Get order by ID
 * @access Private
 */
router.get('/:id', getOrderById);

/**
 * @route PUT /api/orders/:id/status
 * @desc Update order status
 * @access Private
 */
router.put('/:id/status', admin, updateOrderStatus);

/**
 * @route PUT /api/orders/:id/payment
 * @desc Update payment status
 * @access Private
 */
router.put('/:id/payment', admin, updatePaymentStatus);

module.exports = router;