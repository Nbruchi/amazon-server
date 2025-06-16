const express = require('express');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  addAddress,
  updateAddress,
  deleteAddress,
  addPaymentMethod,
  deletePaymentMethod
} = require('../controllers/user.controller');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Private
 */
router.get('/', protect, admin, getUsers);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get('/:id', protect, admin, getUserById);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private
 */
router.put('/:id', protect, admin, updateUser);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Private
 */
router.delete('/:id', protect, admin, deleteUser);

/**
 * @route POST /api/users/addresses
 * @desc Add address
 * @access Private
 */
router.post('/addresses', protect, addAddress);

/**
 * @route PUT /api/users/addresses/:id
 * @desc Update address
 * @access Private
 */
router.put('/addresses/:id', protect, updateAddress);

/**
 * @route DELETE /api/users/addresses/:id
 * @desc Delete address
 * @access Private
 */
router.delete('/addresses/:id', protect, deleteAddress);

/**
 * @route POST /api/users/payment-methods
 * @desc Add payment method
 * @access Private
 */
router.post('/payment-methods', protect, addPaymentMethod);

/**
 * @route DELETE /api/users/payment-methods/:id
 * @desc Delete payment method
 * @access Private
 */
router.delete('/payment-methods/:id', protect, deletePaymentMethod);

module.exports = router;