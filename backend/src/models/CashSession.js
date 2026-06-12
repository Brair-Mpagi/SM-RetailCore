const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CashSession = sequelize.define('CashSession', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    cashier_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    device_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    opening_balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    expected_cash: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    actual_cash: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    difference: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('open', 'closed', 'force_closed'),
      defaultValue: 'open'
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closed_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'cash_sessions',
    timestamps: false,
    indexes: [
      { fields: ['cashier_id'] },
      { fields: ['status'] },
      { fields: ['started_at'] }
    ]
  });

  CashSession.associate = (models) => {
    CashSession.belongsTo(models.User, {
      foreignKey: 'cashier_id',
      as: 'cashier'
    });
    CashSession.hasMany(models.SalesTransaction, {
      foreignKey: 'cash_session_id',
      as: 'transactions'
    });
  };

  return CashSession;
};
