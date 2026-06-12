const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Supplier = sequelize.define('Supplier', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    contact_person: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    contact_phone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lead_time_days: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 1
    },
    is_active: {
      type: DataTypes.TINYINT(1),
      defaultValue: 1
    }
  }, {
    tableName: 'suppliers',
    timestamps: false
  });

  Supplier.associate = (models) => {
    Supplier.hasMany(models.Product, {
      foreignKey: 'supplier_id',
      as: 'products'
    });
    Supplier.hasMany(models.PurchaseOrder, {
      foreignKey: 'supplier_id',
      as: 'purchaseOrders'
    });
  };

  return Supplier;
};
