const { SalesTransaction, SaleItem, User, CashSession, Product, Inventory, Category, Loss, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper: parse date range from query
function parseDateRange(query) {
  const { start_date, end_date, days } = query;
  let startDate, endDate;
  if (start_date && end_date) {
    startDate = new Date(start_date); startDate.setHours(0, 0, 0, 0);
    endDate   = new Date(end_date);   endDate.setHours(23, 59, 59, 999);
  } else {
    const daysCount = parseInt(days) || 14;
    endDate   = new Date(); endDate.setHours(23, 59, 59, 999);
    startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount + 1);
    startDate.setHours(0, 0, 0, 0);
  }
  return { startDate, endDate };
}

// GET /manager/overview — today's live operations summary
exports.getOperationsOverview = async (req, res, next) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [transactions, activeSessions] = await Promise.all([
      SalesTransaction.findAll({
        where: { created_at: { [Op.between]: [todayStart, todayEnd] }, status: 'completed' },
        include: [{ model: User, as: 'cashier', attributes: ['id', 'name'] }]
      }),
      CashSession.findAll({
        where: { status: 'open' },
        include: [{ model: User, as: 'cashier', attributes: ['id', 'name'] }]
      })
    ]);

    const totalRevenue = transactions.reduce((s, t) => s + parseFloat(t.total_amount), 0);
    const totalTax     = transactions.reduce((s, t) => s + parseFloat(t.tax_amount), 0);
    const txCount      = transactions.length;

    const paymentBreakdown = transactions.reduce((acc, t) => {
      acc[t.payment_method] = (acc[t.payment_method] || 0) + parseFloat(t.total_amount);
      return acc;
    }, {});

    // Per-cashier today
    const cashierMap = {};
    transactions.forEach(t => {
      const id = t.cashier_id;
      if (!cashierMap[id]) cashierMap[id] = { name: t.cashier?.name || 'Unknown', total: 0, count: 0 };
      cashierMap[id].total += parseFloat(t.total_amount);
      cashierMap[id].count++;
    });

    res.json({
      data: {
        today: {
          total_revenue: totalRevenue,
          total_tax: totalTax,
          total_transactions: txCount,
          avg_basket: txCount > 0 ? totalRevenue / txCount : 0,
          payment_breakdown: paymentBreakdown
        },
        active_sessions: activeSessions.length,
        cashier_today: Object.entries(cashierMap).map(([id, v]) => ({ cashier_id: id, ...v }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /manager/cashier-perf — per-cashier aggregated performance
exports.getCashierPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query);

    const transactions = await SalesTransaction.findAll({
      where: { created_at: { [Op.between]: [startDate, endDate] }, status: 'completed' },
      include: [{ model: User, as: 'cashier', attributes: ['id', 'name', 'email'] }]
    });

    const cashierMap = {};
    transactions.forEach(t => {
      const id = t.cashier_id;
      if (!cashierMap[id]) {
        cashierMap[id] = {
          cashier_id: id,
          name: t.cashier?.name || 'Unknown',
          email: t.cashier?.email || '',
          total_revenue: 0,
          total_transactions: 0,
          cash_transactions: 0,
          momo_transactions: 0
        };
      }
      cashierMap[id].total_revenue += parseFloat(t.total_amount);
      cashierMap[id].total_transactions++;
      if (t.payment_method === 'cash') cashierMap[id].cash_transactions++;
      else cashierMap[id].momo_transactions++;
    });

    const result = Object.values(cashierMap).map(c => ({
      ...c,
      avg_basket: c.total_transactions > 0 ? c.total_revenue / c.total_transactions : 0
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

// GET /manager/shift-breakdowns — all shifts in date range
exports.getShiftBreakdowns = async (req, res, next) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query);

    const sessions = await CashSession.findAll({
      where: { started_at: { [Op.between]: [startDate, endDate] } },
      include: [{ model: User, as: 'cashier', attributes: ['id', 'name'] }],
      order: [['started_at', 'DESC']]
    });

    const enriched = await Promise.all(sessions.map(async (s) => {
      const txns = await SalesTransaction.findAll({
        where: { cash_session_id: s.id, status: 'completed' }
      });
      const totalSales = txns.reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
      const cashSales  = txns.filter(t => t.payment_method === 'cash')
                             .reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
      const expectedCash = parseFloat(s.opening_balance) + cashSales;
      const actualCash   = s.actual_cash ? parseFloat(s.actual_cash) : null;
      const variance     = actualCash !== null ? actualCash - expectedCash : null;

      return {
        ...s.toJSON(),
        computed: {
          total_sales: totalSales,
          cash_sales: cashSales,
          transaction_count: txns.length,
          expected_cash: expectedCash,
          actual_cash: actualCash,
          variance
        }
      };
    }));

    res.json({ data: enriched });
  } catch (error) {
    next(error);
  }
};

// GET /manager/recent-txns — recent transactions across all cashiers
exports.getRecentTransactions = async (req, res, next) => {
  try {
    const { limit = 50, start_date, end_date, cashier_id, payment_method, status } = req.query;

    const where = {};
    if (status) where.status = status;
    else where.status = { [Op.in]: ['completed', 'voided', 'refunded'] };
    if (payment_method) where.payment_method = payment_method;
    if (cashier_id) where.cashier_id = cashier_id;
    if (start_date && end_date) {
      const s = new Date(start_date); s.setHours(0, 0, 0, 0);
      const e = new Date(end_date);   e.setHours(23, 59, 59, 999);
      where.created_at = { [Op.between]: [s, e] };
    }

    const transactions = await SalesTransaction.findAll({
      where,
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
        { model: SaleItem, as: 'items' }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ data: transactions });
  } catch (error) {
    next(error);
  }
};

// GET /manager/product-analytics/:id — per-product daily sales + stock metrics
exports.getProductAnalytics = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    const days = parseInt(req.query.days) || 14;

    const endDate = new Date(); endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Fetch product with inventory
    const product = await Product.findOne({
      where: { id: productId, is_deleted: 0 },
      include: [
        { model: Inventory, as: 'inventory' },
        { model: Category, as: 'category' }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Fetch all sale items for this product in date range
    const saleItems = await SaleItem.findAll({
      where: { product_id: productId },
      include: [{
        model: SalesTransaction,
        as: 'transaction',
        where: {
          created_at: { [Op.between]: [startDate, endDate] },
          status: 'completed'
        },
        attributes: ['id', 'created_at']
      }]
    });

    // Build daily map
    const dailyMap = {};
    let curr = new Date(startDate);
    while (curr <= endDate) {
      const key = curr.toISOString().split('T')[0];
      dailyMap[key] = { date: key, units_sold: 0, revenue: 0 };
      curr.setDate(curr.getDate() + 1);
    }

    let totalUnitsSold = 0;
    let totalRevenue = 0;
    saleItems.forEach(item => {
      const key = new Date(item.transaction.created_at).toISOString().split('T')[0];
      if (dailyMap[key]) {
        const qty = parseFloat(item.quantity) || 0;
        const rev = parseFloat(item.subtotal) || 0;
        dailyMap[key].units_sold += qty;
        dailyMap[key].revenue += rev;
        totalUnitsSold += qty;
        totalRevenue += rev;
      }
    });

    const dailyData = Object.values(dailyMap);
    const activeDays = dailyData.filter(d => d.units_sold > 0).length;
    const avgDailySales = activeDays > 0 ? totalUnitsSold / activeDays : 0;

    // Fetch shrinkage losses for this product
    const losses = await Loss.findAll({ where: { product_id: productId } });
    const totalLossValue = losses.reduce((s, l) => s + parseFloat(l.estimated_loss || 0), 0);
    const totalLossQty   = losses.reduce((s, l) => s + parseFloat(l.quantity || 0), 0);

    const productData = product.toJSON();
    const currentStock = productData.inventory?.quantity_on_hand ?? 0;
    const grossMargin = productData.unit_price > 0
      ? ((productData.unit_price - productData.cost_price) / productData.unit_price) * 100
      : 0;

    res.json({
      data: {
        product: {
          id: productData.id,
          name: productData.name,
          sku: productData.sku,
          category: productData.category?.name,
          unit_price: productData.unit_price,
          cost_price: productData.cost_price,
          reorder_point: productData.reorder_point,
          expiry_date: productData.expiry_date,
          current_stock: currentStock,
          gross_margin_pct: parseFloat(grossMargin.toFixed(1))
        },
        period_summary: {
          total_units_sold: totalUnitsSold,
          total_revenue: totalRevenue,
          avg_daily_sales: parseFloat(avgDailySales.toFixed(2)),
          days_of_stock_remaining: avgDailySales > 0 ? Math.floor(currentStock / avgDailySales) : null,
          total_loss_value: totalLossValue,
          total_loss_qty: totalLossQty
        },
        daily_sales: dailyData
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
