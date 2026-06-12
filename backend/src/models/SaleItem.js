const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SaleItem = sequelize.define('SaleItem', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    transaction_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    }
  }, {
    tableName: 'sale_items',
    timestamps: false,
    indexes: [
      { fields: ['transaction_id'] },
      { fields: ['product_id'] }
    ]
  });

  SaleItem.associate = (models) => {
    SaleItem.belongsTo(models.SalesTransaction, {
      foreignKey: 'transaction_id',
      as: 'transaction'
    });
    SaleItem.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return SaleItem;
};
