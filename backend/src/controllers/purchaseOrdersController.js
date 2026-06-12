const { PurchaseOrder, PurchaseOrderItem, Product, Supplier, Inventory, StockMovement, sequelize } = require('../models');
const { Op } = require('sequelize');

// Create purchase order
exports.createPurchaseOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { supplier_id, items, expected_delivery_date, notes, request_id } = req.body;

    if (!supplier_id || !items || items.length === 0 || !request_id) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'Supplier, items, and request_id are required', 
        code: 400 
      });
    }

    // Validate request
    const { PurchaseRequest } = require('../models');
    const pr = await PurchaseRequest.findByPk(request_id, { transaction: t });
    if (!pr || pr.is_deleted) {
      await t.rollback();
      return res.status(404).json({ error: 'Purchase request not found', code: 404 });
    }
    if (pr.status !== 'approved') {
      await t.rollback();
      return res.status(400).json({ error: 'Purchase request must be approved to create an order', code: 400 });
    }

    let totalAmount = 0;

    // Create PO
    const po = await PurchaseOrder.create({
      supplier_id,
      request_id,
      created_by: req.user.id,
      status: 'draft',
      expected_at: expected_delivery_date,
      notes
    }, { transaction: t });

    // Create PO items
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      
      if (!product) {
        await t.rollback();
        return res.status(404).json({ 
          error: `Product ${item.product_id} not found`, 
          code: 404 
        });
      }

      const lineTotal = item.unit_cost * item.quantity_ordered;
      totalAmount += lineTotal;

      await PurchaseOrderItem.create({
        po_id: po.id,
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        quantity_received: 0,
        cost_price: item.unit_cost
      }, { transaction: t });
    }

    await t.commit();

    const result = await PurchaseOrder.findByPk(po.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.status(201).json({ data: result });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Receive stock against PO
exports.receiveStock = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Items are required', code: 400 });
    }

    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
      transaction: t
    });

    if (!po) {
      await t.rollback();
      return res.status(404).json({ error: 'Purchase order not found', code: 404 });
    }

    // Process each received item
    for (const item of items) {
      const poItem = po.items.find(i => i.product_id === item.product_id);
      
      if (!poItem) {
        await t.rollback();
        return res.status(400).json({ 
          error: `Product ${item.product_id} not in purchase order`, 
          code: 400 
        });
      }

      const newReceived = poItem.quantity_received + item.quantity_received;
      
      if (newReceived > poItem.quantity_ordered) {
        await t.rollback();
        return res.status(400).json({ 
          error: `Received quantity exceeds ordered for product ${item.product_id}`, 
          code: 400 
        });
      }

      // Update PO item
      await poItem.update({
        quantity_received: newReceived
      }, { transaction: t });

      // Update inventory
      await Inventory.increment('quantity_on_hand', {
        by: item.quantity_received,
        where: { product_id: item.product_id },
        transaction: t
      });

      // Create stock movement
      await StockMovement.create({
        product_id: item.product_id,
        type: 'in',
        quantity: item.quantity_received,
        reference_id: po.id,
        user_id: req.user.id,
        reason: `Received from PO #${po.id}`
      }, { transaction: t });
    }

    // Update PO status
    const allReceived = po.items.every(item => item.quantity_received === item.quantity_ordered);
    const partiallyReceived = po.items.some(item => item.quantity_received > 0);

    if (allReceived) {
      await po.update({ status: 'received', received_date: new Date() }, { transaction: t });
    } else if (partiallyReceived) {
      await po.update({ status: 'partially_received' }, { transaction: t });
    }

    await t.commit();

    const result = await PurchaseOrder.findByPk(po.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.json({ data: result });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// List purchase orders
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, supplier_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (supplier_id) where.supplier_id = supplier_id;

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      data: rows,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single PO
exports.getPurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found', code: 404 });
    }

    res.json({ data: po });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
