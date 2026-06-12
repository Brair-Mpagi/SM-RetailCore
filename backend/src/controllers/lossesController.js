const { Loss, Product, Inventory, StockMovement, AuditLog } = require('../models');
const { Op } = require('sequelize');

// Get all losses
exports.getLosses = async (req, res, next) => {
  try {
    const { start_date, end_date, reason, product_id } = req.query;
    const where = {};

    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    if (reason) {
      where.reason = reason;
    }

    if (product_id) {
      where.product_id = product_id;
    }

    const losses = await Loss.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'unit_price', 'cost_price']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ data: losses });
  } catch (error) {
    console.error('Get losses error:', error);
    next(error);
  }
};

// Create loss
exports.createLoss = async (req, res, next) => {
  const transaction = await Loss.sequelize.transaction();

  try {
    const { product_id, quantity, reason, notes } = req.body;

    // Validate required fields
    if (!product_id || !quantity || !reason) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Missing required fields: product_id, quantity, reason',
        code: 400
      });
    }

    // Validate reason
    const validReasons = ['expired', 'stolen', 'damaged', 'vendor_return', 'other'];
    if (!validReasons.includes(reason)) {
      await transaction.rollback();
      return res.status(400).json({
        error: `Invalid reason. Must be one of: ${validReasons.join(', ')}`,
        code: 400
      });
    }

    // Check if product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Product not found',
        code: 404
      });
    }

    // Check inventory
    const inventory = await Inventory.findOne({
      where: { product_id }
    });

    if (!inventory || inventory.quantity_on_hand < quantity) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Insufficient inventory',
        code: 400
      });
    }

    // Create loss record
    const loss = await Loss.create({
      product_id: parseInt(product_id),
      quantity: parseInt(quantity),
      reason,
      notes: notes || null,
      recorded_by: req.user.id,
      created_at: new Date()
    }, { transaction });

    // Update inventory
    await inventory.update({
      quantity_on_hand: inventory.quantity_on_hand - parseInt(quantity),
      last_updated: new Date()
    }, { transaction });

    // Create stock movement
    await StockMovement.create({
      product_id,
      type: 'loss',
      quantity: -parseInt(quantity),
      reference_id: loss.id,
      user_id: req.user.id,
      reason: `Loss: ${reason}`
    }, { transaction });

    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'loss_recorded',
      entity_type: 'loss',
      entity_id: loss.id,
      ip_address: req.ip,
      meta: { product_id, quantity, reason }
    }, { transaction });

    await transaction.commit();

    // Fetch complete loss
    const completeLoss = await Loss.findByPk(loss.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'unit_price', 'cost_price']
        }
      ]
    });

    res.status(201).json({ data: completeLoss });
  } catch (error) {
    await transaction.rollback();
    console.error('Create loss error:', error);
    next(error);
  }
};
