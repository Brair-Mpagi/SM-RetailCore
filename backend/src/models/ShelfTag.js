const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ShelfTag = sequelize.define('ShelfTag', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    shelf_location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    label_text: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    is_active: {
      type: DataTypes.TINYINT(1),
      defaultValue: 1
    }
  }, {
    tableName: 'shelf_tags',
    timestamps: true,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['barcode'] }
    ]
  });

  ShelfTag.associate = (models) => {
    ShelfTag.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product',
      constraints: false
    });
  };

  return ShelfTag;
};
