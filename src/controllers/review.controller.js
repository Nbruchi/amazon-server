const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get all reviews
 * @route GET /api/reviews
 * @access Public
 */
const getReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const productId = req.query.productId;
    const userId = req.query.userId;

    // Build filter object
    const filter = {};
    
    if (productId) {
      filter.productId = productId;
    }
    
    if (userId) {
      filter.userId = userId;
    }

    // Get reviews
    const reviews = await prisma.review.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count
    const total = await prisma.review.count({
      where: filter
    });

    res.json({
      reviews,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get review by ID
 * @route GET /api/reviews/:id
 * @access Public
 */
const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true
          }
        }
      }
    });

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    res.json(review);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a review
 * @route PUT /api/reviews/:id
 * @access Private
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, content } = req.body;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: true
      }
    });

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    // Check if user is the owner of the review
    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403);
      throw new Error('Not authorized to update this review');
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating: rating ? parseInt(rating) : review.rating,
        title: title !== undefined ? title : review.title,
        content: content || review.content
      }
    });

    // Update product rating if rating changed
    if (rating && parseInt(rating) !== review.rating) {
      const reviews = await prisma.review.findMany({
        where: { productId: review.productId }
      });

      const avgRating = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          rating: avgRating
        }
      });
    }

    logger.info(`Review updated: ${id}`);
    res.json(updatedReview);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a review
 * @route DELETE /api/reviews/:id
 * @access Private
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    // Check if user is the owner of the review
    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403);
      throw new Error('Not authorized to delete this review');
    }

    // Delete review
    await prisma.review.delete({
      where: { id }
    });

    // Update product rating
    const reviews = await prisma.review.findMany({
      where: { productId: review.productId }
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          rating: avgRating,
          reviewCount: reviews.length
        }
      });
    } else {
      // If no reviews left, reset rating to 0
      await prisma.product.update({
        where: { id: review.productId },
        data: {
          rating: 0,
          reviewCount: 0
        }
      });
    }

    logger.info(`Review deleted: ${id}`);
    res.json({ message: 'Review removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a review as helpful
 * @route POST /api/reviews/:id/helpful
 * @access Private
 */
const markReviewHelpful = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    // Increment helpful count
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        helpful: review.helpful + 1
      }
    });

    res.json(updatedReview);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  markReviewHelpful
};