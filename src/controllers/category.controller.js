const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get all categories
 * @route GET /api/categories
 * @access Public
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        subCategories: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID or slug
 * @route GET /api/categories/:idOrSlug
 * @access Public
 */
const getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    // Check if the parameter is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    // Query by ID or slug
    const category = await prisma.category.findFirst({
      where: isUuid 
        ? { id: idOrSlug } 
        : { slug: idOrSlug },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        subCategories: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            rating: true,
            reviewCount: true
          }
        }
      }
    });

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category
 * @route POST /api/categories
 * @access Private
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, parentId } = req.body;

    // Check if category with the same name or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name },
          { slug }
        ]
      }
    });

    if (existingCategory) {
      res.status(400);
      throw new Error('Category with this name or slug already exists');
    }

    // Create new category
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId
      }
    });

    logger.info(`Category created: ${category.name}`);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 * @route PUT /api/categories/:id
 * @access Private
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parentId } = req.body;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name || category.name,
        slug: slug || category.slug,
        description: description !== undefined ? description : category.description,
        parentId: parentId !== undefined ? parentId : category.parentId
      }
    });

    logger.info(`Category updated: ${updatedCategory.name}`);
    res.json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category
 * @route DELETE /api/categories/:id
 * @access Private
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
        subCategories: true
      }
    });

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    // Check if category has products
    if (category.products.length > 0) {
      res.status(400);
      throw new Error('Cannot delete category with products');
    }

    // Check if category has subcategories
    if (category.subCategories.length > 0) {
      res.status(400);
      throw new Error('Cannot delete category with subcategories');
    }

    // Delete category
    await prisma.category.delete({
      where: { id }
    });

    logger.info(`Category deleted: ${category.name}`);
    res.json({ message: 'Category removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory
};