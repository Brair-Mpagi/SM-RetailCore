const { SalesTransaction, SaleItem, Product, Category, User, CashSession, Inventory, Loss, sequelize } = require('../models');
const { Op } = require('sequelize');

// Daily sales report
exports.getDailySalesReport = async (req, res, next) => {
  try {
    const { start_date, end_date, days } = req.query;
    let startDate, endDate;

    if (start_date && end_date) {
      startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 14 days if no dates provided
      const daysCount = parseInt(days) || 14;
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount + 1);
      startDate.setHours(0, 0, 0, 0);
    }

    const transactions = await SalesTransaction.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      include: [
        { model: SaleItem, as: 'items' },
        { model: User, as: 'cashier', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'ASC']]
    });

    const dailyDataMap = {};
    let currDate = new Date(startDate);
    while (currDate <= endDate) {
      const dateStr = currDate.toISOString().split('T')[0];
      dailyDataMap[dateStr] = {
        date: dateStr,
        revenue: 0,
        transactions: 0,
        tax: 0
      };
      currDate.setDate(currDate.getDate() + 1);
    }

    let totalSales = 0;
    let totalTax = 0;
    let totalTransactions = transactions.length;
    const paymentBreakdown = {};
    const cashierStats = {};

    transactions.forEach(t => {
      const dateStr = new Date(t.created_at).toISOString().split('T')[0];
      const amount = parseFloat(t.total_amount);
      const tax = parseFloat(t.tax_amount);

      if (dailyDataMap[dateStr]) {
        dailyDataMap[dateStr].revenue += amount;
        dailyDataMap[dateStr].tax += tax;
        dailyDataMap[dateStr].transactions += 1;
      }

      totalSales += amount;
      totalTax += tax;
      paymentBreakdown[t.payment_method] = (paymentBreakdown[t.payment_method] || 0) + amount;

      const cashierId = t.cashier_id;
      if (!cashierStats[cashierId]) {
        cashierStats[cashierId] = {
          name: t.cashier?.name || 'Unknown',
          transactions: 0,
          total_sales: 0
        };
      }
      cashierStats[cashierId].transactions++;
      cashierStats[cashierId].total_sales += amount;
    });

    res.json({
      data: Object.values(dailyDataMap),
      summary: {
        total_sales: totalSales,
        total_tax: totalTax,
        total_transactions: totalTransactions,
        average_basket: totalTransactions > 0 ? totalSales / totalTransactions : 0
      },
      payment_breakdown: paymentBreakdown,
      cashier_performance: Object.values(cashierStats)
    });
  } catch (error) {
    next(error);
  }
};

// Inventory report
exports.getInventoryReport = async (req, res, next) => {
  try {
    const inventory = await Inventory.findAll({
      include: [
        { 
          model: Product, 
          as: 'product',
          include: [{ model: Category, as: 'category' }]
        }
      ]
    });

    const lowStock = inventory.filter(i => i.quantity_on_hand <= i.product.reorder_point);
    const outOfStock = inventory.filter(i => i.quantity_on_hand === 0);
    
    const totalValue = inventory.reduce((sum, i) => {
      return sum + (i.quantity_on_hand * parseFloat(i.product.unit_price));
    }, 0);

    const categoryBreakdown = inventory.reduce((acc, i) => {
      const catName = i.product.category?.name || 'Uncategorized';
      if (!acc[catName]) {
        acc[catName] = {
          items: 0,
          total_quantity: 0,
          total_value: 0
        };
      }
      acc[catName].items++;
      acc[catName].total_quantity += i.quantity_on_hand;
      acc[catName].total_value += i.quantity_on_hand * parseFloat(i.product.unit_price);
      return acc;
    }, {});

    res.json({
      data: {
        summary: {
          total_products: inventory.length,
          total_value: totalValue,
          low_stock_count: lowStock.length,
          out_of_stock_count: outOfStock.length
        },
        low_stock_items: lowStock.map(i => ({
          product_id: i.product_id,
          name: i.product.name,
          sku: i.product.sku,
          quantity: i.quantity_on_hand,
          reorder_point: i.product.reorder_point
        })),
        category_breakdown: categoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

// Shift report
exports.getShiftReport = async (req, res, next) => {
  try {
    const session = await CashSession.findByPk(req.params.sessionId, {
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name'] }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found', code: 404 });
    }

    const transactions = await SalesTransaction.findAll({
      where: {
        cash_session_id: session.id,
        status: 'completed'
      },
      include: [{ model: SaleItem, as: 'items' }]
    });

    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
    const cashSales = transactions.filter(t => t.payment_method === 'cash')
      .reduce((sum, t) => sum + parseFloat(t.total_amount), 0);

    res.json({
      data: {
        session: session.toJSON(),
        summary: {
          total_transactions: transactions.length,
          total_sales: totalSales,
          cash_sales: cashSales,
          expected_cash: parseFloat(session.opening_balance) + cashSales,
          actual_cash: session.actual_cash,
          variance: session.difference
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Loss report
exports.getLossReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const where = {};

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const losses = await Loss.findAll({
      where,
      include: [{ model: Product, as: 'product' }]
    });

    const totalLoss = losses.reduce((sum, l) => sum + parseFloat(l.estimated_loss), 0);
    
    const reasonBreakdown = losses.reduce((acc, l) => {
      acc[l.reason] = (acc[l.reason] || 0) + parseFloat(l.estimated_loss);
      return acc;
    }, {});

    res.json({
      data: {
        summary: {
          total_incidents: losses.length,
          total_loss_value: totalLoss
        },
        reason_breakdown: reasonBreakdown,
        losses: losses.map(l => ({
          id: l.id,
          product: l.product.name,
          quantity: l.quantity,
          reason: l.reason,
          estimated_loss: l.estimated_loss,
          created_at: l.created_at
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
