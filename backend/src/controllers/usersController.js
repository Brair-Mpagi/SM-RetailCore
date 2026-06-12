const { User, Permission } = require('../models');
const { Op } = require('sequelize');

// List users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, is_active } = req.query;
    const offset = (page - 1) * limit;

    const where = { is_deleted: 0 };
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = parseInt(is_active);

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
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

// Get single user
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user || user.is_deleted) {
      return res.status(404).json({ error: 'User not found', code: 404 });
    }

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

// Create user
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, device_id } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Name, email, password, and role are required', 
        code: 400 
      });
    }

    // Check if email exists
    const existing = await User.findOne({ where: { email, is_deleted: 0 } });
    if (existing) {
      return res.status(400).json({ 
        error: 'Email already exists', 
        code: 400 
      });
    }

    // Hash password
    const password_hash = await User.hashPassword(password);

    const user = await User.create({
      name,
      email,
      password_hash,
      role,
      device_id,
      is_active: 1,
      is_deleted: 0,
      failed_attempts: 0
    });

    const result = user.toJSON();

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Create user error:', error);
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.id,
        is_deleted: 0
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 404 });
    }

    const { name, email, role, device_id, is_active } = req.body;

    // Check email uniqueness if changing
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email, is_deleted: 0 } });
      if (existing) {
        return res.status(400).json({ 
          error: 'Email already exists', 
          code: 400 
        });
      }
    }

    await user.update({
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(device_id !== undefined && { device_id }),
      ...(is_active !== undefined && { is_active: parseInt(is_active) })
    });

    const result = user.toJSON();

    res.json({ data: result });
  } catch (error) {
    console.error('Update user error:', error);
    next(error);
  }
};

// Delete user (soft delete)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user || user.is_deleted) {
      return res.status(404).json({ error: 'User not found', code: 404 });
    }

    await user.update({ is_deleted: 1, is_active: 0 });

    res.json({ data: { message: 'User deleted' } });
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({ 
        error: 'New password is required', 
        code: 400 
      });
    }

    const user = await User.findOne({
      where: {
        id: req.params.id,
        is_deleted: 0
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 404 });
    }

    // Hash new password
    const password_hash = await User.hashPassword(new_password);

    await user.update({ 
      password_hash,
      failed_attempts: 0 
    });

    res.json({ data: { message: 'Password reset successfully' } });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
};

module.exports = exports;
