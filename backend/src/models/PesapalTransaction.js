const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PesapalTransaction = sequelize.define('PesapalTransaction', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    pesapal_order_tracking_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    merchant_reference: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'UGX'
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      defaultValue: 'pending'
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'pesapal_transactions',
    timestamps: true,
    indexes: [
      { fields: ['merchant_reference'], unique: true },
      { fields: ['pesapal_order_tracking_id'] },
      { fields: ['status'] }
    ]
  });

  return PesapalTransaction;
};
