const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get all users (admin only)
 * @route GET /api/users
 * @access Private
 */
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.user.count({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
    });

    res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 * @route GET /api/users/:id
 * @access Private
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        addresses: true,
        paymentMethods: {
          select: {
            id: true,
            type: true,
            cardLastFour: true,
            cardBrand: true,
            isDefault: true
          }
        },
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (admin only)
 * @route PUT /api/users/:id
 * @access Private
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || user.name,
        email: email || user.email,
        role: role || user.role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (admin only)
 * @route DELETE /api/users/:id
 * @access Private
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent deleting self
    if (id === req.user.id) {
      res.status(400);
      throw new Error('Cannot delete your own account');
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Add address
 * @route POST /api/users/addresses
 * @access Private
 */
const addAddress = async (req, res, next) => {
  try {
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault
    } = req.body;

    // Validate required fields
    if (!name || !addressLine1 || !city || !state || !postalCode || !country) {
      res.status(400);
      throw new Error('Please fill all required fields');
    }

    // If setting as default, update all other addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: req.user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Create address
    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        name,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault: isDefault || false
      }
    });

    res.status(201).json(address);
  } catch (error) {
    next(error);
  }
};

/**
 * Update address
 * @route PUT /api/users/addresses/:id
 * @access Private
 */
const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault
    } = req.body;

    // Check if address exists and belongs to user
    const address = await prisma.address.findUnique({
      where: { id }
    });

    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    if (address.userId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to update this address');
    }

    // If setting as default, update all other addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: req.user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Update address
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        name: name || address.name,
        addressLine1: addressLine1 || address.addressLine1,
        addressLine2: addressLine2 !== undefined ? addressLine2 : address.addressLine2,
        city: city || address.city,
        state: state || address.state,
        postalCode: postalCode || address.postalCode,
        country: country || address.country,
        phone: phone !== undefined ? phone : address.phone,
        isDefault: isDefault !== undefined ? isDefault : address.isDefault
      }
    });

    res.json(updatedAddress);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete address
 * @route DELETE /api/users/addresses/:id
 * @access Private
 */
const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const address = await prisma.address.findUnique({
      where: { id }
    });

    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    if (address.userId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to delete this address');
    }

    // Delete address
    await prisma.address.delete({
      where: { id }
    });

    res.json({ message: 'Address deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Add payment method
 * @route POST /api/users/payment-methods
 * @access Private
 */
const addPaymentMethod = async (req, res, next) => {
  try {
    const {
      type,
      cardLastFour,
      cardBrand,
      expiryMonth,
      expiryYear,
      isDefault
    } = req.body;

    // Validate required fields
    if (!type) {
      res.status(400);
      throw new Error('Payment type is required');
    }

    // Validate card details if type is credit or debit card
    if ((type === 'CREDIT_CARD' || type === 'DEBIT_CARD') && 
        (!cardLastFour || !cardBrand || !expiryMonth || !expiryYear)) {
      res.status(400);
      throw new Error('Card details are required');
    }

    // If setting as default, update all other payment methods
    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: {
          userId: req.user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Create payment method
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId: req.user.id,
        type,
        cardLastFour,
        cardBrand,
        expiryMonth,
        expiryYear,
        isDefault: isDefault || false
      }
    });

    res.status(201).json(paymentMethod);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete payment method
 * @route DELETE /api/users/payment-methods/:id
 * @access Private
 */
const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if payment method exists and belongs to user
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id }
    });

    if (!paymentMethod) {
      res.status(404);
      throw new Error('Payment method not found');
    }

    if (paymentMethod.userId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to delete this payment method');
    }

    // Delete payment method
    await prisma.paymentMethod.delete({
      where: { id }
    });

    res.json({ message: 'Payment method deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  addAddress,
  updateAddress,
  deleteAddress,
  addPaymentMethod,
  deletePaymentMethod
};