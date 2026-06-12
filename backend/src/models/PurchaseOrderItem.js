const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    po_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    quantity_ordered: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    quantity_received: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    batch_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    tableName: 'purchase_order_items',
    timestamps: false
  });

  PurchaseOrderItem.associate = (models) => {
    PurchaseOrderItem.belongsTo(models.PurchaseOrder, {
      foreignKey: 'po_id',
      as: 'purchaseOrder'
    });
    PurchaseOrderItem.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return PurchaseOrderItem;
};
