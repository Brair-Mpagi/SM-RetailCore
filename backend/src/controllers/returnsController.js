const { Return, Product, Inventory, StockMovement, SalesTransaction, AuditLog } = require('../models');
const { Op } = require('sequelize');

// Get all returns
exports.getReturns = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const where = {};

    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const returns = await Return.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'unit_price']
        },
        {
          model: SalesTransaction,
          as: 'transaction',
          attributes: ['id', 'receipt_number', 'total_amount']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ data: returns });
  } catch (error) {
    console.error('Get returns error:', error);
    next(error);
  }
};

// Create return
exports.createReturn = async (req, res, next) => {
  const transaction = await Return.sequelize.transaction();

  try {
    const {
      transaction_id,
      product_id,
      quantity,
      reason,
      refund_amount,
      notes
    } = req.body;

    // Validate required fields
    if (!product_id || !quantity || !reason) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Missing required fields: product_id, quantity, reason',
        code: 400
      });
    }

    // Validate reason
    const validReasons = ['defective', 'expired', 'customer_request', 'wrong_item', 'other'];
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

    // Create return record
    const returnRecord = await Return.create({
      transaction_id: transaction_id || null,
      product_id: parseInt(product_id),
      quantity: parseInt(quantity),
      reason,
      refund_amount: refund_amount ? parseFloat(refund_amount) : product.unit_price * quantity,
      notes: notes || null,
      processed_by: req.user.id,
      created_at: new Date()
    }, { transaction });

    // Update inventory (add back to stock if not defective/expired)
    if (!['defective', 'expired'].includes(reason)) {
      const inventory = await Inventory.findOne({
        where: { product_id }
      });

      if (inventory) {
        await inventory.update({
          quantity_on_hand: inventory.quantity_on_hand + parseInt(quantity),
          last_updated: new Date()
        }, { transaction });

        // Create stock movement
        await StockMovement.create({
          product_id,
          movement_type: 'return',
          quantity: parseInt(quantity),
          reference_type: 'return',
          reference_id: returnRecord.id,
          performed_by: req.user.id,
          notes: `Customer return: ${reason}`
        }, { transaction });
      }
    }

    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'return_created',
      entity_type: 'return',
      entity_id: returnRecord.id,
      ip_address: req.ip,
      meta: { product_id, quantity, reason }
    }, { transaction });

    await transaction.commit();

    // Fetch complete return
    const completeReturn = await Return.findByPk(returnRecord.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'unit_price']
        }
      ]
    });

    res.status(201).json({ data: completeReturn });
  } catch (error) {
    await transaction.rollback();
    console.error('Create return error:', error);
    next(error);
  }
};
