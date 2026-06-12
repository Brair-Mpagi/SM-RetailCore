const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PurchaseRequestItem = sequelize.define('PurchaseRequestItem', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    request_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    quantity_requested: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    }
  }, {
    tableName: 'purchase_request_items',
    timestamps: false
  });

  PurchaseRequestItem.associate = (models) => {
    PurchaseRequestItem.belongsTo(models.PurchaseRequest, {
      foreignKey: 'request_id',
      as: 'purchaseRequest'
    });
    PurchaseRequestItem.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return PurchaseRequestItem;
};
