const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('low_stock', 'expiry', 'fraud', 'cash_discrepancy', 'high_velocity', 'system'),
      allowNull: false
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('info', 'warning', 'critical'),
      defaultValue: 'warning'
    },
    is_read: {
      type: DataTypes.TINYINT(1),
      defaultValue: 0
    },
    auto_cleared_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'alerts',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['is_read'] },
      { fields: ['created_at'] },
      { fields: ['type'] }
    ]
  });

  Alert.associate = (models) => {
    Alert.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return Alert;
};
