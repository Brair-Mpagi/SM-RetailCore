const { SalesTransaction, SaleItem, Product, Inventory, StockMovement, Alert, CashSession, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Create sale (ATOMIC transaction)
exports.createSale = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      items, 
      subtotal,
      discount_amount = 0,
      tax_amount,
      total_amount,
      payment_method, 
      amount_tendered,
      change_given = 0,
      momo_reference, 
      cash_session_id 
    } = req.body;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'No items in transaction', code: 400 });
    }

    // Get or create active cash session for this cashier
    let cashSession;
    if (cash_session_id) {
      cashSession = await CashSession.findByPk(cash_session_id, { transaction: t });
      if (!cashSession || cashSession.status !== 'open') {
        await t.rollback();
        return res.status(400).json({ error: 'Invalid or closed cash session', code: 400 });
      }
    } else {
      // Try to find an active session for this cashier
      cashSession = await CashSession.findOne({
        where: {
          cashier_id: req.user.id,
          status: 'open'
        },
        transaction: t
      });

      // If no active session, throw error
      if (!cashSession) {
        await t.rollback();
        return res.status(400).json({ error: 'No active shift found. Please start a shift first.', code: 400 });
      }
    }

    // Validate and process items
    const saleItems = [];
    let hasStockWarning = false;
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      
      if (!product) {
        await t.rollback();
        return res.status(404).json({ error: `Product ${item.product_id} not found`, code: 404 });
      }

      const inventory = await Inventory.findOne({ 
        where: { product_id: product.id }, 
        transaction: t 
      });

      // Check stock only for positive quantities (not returns/refunds)
      if (item.quantity > 0) {
        if (!inventory || inventory.quantity_on_hand < item.quantity) {
          await t.rollback();
          return res.status(400).json({ 
            error: `Insufficient stock for ${product.name}. Available: ${inventory?.quantity_on_hand || 0}, Requested: ${item.quantity}`, 
            code: 400 
          });
        }
      }

      saleItems.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: product.cost_price || 0,
        subtotal: item.subtotal
      });
    }

    // Generate receipt number using consistent local timezone boundaries
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}${month}${day}`;

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const count = await SalesTransaction.count({
      where: {
        created_at: {
          [Op.gte]: startOfDay
        }
      },
      transaction: t
    });
    const receiptNumber = `REC-${today}-${String(count + 1).padStart(4, '0')}`;

    // Create transaction
    const transaction = await SalesTransaction.create({
      receipt_number: receiptNumber,
      cashier_id: req.user.id,
      cash_session_id: cashSession.id,
      discount_amount: parseFloat(discount_amount) || 0,
      tax_amount: parseFloat(tax_amount) || 0,
      total_amount: parseFloat(total_amount),
      payment_method,
      amount_tendered: parseFloat(amount_tendered) || parseFloat(total_amount),
      change_given: parseFloat(change_given) || 0,
      momo_reference: payment_method.includes('momo') || payment_method.includes('money') ? momo_reference : null,
      status: 'completed'
    }, { transaction: t });

    // Create sale items and update inventory
    for (const item of saleItems) {
      await SaleItem.create({
        transaction_id: transaction.id,
        ...item
      }, { transaction: t });

      // Update inventory (decrement for sales, increment for returns)
      if (item.quantity > 0) {
        // Regular sale - decrement inventory
        await Inventory.decrement('quantity_on_hand', {
          by: item.quantity,
          where: { product_id: item.product_id },
          transaction: t
        });

        // Create stock movement
        await StockMovement.create({
          product_id: item.product_id,
          type: 'out',
          quantity: -item.quantity,
          reference_id: transaction.id,
          user_id: req.user.id,
          reason: `Sale ${receiptNumber}`
        }, { transaction: t });

        // Check reorder point and create alert if needed
        const updatedInventory = await Inventory.findOne({
          where: { product_id: item.product_id },
          include: [{ model: Product, as: 'product' }],
          transaction: t
        });

        if (updatedInventory && updatedInventory.quantity_on_hand <= updatedInventory.product.reorder_point) {
          await Alert.create({
            type: 'low_stock',
            product_id: item.product_id,
            message: `${updatedInventory.product.name} — only ${updatedInventory.quantity_on_hand} units remaining (reorder point: ${updatedInventory.product.reorder_point})`,
            severity: updatedInventory.quantity_on_hand === 0 ? 'critical' : 'warning',
            is_read: 0
          }, { transaction: t });
        }
      } else if (item.quantity < 0) {
        // Return/refund - increment inventory
        await Inventory.increment('quantity_on_hand', {
          by: Math.abs(item.quantity),
          where: { product_id: item.product_id },
          transaction: t
        });

        // Create stock movement
        await StockMovement.create({
          product_id: item.product_id,
          type: 'in',
          quantity: Math.abs(item.quantity),
          reference_id: transaction.id,
          user_id: req.user.id,
          reason: `Return ${receiptNumber}`
        }, { transaction: t });
      }
    }

    await t.commit();

    // Add subtotal to response for frontend
    const responseData = {
      ...transaction.toJSON(),
      items: saleItems,
      subtotal: subtotal || saleItems.reduce((sum, item) => sum + Number(item.subtotal), 0)
    };

    res.status(201).json({
      data: responseData
    });
  } catch (error) {
    await t.rollback();
    console.error('Create sale error:', error);
    next(error);
  }
};

// List transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, cashier_id, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (status) where.status = status;
    
    // Role-based filtering
    if (req.user.role === 'cashier') {
      // Cashiers can only see their current active session's transactions
      const activeSession = await CashSession.findOne({
        where: { cashier_id: req.user.id, status: 'open' }
      });
      
      if (!activeSession) {
        // If no active session, they see nothing
        return res.json({ data: [], meta: { page: 1, limit: parseInt(limit), total: 0, pages: 0 } });
      }
      
      where.cash_session_id = activeSession.id;
    } else {
      // Managers can see all, but can filter by cashier
      if (cashier_id) where.cashier_id = cashier_id;
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await SalesTransaction.findAndCountAll({
      where,
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name', 'email'] },
        { 
          model: SaleItem, 
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        }
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

// Get transaction by ID
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await SalesTransaction.findByPk(req.params.id, {
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name', 'email'] },
        { 
          model: SaleItem, 
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found', code: 404 });
    }

    res.json({ data: transaction });
  } catch (error) {
    next(error);
  }
};

// Get transaction by receipt number
exports.getByReceiptNumber = async (req, res, next) => {
  try {
    const transaction = await SalesTransaction.findOne({
      where: { receipt_number: req.params.receiptNumber },
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name', 'email'] },
        { 
          model: SaleItem, 
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found', code: 404 });
    }

    res.json({ data: transaction });
  } catch (error) {
    next(error);
  }
};

// Void transaction (requires manager authorization)
exports.voidTransaction = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const transaction = await SalesTransaction.findByPk(req.params.id, {
      include: [{ model: SaleItem, as: 'items' }],
      transaction: t
    });

    if (!transaction) {
      await t.rollback();
      return res.status(404).json({ error: 'Transaction not found', code: 404 });
    }

    if (transaction.status === 'voided') {
      await t.rollback();
      return res.status(400).json({ error: 'Transaction already voided', code: 400 });
    }

    // Restore inventory
    for (const item of transaction.items) {
      await Inventory.increment('quantity_on_hand', {
        by: item.quantity,
        where: { product_id: item.product_id },
        transaction: t
      });

      await StockMovement.create({
        product_id: item.product_id,
        type: 'adjust',
        quantity: item.quantity,
        reference_id: transaction.id,
        user_id: req.user.id,
        reason: `Void transaction ${transaction.receipt_number}`
      }, { transaction: t });
    }

    await transaction.update({ status: 'voided' }, { transaction: t });

    await t.commit();

    res.json({ data: transaction });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = exports;
