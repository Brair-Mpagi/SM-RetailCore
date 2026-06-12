const { Supplier } = require('../models');

// Get all suppliers
exports.getSuppliers = async (req, res, next) => {
  try {
    const { is_active } = req.query;
    const where = {};

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const suppliers = await Supplier.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.json({ data: suppliers });
  } catch (error) {
    console.error('Get suppliers error:', error);
    next(error);
  }
};

// Get single supplier
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ 
        error: 'Supplier not found', 
        code: 404 
      });
    }

    res.json({ data: supplier });
  } catch (error) {
    console.error('Get supplier error:', error);
    next(error);
  }
};

// Create supplier
exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contact_person, contact_phone, contact_email, address, lead_time_days, status, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Supplier name is required', 
        code: 400 
      });
    }

    let active_val = 1;
    if (status === 'inactive') active_val = 0;
    if (is_active !== undefined) active_val = is_active;

    const supplier = await Supplier.create({
      name,
      contact_person: contact_person || null,
      contact_phone: contact_phone || null,
      contact_email: contact_email || null,
      address: address || null,
      lead_time_days: lead_time_days || 1,
      is_active: active_val
    });

    res.status(201).json({ data: supplier });
  } catch (error) {
    console.error('Create supplier error:', error);
    next(error);
  }
};

// Update supplier
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ 
        error: 'Supplier not found', 
        code: 404 
      });
    }

    const updates = { ...req.body };
    if (updates.status === 'inactive') updates.is_active = 0;
    if (updates.status === 'active') updates.is_active = 1;
    
    await supplier.update(updates);

    res.json({ data: supplier });
  } catch (error) {
    console.error('Update supplier error:', error);
    next(error);
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ 
        error: 'Supplier not found', 
        code: 404 
      });
    }

    await supplier.update({ is_active: 0 });

    res.json({ 
      data: { message: 'Supplier deactivated successfully' } 
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    next(error);
  }
};
