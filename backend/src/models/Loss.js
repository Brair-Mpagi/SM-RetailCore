const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Loss = sequelize.define('Loss', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    reason: {
      type: DataTypes.ENUM('expired', 'stolen', 'damaged', 'vendor_return', 'other'),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recorded_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    }
  }, {
    tableName: 'losses',
    timestamps: true,
    updatedAt: false
  });

  Loss.associate = (models) => {
    Loss.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
    Loss.belongsTo(models.User, {
      foreignKey: 'recorded_by',
      as: 'recorder'
    });
  };

  return Loss;
};
