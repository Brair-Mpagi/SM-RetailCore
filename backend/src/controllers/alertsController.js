const { Alert, Product } = require('../models');
const { Op } = require('sequelize');
const { generateAllAlerts } = require('../services/alertGeneratorService');

// List alerts
exports.getAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, type, severity, is_read } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (is_read !== undefined) where.is_read = parseInt(is_read);

    const { count, rows } = await Alert.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', required: false }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ['severity', 'DESC'],
        ['created_at', 'DESC']
      ]
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

// Generate alerts from live DB data (manager/admin only)
exports.generateAlerts = async (req, res, next) => {
  try {
    const counts = await generateAllAlerts();

    // Return fresh alerts after generation
    const alerts = await Alert.findAll({
      include: [{ model: Product, as: 'product', required: false }],
      order: [['severity', 'DESC'], ['created_at', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      generated: counts,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

// Mark alert as read
exports.markAsRead = async (req, res, next) => {
  try {
    const alert = await Alert.findByPk(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found', code: 404 });
    }

    await alert.update({ is_read: 1 });

    res.json({ data: alert });
  } catch (error) {
    next(error);
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Alert.update(
      { is_read: 1 },
      { where: { is_read: 0 } }
    );

    res.json({ data: { message: 'All alerts marked as read' } });
  } catch (error) {
    next(error);
  }
};

// Delete alert
exports.deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByPk(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found', code: 404 });
    }

    await alert.destroy();

    res.json({ data: { message: 'Alert deleted' } });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
