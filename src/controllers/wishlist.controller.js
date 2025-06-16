const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get user's wishlist
 * @route GET /api/wishlist
 * @access Private
 */
const getWishlist = async (req, res, next) => {
  try {
    // Find user's wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                discount: true,
                images: true,
                rating: true,
                reviewCount: true,
                stock: true,
                isPrime: true
              }
            }
          }
        }
      }
    });

    // If wishlist doesn't exist, create an empty one
    if (!wishlist) {
      const newWishlist = await prisma.wishlist.create({
        data: {
          user: {
            connect: { id: req.user.id }
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  discount: true,
                  images: true,
                  rating: true,
                  reviewCount: true,
                  stock: true,
                  isPrime: true
                }
              }
            }
          }
        }
      });

      return res.json(newWishlist);
    }

    res.json(wishlist);
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to wishlist
 * @route POST /api/wishlist
 * @access Private
 */
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      res.status(400);
      throw new Error('Product ID is required');
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Find user's wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.user.id }
    });

    // If wishlist doesn't exist, create it
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          user: {
            connect: { id: req.user.id }
          }
        }
      });
    }

    // Check if item already exists in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId
        }
      }
    });

    if (existingItem) {
      res.status(400);
      throw new Error('Product already in wishlist');
    }

    // Add item to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlist: {
          connect: { id: wishlist.id }
        },
        product: {
          connect: { id: productId }
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discount: true,
            images: true,
            rating: true,
            reviewCount: true,
            stock: true,
            isPrime: true
          }
        }
      }
    });

    logger.info(`Item added to wishlist: ${wishlistItem.id}`);
    res.status(201).json(wishlistItem);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from wishlist
 * @route DELETE /api/wishlist/:id
 * @access Private
 */
const removeFromWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find user's wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.user.id }
    });

    if (!wishlist) {
      res.status(404);
      throw new Error('Wishlist not found');
    }

    // Check if item exists in wishlist
    const wishlistItem = await prisma.wishlistItem.findFirst({
      where: {
        id,
        wishlistId: wishlist.id
      }
    });

    if (!wishlistItem) {
      res.status(404);
      throw new Error('Item not found in wishlist');
    }

    // Remove item from wishlist
    await prisma.wishlistItem.delete({
      where: { id }
    });

    logger.info(`Item removed from wishlist: ${id}`);
    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear wishlist
 * @route DELETE /api/wishlist
 * @access Private
 */
const clearWishlist = async (req, res, next) => {
  try {
    // Find user's wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.user.id }
    });

    if (!wishlist) {
      res.status(404);
      throw new Error('Wishlist not found');
    }

    // Delete all items in wishlist
    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id }
    });

    logger.info(`Wishlist cleared for user: ${req.user.id}`);
    res.json({ message: 'Wishlist cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};