const { CashSession, SalesTransaction, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Open cash session
exports.openSession = async (req, res, next) => {
  try {
    const { device_id, opening_balance } = req.body;

    if (!device_id || opening_balance === undefined) {
      return res.status(400).json({ 
        error: 'Device ID and opening balance are required', 
        code: 400 
      });
    }

    // Check if user already has an open session
    const existingSession = await CashSession.findOne({
      where: {
        cashier_id: req.user.id,
        status: 'open'
      }
    });

    if (existingSession) {
      return res.status(400).json({ 
        error: 'You already have an open cash session', 
        code: 400 
      });
    }

    const session = await CashSession.create({
      cashier_id: req.user.id,
      device_id,
      opening_balance,
      status: 'open'
    });

    res.status(201).json({ data: session });
  } catch (error) {
    next(error);
  }
};

// Assign cash session (Manager only)
exports.assignSession = async (req, res, next) => {
  try {
    const { cashier_id, opening_balance } = req.body;

    if (!cashier_id || opening_balance === undefined) {
      return res.status(400).json({ 
        error: 'Cashier ID and opening balance are required', 
        code: 400 
      });
    }

    // Check if cashier already has an open session
    const existingSession = await CashSession.findOne({
      where: {
        cashier_id,
        status: 'open'
      }
    });

    if (existingSession) {
      return res.status(400).json({ 
        error: 'Cashier already has an open cash session', 
        code: 400 
      });
    }

    const session = await CashSession.create({
      cashier_id,
      device_id: null,
      opening_balance,
      status: 'open'
    });

    res.status(201).json({ data: session });
  } catch (error) {
    next(error);
  }
};

// Get active session
exports.getActiveSession = async (req, res, next) => {
  try {
    const session = await CashSession.findOne({
      where: {
        cashier_id: req.user.id,
        status: 'open'
      },
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!session) {
      return res.status(404).json({ 
        error: 'No active session found', 
        code: 404 
      });
    }

    // Calculate session totals
    const transactions = await SalesTransaction.findAll({
      where: {
        cash_session_id: session.id,
        status: 'completed'
      }
    });

    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
    const cashSales = transactions
      .filter(t => t.payment_method === 'cash')
      .reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
    const expectedCash = parseFloat(session.opening_balance) + cashSales;

    res.json({ 
      data: {
        ...session.toJSON(),
        stats: {
          total_transactions: transactions.length,
          total_sales: totalSales,
          cash_sales: cashSales,
          expected_cash: expectedCash
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Close cash session
exports.closeSession = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { actual_cash, notes } = req.body;

    if (actual_cash === undefined) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'Actual cash amount is required', 
        code: 400 
      });
    }

    const session = await CashSession.findByPk(req.params.id, { transaction: t });

    if (!session) {
      await t.rollback();
      return res.status(404).json({ error: 'Session not found', code: 404 });
    }

    if (session.status !== 'open') {
      await t.rollback();
      return res.status(400).json({ error: 'Session is not open', code: 400 });
    }

    if (session.cashier_id !== req.user.id && req.user.role !== 'manager') {
      await t.rollback();
      return res.status(403).json({ error: 'Not authorized to close this session', code: 403 });
    }

    // Calculate expected cash
    const transactions = await SalesTransaction.findAll({
      where: {
        cash_session_id: session.id,
        status: 'completed'
      },
      transaction: t
    });

    const cashSales = transactions
      .filter(t => t.payment_method === 'cash')
      .reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
    const expectedCash = parseFloat(session.opening_balance) + cashSales;
    const difference = parseFloat(actual_cash) - expectedCash;

    await session.update({
      expected_cash: expectedCash,
      actual_cash: parseFloat(actual_cash),
      difference,
      status: 'closed',
      ended_at: new Date(),
      notes
    }, { transaction: t });

    await t.commit();

    res.json({ data: session });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Get ALL active sessions (manager overview)
exports.getAllActiveSessions = async (req, res, next) => {
  try {
    const openSessions = await CashSession.findAll({
      where: { status: 'open' },
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['started_at', 'ASC']]
    });

    // Enrich each session with its running sales totals
    const enriched = await Promise.all(openSessions.map(async (session) => {
      const transactions = await SalesTransaction.findAll({
        where: { cash_session_id: session.id, status: 'completed' }
      });
      const totalSales = transactions.reduce((s, t) => s + parseFloat(t.total_amount), 0);
      const cashSales  = transactions.filter(t => t.payment_method === 'cash')
                          .reduce((s, t) => s + parseFloat(t.total_amount), 0);
      return {
        ...session.toJSON(),
        stats: {
          total_transactions: transactions.length,
          total_sales: totalSales,
          cash_sales: cashSales,
          expected_cash: parseFloat(session.opening_balance) + cashSales
        }
      };
    }));

    res.json({ data: enriched });
  } catch (error) {
    next(error);
  }
};

// Force-close a session (manager override)
exports.forceCloseSession = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { reason } = req.body;
    const session = await CashSession.findByPk(req.params.id, { transaction: t });

    if (!session) {
      await t.rollback();
      return res.status(404).json({ error: 'Session not found', code: 404 });
    }
    if (session.status !== 'open') {
      await t.rollback();
      return res.status(400).json({ error: 'Session is already closed', code: 400 });
    }

    const transactions = await SalesTransaction.findAll({
      where: { cash_session_id: session.id, status: 'completed' },
      transaction: t
    });
    const cashSales = transactions
      .filter(tx => tx.payment_method === 'cash')
      .reduce((s, tx) => s + parseFloat(tx.total_amount), 0);
    const expectedCash = parseFloat(session.opening_balance) + cashSales;

    await session.update({
      expected_cash: expectedCash,
      status: 'force_closed',
      ended_at: new Date(),
      closed_by: req.user.id,
      notes: reason || 'Force closed by manager'
    }, { transaction: t });

    await t.commit();
    res.json({ data: session, message: 'Session force closed successfully' });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// List cash sessions
exports.getSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, cashier_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (cashier_id) where.cashier_id = cashier_id;

    // Non-managers can only see their own sessions
    if (req.user.role !== 'manager') {
      where.cashier_id = req.user.id;
    }

    const { count, rows } = await CashSession.findAndCountAll({
      where,
      include: [
        { model: User, as: 'cashier', attributes: ['id', 'name', 'email'] }
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

module.exports = exports;
