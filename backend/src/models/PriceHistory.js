const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PriceHistory = sequelize.define('PriceHistory', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    old_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    new_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    changed_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'price_history',
    timestamps: false
  });

  PriceHistory.associate = (models) => {
    PriceHistory.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
    PriceHistory.belongsTo(models.User, {
      foreignKey: 'changed_by',
      as: 'user'
    });
  };

  return PriceHistory;
};
