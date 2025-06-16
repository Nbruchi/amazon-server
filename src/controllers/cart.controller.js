const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get user cart
 * @route GET /api/cart
 * @access Private
 */
const getCart = async (req, res, next) => {
  try {
    // Get user cart with items and product details
    const cart = await prisma.cart.findUnique({
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
                stock: true,
                isPrime: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      // Create a new cart if it doesn't exist
      const newCart = await prisma.cart.create({
        data: {
          userId: req.user.id
        },
        include: {
          items: true
        }
      });

      return res.json({
        id: newCart.id,
        items: [],
        subtotal: 0,
        itemCount: 0
      });
    }

    // Calculate subtotal and item count
    const subtotal = cart.items.reduce(
      (sum, item) => sum + (item.product.price * item.quantity), 
      0
    );

    const itemCount = cart.items.reduce(
      (sum, item) => sum + item.quantity, 
      0
    );

    res.json({
      id: cart.id,
      items: cart.items,
      subtotal,
      itemCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * @route POST /api/cart
 * @access Private
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate input
    if (!productId) {
      res.status(400);
      throw new Error('Product ID is required');
    }

    // Check if product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      res.status(400);
      throw new Error('Product is out of stock');
    }

    // Get or create user cart
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: req.user.id
        }
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });

    let cartItem;

    if (existingItem) {
      // Update quantity if item already exists
      cartItem = await prisma.cartItem.update({
        where: {
          id: existingItem.id
        },
        data: {
          quantity: existingItem.quantity + quantity
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
              stock: true,
              isPrime: true
            }
          }
        }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity
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
              stock: true,
              isPrime: true
            }
          }
        }
      });
    }

    res.status(201).json(cartItem);
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 * @route PUT /api/cart/:id
 * @access Private
 */
const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    // Validate input
    if (!quantity || quantity < 1) {
      res.status(400);
      throw new Error('Quantity must be at least 1');
    }

    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        product: true
      }
    });

    if (!cartItem) {
      res.status(404);
      throw new Error('Cart item not found');
    }

    // Check if cart belongs to user
    if (cartItem.cart.userId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to update this cart');
    }

    // Check if product is in stock
    if (cartItem.product.stock < quantity) {
      res.status(400);
      throw new Error('Product is out of stock');
    }

    // Update cart item
    const updatedCartItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discount: true,
            images: true,
            stock: true,
            isPrime: true
          }
        }
      }
    });

    res.json(updatedCartItem);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * @route DELETE /api/cart/:id
 * @access Private
 */
const removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true
      }
    });

    if (!cartItem) {
      res.status(404);
      throw new Error('Cart item not found');
    }

    // Check if cart belongs to user
    if (cartItem.cart.userId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to update this cart');
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id }
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 * @route DELETE /api/cart
 * @access Private
 */
const clearCart = async (req, res, next) => {
  try {
    // Get user cart
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id }
    });

    if (!cart) {
      return res.json({ message: 'Cart is already empty' });
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};