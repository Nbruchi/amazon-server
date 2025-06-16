const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get all products with pagination, filtering, and sorting
 * @route GET /api/products
 * @access Public
 */
const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category;
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Build filter object
    const filter = {
      AND: [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        },
        { price: { gte: minPrice, lte: maxPrice } }
      ]
    };

    // Add category filter if provided
    if (category) {
      filter.AND.push({
        category: {
          slug: category
        }
      });
    }

    // Get products
    const products = await prisma.product.findMany({
      where: filter,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    // Get total count
    const total = await prisma.product.count({
      where: filter
    });

    res.json({
      products,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID or slug
 * @route GET /api/products/:id
 * @access Public
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if id is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    const product = await prisma.product.findUnique({
      where: isUUID ? { id } : { slug: id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new product
 * @route POST /api/products
 * @access Private
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      discount,
      stock,
      isPrime,
      images,
      categoryId,
      brand,
      model,
      dimensions,
      weight,
      color,
      material,
      warranty,
      features
    } = req.body;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        discount: discount ? parseFloat(discount) : null,
        stock: parseInt(stock),
        isPrime: Boolean(isPrime),
        images: images || [],
        categoryId,
        brand,
        model,
        dimensions,
        weight,
        color,
        material,
        warranty,
        features: features || []
      }
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a product
 * @route PUT /api/products/:id
 * @access Private
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      discount,
      stock,
      isPrime,
      images,
      categoryId,
      brand,
      model,
      dimensions,
      weight,
      color,
      material,
      warranty,
      features
    } = req.body;

    // Check if product exists
    const productExists = await prisma.product.findUnique({
      where: { id }
    });

    if (!productExists) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Generate new slug if name is updated
    let slug = productExists.slug;
    if (name && name !== productExists.name) {
      slug = name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name || productExists.name,
        slug,
        description: description !== undefined ? description : productExists.description,
        price: price !== undefined ? parseFloat(price) : productExists.price,
        discount: discount !== undefined ? (discount ? parseFloat(discount) : null) : productExists.discount,
        stock: stock !== undefined ? parseInt(stock) : productExists.stock,
        isPrime: isPrime !== undefined ? Boolean(isPrime) : productExists.isPrime,
        images: images || productExists.images,
        categoryId: categoryId || productExists.categoryId,
        brand: brand !== undefined ? brand : productExists.brand,
        model: model !== undefined ? model : productExists.model,
        dimensions: dimensions !== undefined ? dimensions : productExists.dimensions,
        weight: weight !== undefined ? weight : productExists.weight,
        color: color !== undefined ? color : productExists.color,
        material: material !== undefined ? material : productExists.material,
        warranty: warranty !== undefined ? warranty : productExists.warranty,
        features: features || productExists.features
      }
    });

    res.json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a product
 * @route DELETE /api/products/:id
 * @access Private
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Delete product
    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Product removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top rated products
 * @route GET /api/products/top
 * @access Public
 */
const getTopProducts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const products = await prisma.product.findMany({
      where: {
        rating: { gte: 4 },
        isPublished: true
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' }
      ],
      take: limit,
      include: {
        category: true
      }
    });

    res.json(products);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a product review
 * @route POST /api/products/:id/reviews
 * @access Private
 */
const createProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, content } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Check if user already reviewed this product
    const alreadyReviewed = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: id
        }
      }
    });

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        title,
        content,
        user: {
          connect: { id: req.user.id }
        },
        product: {
          connect: { id }
        }
      }
    });

    // Update product rating
    const reviews = await prisma.review.findMany({
      where: { productId: id }
    });

    const avgRating = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;

    await prisma.product.update({
      where: { id },
      data: {
        rating: avgRating,
        reviewCount: reviews.length
      }
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts
};