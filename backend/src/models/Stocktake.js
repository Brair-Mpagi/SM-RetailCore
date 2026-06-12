const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stocktake = sequelize.define('Stocktake', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    created_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('open', 'committed', 'cancelled'),
      defaultValue: 'open'
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    committed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'stocktakes',
    timestamps: false
  });

  Stocktake.associate = (models) => {
    Stocktake.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    Stocktake.hasMany(models.StocktakeItem, {
      foreignKey: 'stocktake_id',
      as: 'items'
    });
  };

  return Stocktake;
};
