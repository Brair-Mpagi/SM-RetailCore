const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'General'
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'string'
    }
  }, {
    tableName: 'SystemSettings',
    timestamps: true
  });

  return SystemSetting;
};
