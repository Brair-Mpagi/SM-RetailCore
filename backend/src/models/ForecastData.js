const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ForecastData = sequelize.define('ForecastData', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    forecast_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    predicted_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    model_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    mae_score: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true
    }
  }, {
    tableName: 'forecast_data',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['forecast_date'] }
    ]
  });

  ForecastData.associate = (models) => {
    ForecastData.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return ForecastData;
};
