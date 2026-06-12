const { ShelfTag, Product, Inventory } = require('../models');
const { Op } = require('sequelize');

// GET /api/v1/shelf-tags
exports.getAll = async (req, res, next) => {
  try {
    const { search, product_id } = req.query;
    const where = { is_active: 1 };

    if (product_id) where.product_id = product_id;

    if (search) {
      where[Op.or] = [
        { product_name: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } },
        { shelf_location: { [Op.like]: `%${search}%` } }
      ];
    }

    const tags = await ShelfTag.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'barcode', 'unit_price'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ data: tags });
  } catch (error) {
    console.error('Get shelf tags error:', error);
    next(error);
  }
};

// GET /api/v1/shelf-tags/:id
exports.getOne = async (req, res, next) => {
  try {
    const tag = await ShelfTag.findByPk(req.params.id, {
      include: [{ model: Product, as: 'product', required: false }]
    });
    if (!tag) return res.status(404).json({ error: 'Shelf tag not found' });
    res.json({ data: tag });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/shelf-tags
exports.create = async (req, res, next) => {
  try {
    const { product_id, product_name, price, barcode, shelf_location, label_text } = req.body;

    if (!product_name || price === undefined) {
      return res.status(400).json({ error: 'product_name and price are required' });
    }

    // If product_id provided, sync data from product
    let resolvedName = product_name;
    let resolvedPrice = parseFloat(price);
    let resolvedBarcode = barcode;

    if (product_id) {
      const product = await Product.findOne({
        where: { id: product_id, is_deleted: 0 },
        include: [{ model: Inventory, as: 'inventory' }]
      });
      if (product) {
        resolvedName = product_name || product.name;
        resolvedPrice = parseFloat(price) || parseFloat(product.unit_price);
        resolvedBarcode = barcode || product.barcode;
      }
    }

    const tag = await ShelfTag.create({
      product_id: product_id || null,
      product_name: resolvedName,
      price: resolvedPrice,
      barcode: resolvedBarcode || null,
      shelf_location: shelf_location || null,
      label_text: label_text || null,
      is_active: 1
    });

    const created = await ShelfTag.findByPk(tag.id, {
      include: [{ model: Product, as: 'product', required: false }]
    });

    res.status(201).json({ data: created });
  } catch (error) {
    console.error('Create shelf tag error:', error);
    next(error);
  }
};

// PUT /api/v1/shelf-tags/:id
exports.update = async (req, res, next) => {
  try {
    const tag = await ShelfTag.findByPk(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Shelf tag not found' });

    const { product_id, product_name, price, barcode, shelf_location, label_text } = req.body;

    await tag.update({
      ...(product_id !== undefined && { product_id }),
      ...(product_name && { product_name }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(barcode !== undefined && { barcode }),
      ...(shelf_location !== undefined && { shelf_location }),
      ...(label_text !== undefined && { label_text })
    });

    const updated = await ShelfTag.findByPk(tag.id, {
      include: [{ model: Product, as: 'product', required: false }]
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/shelf-tags/:id
exports.remove = async (req, res, next) => {
  try {
    const tag = await ShelfTag.findByPk(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Shelf tag not found' });

    await tag.update({ is_active: 0 });
    res.json({ data: { message: 'Shelf tag deleted' } });
  } catch (error) {
    next(error);
  }
};
