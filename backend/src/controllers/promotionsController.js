const { Promotion, Product, Category } = require('../models');
const { Op } = require('sequelize');

// Get all promotions
exports.getPromotions = async (req, res, next) => {
  try {
    const { is_active, current } = req.query;
    const where = {};

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    // Get only current/active promotions
    if (current === 'true') {
      const now = new Date();
      where.start_date = { [Op.lte]: now };
      where.end_date = { [Op.gte]: now };
      where.is_active = 1;
    }

    const promotions = await Promotion.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'unit_price']
        }
      ],
      order: [['start_date', 'DESC']]
    });

    res.json({ data: promotions });
  } catch (error) {
    console.error('Get promotions error:', error);
    next(error);
  }
};

// Create promotion
exports.createPromotion = async (req, res, next) => {
  try {
    const {
      name,
      product_id,
      category_id,
      discount_type,
      discount_value,
      start_date,
      end_date,
      description
    } = req.body;

    // Validate required fields
    if (!name || !discount_type || discount_value === undefined || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Missing required fields: name, discount_type, discount_value, start_date, end_date',
        code: 400
      });
    }

    // Must have either product_id or category_id
    if (!product_id && !category_id) {
      return res.status(400).json({
        error: 'Either product_id or category_id is required',
        code: 400
      });
    }

    // Validate discount type
    if (!['percentage', 'fixed'].includes(discount_type)) {
      return res.status(400).json({
        error: 'Invalid discount_type. Must be "percentage" or "fixed"',
        code: 400
      });
    }

    // Validate discount value
    if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
      return res.status(400).json({
        error: 'Percentage discount must be between 0 and 100',
        code: 400
      });
    }

    // Check if product exists (if product_id provided)
    if (product_id) {
      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          error: 'Product not found',
          code: 404
        });
      }
    }

    // Create promotion
    const promotion = await Promotion.create({
      name,
      product_id: product_id ? parseInt(product_id) : null,
      category_id: category_id ? parseInt(category_id) : null,
      discount_type,
      discount_value: parseFloat(discount_value),
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      description: description || null,
      is_active: 1,
      created_by: req.user.id
    });

    // Fetch complete promotion with product
    const completePromotion = await Promotion.findByPk(promotion.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'unit_price']
        }
      ]
    });

    res.status(201).json({ data: completePromotion });
  } catch (error) {
    console.error('Create promotion error:', error);
    next(error);
  }
};

// Update promotion
exports.updatePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        error: 'Promotion not found',
        code: 404
      });
    }

    await promotion.update(req.body);

    // Fetch updated promotion with product
    const updatedPromotion = await Promotion.findByPk(promotion.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'unit_price']
        }
      ]
    });

    res.json({ data: updatedPromotion });
  } catch (error) {
    console.error('Update promotion error:', error);
    next(error);
  }
};

// Delete promotion
exports.deletePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        error: 'Promotion not found',
        code: 404
      });
    }

    await promotion.update({ is_active: 0 });

    res.json({
      data: { message: 'Promotion deactivated successfully' }
    });
  } catch (error) {
    console.error('Delete promotion error:', error);
    next(error);
  }
};
