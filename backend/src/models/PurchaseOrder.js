const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    supplier_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    request_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    created_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'confirmed', 'partially_received', 'received', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expected_at: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    tableName: 'purchase_orders',
    timestamps: true
  });

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Supplier, {
      foreignKey: 'supplier_id',
      as: 'supplier'
    });
    PurchaseOrder.belongsTo(models.PurchaseRequest, {
      foreignKey: 'request_id',
      as: 'purchaseRequest'
    });
    PurchaseOrder.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    PurchaseOrder.hasMany(models.PurchaseOrderItem, {
      foreignKey: 'po_id',
      as: 'items'
    });
  };

  return PurchaseOrder;
};
