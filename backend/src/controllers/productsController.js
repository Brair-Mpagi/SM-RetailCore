const { Product, Category, Supplier, Inventory, PriceHistory } = require('../models');
const { Op } = require('sequelize');

// Get all products
exports.getProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      category, 
      supplier,
      is_active = 1 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { is_deleted: 0 };

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category) {
      where.category_id = category;
    }

    if (supplier) {
      where.supplier_id = supplier;
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { 
          model: Category, 
          as: 'category',
          attributes: ['id', 'name']
        },
        { 
          model: Supplier, 
          as: 'supplier',
          attributes: ['id', 'name', 'lead_time_days']
        },
        { 
          model: Inventory, 
          as: 'inventory',
          attributes: ['quantity_on_hand', 'last_updated']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    // Transform data to include stock at top level for frontend compatibility
    const transformedRows = rows.map(product => {
      const productData = product.toJSON();
      return {
        ...productData,
        stock: productData.inventory?.quantity_on_hand || 0
      };
    });

    res.json({
      data: transformedRows,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    next(error);
  }
};

// Get single product
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        is_deleted: 0
      },
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' },
        { model: Inventory, as: 'inventory' },
        { 
          model: PriceHistory, 
          as: 'priceHistory',
          limit: 10,
          order: [['changed_at', 'DESC']]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found', 
        code: 404 
      });
    }

    // Transform to include stock at top level
    const productData = product.toJSON();
    const transformedProduct = {
      ...productData,
      stock: productData.inventory?.quantity_on_hand || 0
    };

    res.json({ data: transformedProduct });
  } catch (error) {
    console.error('Get product error:', error);
    next(error);
  }
};

// Create product
exports.createProduct = async (req, res, next) => {
  const transaction = await Product.sequelize.transaction();
  
  try {
    const {
      name,
      sku,
      barcode,
      category_id,
      unit_price,
      cost_price,
      supplier_id,
      reorder_point,
      unit_of_measure,
      expiry_date,
      location,
      stock, // Accept 'stock' from frontend
      initial_stock = 0
    } = req.body;

    // Use stock or initial_stock
    const initialQuantity = stock !== undefined ? parseInt(stock) : parseInt(initial_stock);

    // Auto-generate SKU if not provided
    const generatedSku = sku && sku.trim() !== '' ? sku.trim() : `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Validate required fields
    if (!name || !category_id || unit_price === undefined || cost_price === undefined) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Missing required fields: name, category_id, unit_price, cost_price', 
        code: 400 
      });
    }

    // Check if SKU already exists
    const existingSKU = await Product.findOne({ where: { sku: generatedSku, is_deleted: 0 } });
    if (existingSKU) {
      await transaction.rollback();
      return res.status(409).json({ 
        error: 'SKU already exists', 
        code: 409 
      });
    }

    // Check if barcode already exists
    if (barcode) {
      const existingBarcode = await Product.findOne({ where: { barcode, is_deleted: 0 } });
      if (existingBarcode) {
        await transaction.rollback();
        return res.status(409).json({ 
          error: 'Barcode already exists', 
          code: 409 
        });
      }
    }

    // Create product
    const product = await Product.create({
      name,
      sku: generatedSku,
      barcode: barcode || null,
      category_id: parseInt(category_id),
      unit_price: parseFloat(unit_price),
      cost_price: parseFloat(cost_price),
      supplier_id: supplier_id ? parseInt(supplier_id) : null,
      reorder_point: reorder_point ? parseInt(reorder_point) : 5,
      unit_of_measure: unit_of_measure || 'pcs',
      expiry_date: expiry_date || null,
      location: location || null,
      is_active: 1,
      is_deleted: 0
    }, { transaction });

    // Create inventory record
    await Inventory.create({
      product_id: product.id,
      quantity_on_hand: initialQuantity || 0,
      last_updated: new Date()
    }, { transaction });

    // Log price history only if user is authenticated
    if (req.user && req.user.id) {
      await PriceHistory.create({
        product_id: product.id,
        old_price: 0,
        new_price: parseFloat(unit_price),
        changed_by: req.user.id,
        changed_at: new Date()
      }, { transaction });
    }

    await transaction.commit();

    // Fetch complete product with associations
    const completeProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' },
        { model: Inventory, as: 'inventory' }
      ]
    });

    res.status(201).json({ data: completeProduct });
  } catch (error) {
    await transaction.rollback();
    console.error('Create product error:', error);
    next(error);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  const transaction = await Product.sequelize.transaction();
  
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        is_deleted: 0
      }
    });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ 
        error: 'Product not found', 
        code: 404 
      });
    }

    const { unit_price, ...otherUpdates } = req.body;

    // Track price change
    if (unit_price && unit_price !== product.unit_price) {
      await PriceHistory.create({
        product_id: product.id,
        old_price: product.unit_price,
        new_price: unit_price,
        changed_by: req.user.id
      }, { transaction });
    }

    // Update product
    await product.update({
      ...otherUpdates,
      ...(unit_price && { unit_price })
    }, { transaction });

    await transaction.commit();

    // Fetch updated product
    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' },
        { model: Inventory, as: 'inventory' }
      ]
    });

    res.json({ data: updatedProduct });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Delete product (soft delete)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        is_deleted: 0
      }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found', 
        code: 404 
      });
    }

    await product.update({ 
      is_deleted: 1,
      is_active: 0
    });

    res.json({ 
      data: { message: 'Product deleted successfully' } 
    });
  } catch (error) {
    next(error);
  }
};

// ─── Barcode helpers ──────────────────────────────────────────────────────────

/**
 * GET /products/next-barcode
 * Returns the next available sequential internal barcode.
 * Internal barcodes start at 10000001 (8-digit numeric, Code-128 compatible).
 */
exports.getNextBarcode = async (req, res, next) => {
  try {
    const count = parseInt(req.query.count) || 1;
    const barcodes = await generateBarcodeSequence(count);
    res.json({ data: { barcodes, next: barcodes[0] } });
  } catch (error) {
    next(error);
  }
};

/**
 * Compute the next N barcodes without reserving them.
 */
async function generateBarcodeSequence(count = 1) {
  const { sequelize } = require('../models');
  const BASE = 10000001;

  // Find max numeric barcode that looks like our internal sequence
  const [results] = await sequelize.query(
    `SELECT MAX(CAST(barcode AS UNSIGNED)) as maxCode 
     FROM products 
     WHERE barcode REGEXP '^[0-9]{8,}$' AND is_deleted = 0`
  );
  const maxCode = results[0]?.maxCode ? parseInt(results[0].maxCode) : BASE - 1;
  const start = Math.max(maxCode + 1, BASE);

  const barcodes = [];
  for (let i = 0; i < count; i++) {
    barcodes.push(String(start + i));
  }
  return barcodes;
}

/**
 * POST /products/bulk
 * Body: { products: [ { name, sku, category_id, unit_price, cost_price, ... }, ... ] }
 * Auto-generates barcodes for products that don't provide one.
 */
exports.bulkCreateProducts = async (req, res, next) => {
  const transaction = await Product.sequelize.transaction();

  try {
    const { products: productList } = req.body;

    if (!Array.isArray(productList) || productList.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'products array is required' });
    }

    // How many products need auto-barcodes?
    const needsBarcodeCount = productList.filter(p => !p.barcode || p.barcode.trim() === '').length;
    const autoBarcodes = needsBarcodeCount > 0
      ? await generateBarcodeSequence(needsBarcodeCount)
      : [];

    const errors = [];
    const created = [];
    let barcodeIdx = 0;

    for (let i = 0; i < productList.length; i++) {
      const p = productList[i];

      if (!p.name || !p.category_id || p.unit_price === undefined) {
        errors.push({ index: i, error: 'Missing required fields: name, category_id, unit_price' });
        continue;
      }

      // Auto-generate SKU if missing
      const generatedSku = p.sku && p.sku.trim() !== '' ? p.sku.trim() : `SKU-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;

      // Assign auto-barcode if needed
      const barcode = (p.barcode && p.barcode.trim() !== '')
        ? p.barcode.trim()
        : autoBarcodes[barcodeIdx++];

      // Check for duplicates
      const [existingSKU, existingBarcode] = await Promise.all([
        Product.findOne({ where: { sku: generatedSku, is_deleted: 0 } }),
        Product.findOne({ where: { barcode, is_deleted: 0 } })
      ]);

      if (existingSKU) {
        errors.push({ index: i, sku: generatedSku, error: 'SKU already exists' });
        continue;
      }
      if (existingBarcode) {
        errors.push({ index: i, barcode, error: 'Barcode already exists' });
        continue;
      }

      const product = await Product.create({
        name: p.name,
        sku: generatedSku,
        barcode,
        category_id: parseInt(p.category_id),
        unit_price: parseFloat(p.unit_price),
        cost_price: parseFloat(p.cost_price || 0),
        supplier_id: p.supplier_id ? parseInt(p.supplier_id) : null,
        reorder_point: p.reorder_point ? parseInt(p.reorder_point) : 5,
        unit_of_measure: p.unit_of_measure || 'pcs',
        expiry_date: p.expiry_date || null,
        location: p.location || null,
        is_active: 1,
        is_deleted: 0
      }, { transaction });

      await Inventory.create({
        product_id: product.id,
        quantity_on_hand: parseInt(p.stock || p.initial_stock || 0),
        last_updated: new Date()
      }, { transaction });

      if (req.user?.id) {
        await PriceHistory.create({
          product_id: product.id,
          old_price: 0,
          new_price: parseFloat(p.unit_price),
          changed_by: req.user.id,
          changed_at: new Date()
        }, { transaction });
      }

      created.push({ ...product.toJSON(), barcode });
    }

    await transaction.commit();

    res.status(201).json({
      data: {
        created: created.length,
        errors: errors.length,
        products: created,
        errorDetails: errors
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Bulk create products error:', error);
    next(error);
  }
};

