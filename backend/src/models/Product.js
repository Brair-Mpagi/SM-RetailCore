const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    category_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    supplier_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    reorder_point: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 5
    },
    unit_of_measure: {
      type: DataTypes.STRING(30),
      defaultValue: 'pcs'
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_active: {
      type: DataTypes.TINYINT(1),
      defaultValue: 1
    },
    is_deleted: {
      type: DataTypes.TINYINT(1),
      defaultValue: 0
    }
  }, {
    tableName: 'products',
    timestamps: true,
    indexes: [
      { fields: ['sku'], unique: true },
      { fields: ['barcode'], unique: true },
      { fields: ['category_id'] },
      { fields: ['supplier_id'] },
      { fields: ['is_active'] }
    ]
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });
    Product.belongsTo(models.Supplier, {
      foreignKey: 'supplier_id',
      as: 'supplier'
    });
    Product.hasOne(models.Inventory, {
      foreignKey: 'product_id',
      as: 'inventory'
    });
    Product.hasMany(models.StockMovement, {
      foreignKey: 'product_id',
      as: 'stockMovements'
    });
    Product.hasMany(models.PriceHistory, {
      foreignKey: 'product_id',
      as: 'priceHistory'
    });
  };

  return Product;
};
