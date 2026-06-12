const { Category } = require('../models');

// Get all categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    res.json({ data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    next(error);
  }
};

// Get single category
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found', 
        code: 404 
      });
    }

    res.json({ data: category });
  } catch (error) {
    console.error('Get category error:', error);
    next(error);
  }
};

// Create category
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Category name is required', 
        code: 400 
      });
    }

    const category = await Category.create({
      name,
      description: description || null
    });

    res.status(201).json({ data: category });
  } catch (error) {
    console.error('Create category error:', error);
    next(error);
  }
};

// Update category
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found', 
        code: 404 
      });
    }

    await category.update(req.body);

    res.json({ data: category });
  } catch (error) {
    console.error('Update category error:', error);
    next(error);
  }
};

// Delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found', 
        code: 404 
      });
    }

    await category.destroy();

    res.json({ 
      data: { message: 'Category deleted successfully' } 
    });
  } catch (error) {
    console.error('Delete category error:', error);
    next(error);
  }
};
