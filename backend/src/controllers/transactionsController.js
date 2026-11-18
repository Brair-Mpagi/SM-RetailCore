const { SalesTransaction, SaleItem, Product, Inventory, StockMovement, Alert, CashSession, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Create sale (ATOMIC transaction with enhanced security)
exports.createSale = async (req, res, next) => {
  const startTime = Date.now();
  const t = await sequelize.transaction();
  
  logger.logTransaction('create_sale_attempt', {
    cashier_id: req.user.id,
    items_count: req.body.items?.length,
    total_amount: req.body.total_amount,
    payment_method: req.body.payment_method,
    ip: req.ip
  });
  
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
      logger.logSecurity('sale_rejected_no_items', {
        cashier_id: req.user.id,
        ip: req.ip
      });
      return res.status(400).json({ error: 'No items in transaction', code: 400 });
    }

    // Validate items array length to prevent DoS
    if (items.length > 1000) {
      await t.rollback();
      logger.logSecurity('sale_rejected_too_many_items', {
        cashier_id: req.user.id,
        items_count: items.length,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Transaction exceeds maximum 1000 items', code: 400 });
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

    // Validate and process items with row-level locking to prevent race conditions
    const saleItems = [];
    let serverCalculatedSubtotal = 0;
    
    for (const item of items) {
      // Lock product and inventory rows to prevent concurrent modifications
      const product = await Product.findByPk(item.product_id, { 
        transaction: t,
        lock: t.LOCK.UPDATE  // Pessimistic locking
      });
      
      if (!product) {
        await t.rollback();
        logger.logSecurity('sale_rejected_invalid_product', {
          cashier_id: req.user.id,
          product_id: item.product_id,
          ip: req.ip
        });
        return res.status(404).json({ error: `Product ${item.product_id} not found`, code: 404 });
      }

      if (!product.is_active || product.is_deleted) {
        await t.rollback();
        logger.logSecurity('sale_rejected_inactive_product', {
          cashier_id: req.user.id,
          product_id: item.product_id,
          product_name: product.name,
          ip: req.ip
        });
        return res.status(400).json({ 
          error: `Product ${product.name} is not available for sale`, 
          code: 400 
        });
      }

      const inventory = await Inventory.findOne({ 
        where: { product_id: product.id }, 
        transaction: t,
        lock: t.LOCK.UPDATE  // Lock inventory row
      });

      // Check stock only for positive quantities (not returns/refunds)
      if (item.quantity > 0) {
        if (!inventory || inventory.quantity_on_hand < item.quantity) {
          await t.rollback();
          logger.logTransaction('sale_rejected_insufficient_stock', {
            cashier_id: req.user.id,
            product_id: product.id,
            product_name: product.name,
            available: inventory?.quantity_on_hand || 0,
            requested: item.quantity,
            ip: req.ip
          });
          return res.status(400).json({ 
            error: `Insufficient stock for ${product.name}. Available: ${inventory?.quantity_on_hand || 0}, Requested: ${item.quantity}`, 
            code: 400 
          });
        }
      }

      // CRITICAL SECURITY: Use server-side authoritative price, not client-submitted price
      const authoritativePrice = product.unit_price;
      const calculatedSubtotal = authoritativePrice * item.quantity;
      
      // Verify client submitted correct price (within 0.01 tolerance for rounding)
      if (Math.abs(parseFloat(item.unit_price) - authoritativePrice) > 0.01) {
        await t.rollback();
        logger.logSecurity('sale_rejected_price_tampering', {
          cashier_id: req.user.id,
          product_id: product.id,
          product_name: product.name,
          submitted_price: item.unit_price,
          authoritative_price: authoritativePrice,
          ip: req.ip
        });
        return res.status(400).json({ 
          error: `Price mismatch for ${product.name}. Please refresh and try again.`, 
          code: 400 
        });
      }

      // Verify subtotal calculation
      if (Math.abs(parseFloat(item.subtotal) - calculatedSubtotal) > 0.01) {
        await t.rollback();
        logger.logSecurity('sale_rejected_subtotal_tampering', {
          cashier_id: req.user.id,
          product_id: product.id,
          submitted_subtotal: item.subtotal,
          calculated_subtotal: calculatedSubtotal,
          ip: req.ip
        });
        return res.status(400).json({ 
          error: `Calculation error for ${product.name}. Please refresh and try again.`, 
          code: 400 
        });
      }

      serverCalculatedSubtotal += calculatedSubtotal;

      saleItems.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: authoritativePrice,  // Use authoritative price
        cost_price: product.cost_price || 0,
        subtotal: calculatedSubtotal  // Use server-calculated subtotal
      });
    }

    // Verify total amounts server-side
    const expectedTaxRate = 0.18; // TODO: Get from SystemSetting
    const expectedTax = Math.round(serverCalculatedSubtotal * expectedTaxRate * 100) / 100;
    const expectedTotal = serverCalculatedSubtotal + expectedTax;

    // Check submitted totals match server calculations (within 1 UGX tolerance)
    if (Math.abs(parseFloat(subtotal || 0) - serverCalculatedSubtotal) > 1) {
      await t.rollback();
      logger.logSecurity('sale_rejected_subtotal_mismatch', {
        cashier_id: req.user.id,
        submitted: subtotal,
        calculated: serverCalculatedSubtotal,
        ip: req.ip
      });
      return res.status(400).json({ 
        error: 'Subtotal mismatch. Please refresh and try again.', 
        code: 400 
      });
    }

    if (Math.abs(parseFloat(tax_amount) - expectedTax) > 1) {
      await t.rollback();
      logger.logSecurity('sale_rejected_tax_mismatch', {
        cashier_id: req.user.id,
        submitted: tax_amount,
        calculated: expectedTax,
        ip: req.ip
      });
      return res.status(400).json({ 
        error: 'Tax calculation mismatch. Please refresh and try again.', 
        code: 400 
      });
    }

    if (Math.abs(parseFloat(total_amount) - expectedTotal) > 1) {
      await t.rollback();
      logger.logSecurity('sale_rejected_total_mismatch', {
        cashier_id: req.user.id,
        submitted: total_amount,
        calculated: expectedTotal,
        ip: req.ip
      });
      return res.status(400).json({ 
        error: 'Total amount mismatch. Please refresh and try again.', 
        code: 400 
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

    const responseTime = Date.now() - startTime;

    logger.logTransaction('sale_completed', {
      cashier_id: req.user.id,
      receipt_number: transaction.receipt_number,
      total_amount: transaction.total_amount,
      items_count: saleItems.length,
      payment_method: transaction.payment_method,
      response_time: responseTime,
      ip: req.ip
    });

    // Add subtotal to response for frontend
    const responseData = {
      ...transaction.toJSON(),
      items: saleItems,
      subtotal: serverCalculatedSubtotal
    };

    res.status(201).json({
      data: responseData
    });
  } catch (error) {
    await t.rollback();
    logger.error('Sale creation failed', {
      error: error.message,
      stack: error.stack,
      cashier_id: req.user?.id,
      items_count: req.body.items?.length,
      ip: req.ip
    });
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
