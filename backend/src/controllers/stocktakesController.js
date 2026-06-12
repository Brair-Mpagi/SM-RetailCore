const { Stocktake, StocktakeItem, Product, Inventory, StockMovement, AuditLog } = require('../models');

// Get all stocktakes
exports.getStocktakes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    const stocktakes = await Stocktake.findAll({
      where,
      include: [
        {
          model: StocktakeItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku']
            }
          ]
        }
      ],
      order: [['started_at', 'DESC']]
    });

    res.json({ data: stocktakes });
  } catch (error) {
    console.error('Get stocktakes error:', error);
    next(error);
  }
};

// Create stocktake
exports.createStocktake = async (req, res, next) => {
  const transaction = await Stocktake.sequelize.transaction();

  try {
    const { product_ids } = req.body;

    // Create stocktake
    const stocktake = await Stocktake.create({
      created_by: req.user.id,
      status: 'open',
      started_at: new Date()
    }, { transaction });

    // If specific products provided, create items for them
    if (product_ids && Array.isArray(product_ids) && product_ids.length > 0) {
      const products = await Product.findAll({
        where: { id: product_ids, is_deleted: 0 },
        include: [{ model: Inventory, as: 'inventory' }]
      });

      const items = products.map(product => ({
        stocktake_id: stocktake.id,
        product_id: product.id,
        system_qty: product.inventory?.quantity_on_hand || 0,
        counted_qty: 0,
        difference: 0
      }));

      await StocktakeItem.bulkCreate(items, { transaction });
    } else {
      // Create items for all active products
      const products = await Product.findAll({
        where: { is_deleted: 0, is_active: 1 },
        include: [{ model: Inventory, as: 'inventory' }]
      });

      const items = products.map(product => ({
        stocktake_id: stocktake.id,
        product_id: product.id,
        system_qty: product.inventory?.quantity_on_hand || 0,
        counted_qty: 0,
        difference: 0
      }));

      await StocktakeItem.bulkCreate(items, { transaction });
    }

    await transaction.commit();

    // Fetch complete stocktake
    const completeStocktake = await Stocktake.findByPk(stocktake.id, {
      include: [
        {
          model: StocktakeItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku']
            }
          ]
        }
      ]
    });

    res.status(201).json({ data: completeStocktake });
  } catch (error) {
    await transaction.rollback();
    console.error('Create stocktake error:', error);
    next(error);
  }
};

// Record count for stocktake item
exports.recordCount = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { product_id, counted_qty }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: 'Items array is required',
        code: 400
      });
    }

    const stocktake = await Stocktake.findByPk(req.params.id);

    if (!stocktake) {
      return res.status(404).json({
        error: 'Stocktake not found',
        code: 404
      });
    }

    if (stocktake.status !== 'open') {
      return res.status(400).json({
        error: 'Stocktake is not open',
        code: 400
      });
    }

    // Update counts
    for (const item of items) {
      const stocktakeItem = await StocktakeItem.findOne({
        where: {
          stocktake_id: stocktake.id,
          product_id: item.product_id
        }
      });

      if (stocktakeItem) {
        const difference = item.counted_qty - stocktakeItem.system_qty;
        await stocktakeItem.update({
          counted_qty: item.counted_qty,
          difference
        });
      }
    }

    // Fetch updated stocktake
    const updatedStocktake = await Stocktake.findByPk(stocktake.id, {
      include: [
        {
          model: StocktakeItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku']
            }
          ]
        }
      ]
    });

    res.json({ data: updatedStocktake });
  } catch (error) {
    console.error('Record count error:', error);
    next(error);
  }
};

// Commit stocktake
exports.commitStocktake = async (req, res, next) => {
  const transaction = await Stocktake.sequelize.transaction();

  try {
    const stocktake = await Stocktake.findByPk(req.params.id, {
      include: [{ model: StocktakeItem, as: 'items' }]
    });

    if (!stocktake) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Stocktake not found',
        code: 404
      });
    }

    if (stocktake.status !== 'open') {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Stocktake is not open',
        code: 400
      });
    }

    // Update inventory for all items with differences
    for (const item of stocktake.items) {
      if (item.difference !== 0) {
        // Update inventory
        const inventory = await Inventory.findOne({
          where: { product_id: item.product_id }
        });

        if (inventory) {
          await inventory.update({
            quantity_on_hand: item.counted_qty,
            last_updated: new Date()
          }, { transaction });

          // Create stock movement record
          await StockMovement.create({
            product_id: item.product_id,
            movement_type: 'adjustment',
            quantity: item.difference,
            reference_type: 'stocktake',
            reference_id: stocktake.id,
            performed_by: req.user.id,
            notes: `Stocktake adjustment: ${item.difference > 0 ? '+' : ''}${item.difference}`
          }, { transaction });
        }
      }
    }

    // Update stocktake status
    await stocktake.update({
      status: 'committed',
      committed_at: new Date()
    }, { transaction });

    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'stocktake_committed',
      entity_type: 'stocktake',
      entity_id: stocktake.id,
      ip_address: req.ip
    }, { transaction });

    await transaction.commit();

    res.json({
      data: { message: 'Stocktake committed successfully', stocktake_id: stocktake.id }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Commit stocktake error:', error);
    next(error);
  }
};
