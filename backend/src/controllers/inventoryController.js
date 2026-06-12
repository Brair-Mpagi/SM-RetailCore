const { Inventory, Product, Category, StockMovement, Alert } = require('../models');
const { Op } = require('sequelize');

// Get all inventory
exports.getInventory = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search,
      low_stock,
      category 
    } = req.query;

    const offset = (page - 1) * limit;
    const productWhere = { is_deleted: 0, is_active: 1 };

    if (search) {
      productWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category) {
      productWhere.category_id = category;
    }

    const { count, rows } = await Inventory.findAndCountAll({
      include: [{
        model: Product,
        as: 'product',
        where: productWhere,
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name'] }
        ]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[{ model: Product, as: 'product' }, 'name', 'ASC']]
    });

    // Filter by low stock if requested
    let filteredRows = rows;
    if (low_stock === 'true') {
      filteredRows = rows.filter(inv => 
        inv.quantity_on_hand <= inv.product.reorder_point
      );
    }

    res.json({
      data: filteredRows,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: low_stock === 'true' ? filteredRows.length : count,
        pages: Math.ceil((low_stock === 'true' ? filteredRows.length : count) / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get product inventory
exports.getProductInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findOne({
      where: { product_id: req.params.productId },
      include: [{
        model: Product,
        as: 'product',
        include: [
          { model: Category, as: 'category' }
        ]
      }]
    });

    if (!inventory) {
      return res.status(404).json({ 
        error: 'Inventory not found', 
        code: 404 
      });
    }

    // Get recent stock movements
    const movements = await StockMovement.findAll({
      where: { product_id: req.params.productId },
      limit: 20,
      order: [['created_at', 'DESC']]
    });

    res.json({ 
      data: {
        ...inventory.toJSON(),
        recent_movements: movements
      }
    });
  } catch (error) {
    next(error);
  }
};

// Stock adjustment
exports.adjustStock = async (req, res, next) => {
  const transaction = await Inventory.sequelize.transaction();
  
  try {
    const { product_id, quantity, reason, notes } = req.body;

    if (!product_id || quantity === undefined || !reason) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Missing required fields', 
        code: 400 
      });
    }

    const inventory = await Inventory.findOne({
      where: { product_id },
      include: [{ model: Product, as: 'product' }]
    });

    if (!inventory) {
      await transaction.rollback();
      return res.status(404).json({ 
        error: 'Inventory not found', 
        code: 404 
      });
    }

    const newQuantity = inventory.quantity_on_hand + parseInt(quantity);

    if (newQuantity < 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Insufficient stock', 
        code: 400 
      });
    }

    // Update inventory
    await inventory.update({
      quantity_on_hand: newQuantity,
      last_updated: new Date()
    }, { transaction });

    // Log stock movement
    await StockMovement.create({
      product_id,
      type: 'adjust',
      quantity: parseInt(quantity),
      reason: `${reason}${notes ? ': ' + notes : ''}`,
      user_id: req.user.id
    }, { transaction });

    // Check if low stock alert needed
    if (newQuantity <= inventory.product.reorder_point) {
      await Alert.create({
        type: 'low_stock',
        product_id,
        message: `${inventory.product.name} is low on stock (${newQuantity} remaining)`,
        severity: newQuantity === 0 ? 'critical' : 'warning'
      }, { transaction });
    }

    await transaction.commit();

    res.json({ data: inventory });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
