const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const emailService = require('../utils/email/emailService');

const prisma = new PrismaClient();

/**
 * Create a new order
 * @route POST /api/orders
 * @access Private
 */
const createOrder = async (req, res, next) => {
  try {
    const {
      shippingAddressId,
      billingAddressId,
      paymentMethodId,
      shippingMethod,
      notes
    } = req.body;

    // Get user cart
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      res.status(400);
      throw new Error('No items in cart');
    }

    // Check if all items are in stock
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        res.status(400);
        throw new Error(`${item.product.name} is out of stock`);
      }
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + (item.product.price * item.quantity),
      0
    );

    // Create order
    const order = await prisma.$transaction(async (prisma) => {
      // Create order
      const newOrder = await prisma.order.create({
        data: {
          userId: req.user.id,
          total,
          shippingAddressId,
          billingAddressId,
          paymentMethodId,
          shippingMethod,
          notes,
          status: 'PENDING',
          paymentStatus: 'PENDING'
        }
      });

      // Create order items
      for (const item of cart.items) {
        await prisma.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
          }
        });

        // Update product stock
        await prisma.product.update({
          where: { id: item.product.id },
          data: {
            stock: item.product.stock - item.quantity
          }
        });
      }

      // Clear cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return newOrder;
    });

    // Get complete order with items
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        paymentMethod: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Send order confirmation email
    try {
      await emailService.sendOrderConfirmationEmail(completeOrder.user, completeOrder);
      logger.info(`Order confirmation email sent to ${completeOrder.user.email}`);
    } catch (emailError) {
      logger.error(`Error sending order confirmation email: ${emailError.message}`);
      // Don't throw error, continue with order creation
    }

    res.status(201).json(completeOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user orders
 * @route GET /api/orders
 * @access Private
 */
const getUserOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 * @route GET /api/orders/:id
 * @access Private
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true
              }
            }
          }
        },
        shippingAddress: true,
        billingAddress: true,
        paymentMethod: true
      }
    });

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Check if order belongs to user or user is admin
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403);
      throw new Error('Not authorized to access this order');
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * @route PUT /api/orders/:id/status
 * @access Private
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
    if (!validStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * Update payment status
 * @route PUT /api/orders/:id/payment
 * @access Private
 */
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    // Validate payment status
    const validStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
    if (!validStatuses.includes(paymentStatus)) {
      res.status(400);
      throw new Error('Invalid payment status');
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Update payment status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { paymentStatus }
    });

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders (admin only)
 * @route GET /api/orders/admin
 * @access Private
 */
const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.order.count();

    res.json({
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  getAllOrders
};
