const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Return = sequelize.define('Return', {
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
      allowNull: false
    },
    condition_type: {
      type: DataTypes.ENUM('resale', 'damaged'),
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    refund_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    processed_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    authorized_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    }
  }, {
    tableName: 'returns',
    timestamps: true,
    updatedAt: false
  });

  Return.associate = (models) => {
    Return.belongsTo(models.SalesTransaction, {
      foreignKey: 'transaction_id',
      as: 'transaction'
    });
    Return.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return Return;
};
