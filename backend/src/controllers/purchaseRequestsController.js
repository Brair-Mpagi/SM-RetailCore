const { PurchaseRequest, PurchaseRequestItem, Product, User, AuditLog, sequelize } = require('../models');

// Create purchase request
exports.createPurchaseRequest = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { items, notes, reason } = req.body;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'Items are required', 
        code: 400 
      });
    }

    // Create PR
    const pr = await PurchaseRequest.create({
      created_by: req.user.id,
      status: 'pending',
      notes,
      reason
    }, { transaction: t });

    // Create PR items
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      
      if (!product) {
        await t.rollback();
        return res.status(404).json({ 
          error: `Product ${item.product_id} not found`, 
          code: 404 
        });
      }

      if (!item.quantity_requested || item.quantity_requested <= 0) {
        await t.rollback();
        return res.status(400).json({ 
          error: `Invalid quantity for product ${item.product_id}`, 
          code: 400 
        });
      }

      await PurchaseRequestItem.create({
        request_id: pr.id,
        product_id: item.product_id,
        quantity_requested: item.quantity_requested
      }, { transaction: t });
    }

    await t.commit();

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'create',
      entity_type: 'purchase_request',
      entity_id: pr.id,
      details: JSON.stringify({ items_count: items.length, status: 'pending' })
    });

    const result = await PurchaseRequest.findByPk(pr.id, {
      include: [
        { model: PurchaseRequestItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.status(201).json({ data: result });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// List purchase requests
exports.getPurchaseRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { is_deleted: 0 };
    if (status) where.status = status;

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
        { model: PurchaseRequestItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true
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

// Get single PR
exports.getPurchaseRequest = async (req, res, next) => {
  try {
    const pr = await PurchaseRequest.findOne({
      where: { id: req.params.id, is_deleted: 0 },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
        { model: PurchaseRequestItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    if (!pr) {
      return res.status(404).json({ error: 'Purchase request not found', code: 404 });
    }

    res.json({ data: pr });
  } catch (error) {
    next(error);
  }
};

// Update status (Admin only)
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected', code: 400 });
    }

    const pr = await PurchaseRequest.findByPk(req.params.id);

    if (!pr || pr.is_deleted) {
      return res.status(404).json({ error: 'Purchase request not found', code: 404 });
    }

    if (pr.status !== 'pending') {
      return res.status(400).json({ error: `Cannot update status of a ${pr.status} request`, code: 400 });
    }

    await pr.update({
      status,
      approved_by: req.user.id
    });

    // Log the approval/rejection
    await AuditLog.create({
      user_id: req.user.id,
      action: 'update_status',
      entity_type: 'purchase_request',
      entity_id: pr.id,
      details: JSON.stringify({ old_status: 'pending', new_status: status })
    });

    const result = await PurchaseRequest.findByPk(pr.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
        { model: PurchaseRequestItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

// Delete purchase request (soft delete)
exports.deletePurchaseRequest = async (req, res, next) => {
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id);

    if (!pr || pr.is_deleted) {
      return res.status(404).json({ error: 'Purchase request not found', code: 404 });
    }

    if (pr.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be deleted', code: 400 });
    }

    await pr.update({ is_deleted: 1 });

    // Log the deletion
    await AuditLog.create({
      user_id: req.user.id,
      action: 'delete',
      entity_type: 'purchase_request',
      entity_id: pr.id,
      details: JSON.stringify({ reason: 'soft delete' })
    });

    res.json({ message: 'Purchase request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
