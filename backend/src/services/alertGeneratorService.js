/**
 * alertGeneratorService.js
 * Generates logical, real-data-driven alerts from DB state.
 * Idempotent — uses findOrCreate so duplicates are avoided.
 * Triggered on-demand via POST /api/v1/alerts/generate
 */
const { Alert, Product, CashSession, SaleItem, sequelize } = require('../models');
const { Op } = require('sequelize');

const ONE_HOUR_AGO = () => new Date(Date.now() - 60 * 60 * 1000);

/**
 * Helper — upsert an alert: if an unread alert of same type+product_id
 * already exists and was created less than 1 hour ago, skip it.
 */
async function upsertAlert({ type, product_id = null, message, severity }) {
  const recentThreshold = ONE_HOUR_AGO();

  const existing = await Alert.findOne({
    where: {
      type,
      ...(product_id ? { product_id } : { product_id: null }),
      is_read: 0,
      created_at: { [Op.gte]: recentThreshold }
    }
  });

  if (existing) {
    // Update message in case stock changed
    await existing.update({ message, severity });
    return existing;
  }

  return Alert.create({ type, product_id, message, severity });
}

/**
 * 1. LOW STOCK alerts — items at or below reorder point
 */
async function generateLowStockAlerts() {
  const products = await Product.findAll({
    where: {
      stock: { [Op.lte]: sequelize.col('reorder_point') },
      is_active: 1
    },
    limit: 50
  });

  const results = [];
  for (const p of products) {
    const pctLeft = p.reorder_point > 0 ? Math.round((p.stock / p.reorder_point) * 100) : 0;
    const severity = p.stock === 0 ? 'critical' : pctLeft <= 50 ? 'warning' : 'info';
    const message = p.stock === 0
      ? `OUT OF STOCK: "${p.name}" — Reorder immediately. Reorder point: ${p.reorder_point} units.`
      : `Low stock: "${p.name}" has ${p.stock} units left (reorder at ${p.reorder_point}). ${pctLeft}% remaining.`;

    results.push(await upsertAlert({ type: 'low_stock', product_id: p.id, message, severity }));
  }
  return results;
}

/**
 * 2. EXPIRY alerts — products expiring within 14 days
 */
async function generateExpiryAlerts() {
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const today = new Date();

  const products = await Product.findAll({
    where: {
      expiry_date: { [Op.between]: [today, in14Days] },
      stock: { [Op.gt]: 0 },
      is_active: 1
    },
    limit: 50
  });

  const results = [];
  for (const p of products) {
    const daysLeft = Math.ceil((new Date(p.expiry_date) - today) / (1000 * 60 * 60 * 24));
    const severity = daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'warning' : 'info';
    const message = daysLeft <= 0
      ? `EXPIRED: "${p.name}" expired on ${p.expiry_date}. ${p.stock} units still in stock. Remove immediately.`
      : `Expiry warning: "${p.name}" expires in ${daysLeft} day(s) (${p.expiry_date}). ${p.stock} units in stock — consider markdown or immediate sale.`;

    results.push(await upsertAlert({ type: 'expiry', product_id: p.id, message, severity }));
  }
  return results;
}

/**
 * 3. CASH DISCREPANCY alerts — closed sessions with large variance
 */
async function generateCashDiscrepancyAlerts() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const sessions = await CashSession.findAll({
    where: {
      status: 'closed',
      actual_cash: { [Op.not]: null },
      updated_at: { [Op.gte]: yesterday }
    },
    include: [{ association: 'cashier', attributes: ['name'] }],
    limit: 20
  });

  const results = [];
  for (const s of sessions) {
    const variance = (s.actual_cash || 0) - (s.expected_cash || 0);
    if (Math.abs(variance) < 5000) continue; // less than UGX 5,000 — ignore

    const severity = Math.abs(variance) > 50000 ? 'critical' : 'warning';
    const sign = variance < 0 ? 'SHORT' : 'OVER';
    const cashierName = s.cashier?.name || `Session #${s.id}`;
    const message = `Cash ${sign}: ${cashierName}'s drawer closed with a ${sign === 'SHORT' ? '-' : '+'}UGX ${Math.abs(variance).toLocaleString()} variance. Expected: UGX ${(s.expected_cash || 0).toLocaleString()}, Counted: UGX ${(s.actual_cash || 0).toLocaleString()}.`;

    results.push(await upsertAlert({ type: 'cash_discrepancy', product_id: null, message, severity }));
  }
  return results;
}

/**
 * 4. HIGH VELOCITY alerts — products selling unusually fast (top 5 by qty in last 24h)
 */
async function generateHighVelocityAlerts() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const topItems = await SaleItem.findAll({
    where: { created_at: { [Op.gte]: yesterday } },
    attributes: [
      'product_id',
      [sequelize.fn('SUM', sequelize.col('quantity')), 'total_qty']
    ],
    group: ['product_id'],
    order: [[sequelize.literal('total_qty'), 'DESC']],
    limit: 5,
    include: [{ model: Product, as: 'product', attributes: ['name', 'stock', 'reorder_point'] }]
  });

  const results = [];
  for (const item of topItems) {
    const qty = parseInt(item.dataValues.total_qty);
    const p = item.product;
    if (!p) continue;
    const daysOfStock = p.stock > 0 && qty > 0 ? Math.ceil(p.stock / qty) : null;

    if (daysOfStock !== null && daysOfStock <= 3) {
      const message = `High velocity: "${p.name}" sold ${qty} units in the last 24h. At this rate, stock (${p.stock} units) will run out in ~${daysOfStock} day(s). Consider urgent reorder.`;
      results.push(await upsertAlert({ type: 'high_velocity', product_id: p.id, message, severity: 'warning' }));
    }
  }
  return results;
}

/**
 * Main entry point — runs all generators
 */
async function generateAllAlerts() {
  const [lowStock, expiry, cashDisc, highVel] = await Promise.allSettled([
    generateLowStockAlerts(),
    generateExpiryAlerts(),
    generateCashDiscrepancyAlerts(),
    generateHighVelocityAlerts()
  ]);

  return {
    low_stock: lowStock.status === 'fulfilled' ? lowStock.value.length : 0,
    expiry: expiry.status === 'fulfilled' ? expiry.value.length : 0,
    cash_discrepancy: cashDisc.status === 'fulfilled' ? cashDisc.value.length : 0,
    high_velocity: highVel.status === 'fulfilled' ? highVel.value.length : 0
  };
}

module.exports = { generateAllAlerts };
