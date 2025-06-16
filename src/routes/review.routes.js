const express = require('express');
const {
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  markReviewHelpful
} = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/reviews
 * @desc Get all reviews with filtering and pagination
 * @access Public
 */
router.get('/', getReviews);

/**
 * @route GET /api/reviews/:id
 * @desc Get review by ID
 * @access Public
 */
router.get('/:id', getReviewById);

/**
 * @route PUT /api/reviews/:id
 * @desc Update a review
 * @access Private
 */
router.put('/:id', protect, updateReview);

/**
 * @route DELETE /api/reviews/:id
 * @desc Delete a review
 * @access Private
 */
router.delete('/:id', protect, deleteReview);

/**
 * @route POST /api/reviews/:id/helpful
 * @desc Mark a review as helpful
 * @access Private
 */
router.post('/:id/helpful', protect, markReviewHelpful);

module.exports = router;