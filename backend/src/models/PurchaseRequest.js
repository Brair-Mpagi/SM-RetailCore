const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PurchaseRequest = sequelize.define('PurchaseRequest', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    created_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    approved_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_deleted: {
      type: DataTypes.TINYINT(1),
      defaultValue: 0
    }
  }, {
    tableName: 'purchase_requests',
    timestamps: true
  });

  PurchaseRequest.associate = (models) => {
    PurchaseRequest.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    PurchaseRequest.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });
    PurchaseRequest.hasMany(models.PurchaseRequestItem, {
      foreignKey: 'request_id',
      as: 'items'
    });
    PurchaseRequest.hasMany(models.PurchaseOrder, {
      foreignKey: 'request_id',
      as: 'purchaseOrders'
    });
  };

  return PurchaseRequest;
};
