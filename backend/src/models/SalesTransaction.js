const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SalesTransaction = sequelize.define('SalesTransaction', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    receipt_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    cashier_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    cash_session_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    device_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'mtn_momo', 'airtel_money'),
      allowNull: false
    },
    momo_reference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    amount_tendered: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    change_given: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('completed', 'voided', 'refunded'),
      defaultValue: 'completed'
    },
    void_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    voided_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    }
  }, {
    tableName: 'sales_transactions',
    timestamps: true,
    indexes: [
      { fields: ['receipt_number'], unique: true },
      { fields: ['cashier_id'] },
      { fields: ['created_at'] },
      { fields: ['status'] }
    ]
  });

  SalesTransaction.associate = (models) => {
    SalesTransaction.belongsTo(models.User, {
      foreignKey: 'cashier_id',
      as: 'cashier'
    });
    SalesTransaction.belongsTo(models.CashSession, {
      foreignKey: 'cash_session_id',
      as: 'cashSession'
    });
    SalesTransaction.hasMany(models.SaleItem, {
      foreignKey: 'transaction_id',
      as: 'items'
    });
    SalesTransaction.hasMany(models.Return, {
      foreignKey: 'transaction_id',
      as: 'returns'
    });
  };

  return SalesTransaction;
};
