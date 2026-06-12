const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StocktakeItem = sequelize.define('StocktakeItem', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    stocktake_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    system_qty: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    counted_qty: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    difference: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'stocktake_items',
    timestamps: false
  });

  StocktakeItem.associate = (models) => {
    StocktakeItem.belongsTo(models.Stocktake, {
      foreignKey: 'stocktake_id',
      as: 'stocktake'
    });
    StocktakeItem.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return StocktakeItem;
};
