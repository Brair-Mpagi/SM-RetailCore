const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StockMovement = sequelize.define('StockMovement', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('in', 'out', 'adjust', 'stocktake', 'loss'),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reference_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    reason: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    device_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'stock_movements',
    timestamps: false,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['created_at'] },
      { fields: ['type'] }
    ]
  });

  StockMovement.associate = (models) => {
    StockMovement.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
    StockMovement.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return StockMovement;
};
