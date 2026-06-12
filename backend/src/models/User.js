const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'cashier', 'stock'),
      allowNull: false
    },
    is_active: {
      type: DataTypes.TINYINT(1),
      defaultValue: 1
    },
    is_deleted: {
      type: DataTypes.TINYINT(1),
      defaultValue: 0
    },
    failed_attempts: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 0
    },
    device_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    reset_pin: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    reset_pin_expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['is_active'] }
    ]
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password_hash;
    delete values.reset_pin;
    return values;
  };

  // Class methods
  User.hashPassword = async function(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    return await bcrypt.hash(password, rounds);
  };

  // Associations
  User.associate = (models) => {
    User.hasMany(models.CashSession, {
      foreignKey: 'cashier_id',
      as: 'cashSessions'
    });
    User.hasMany(models.SalesTransaction, {
      foreignKey: 'cashier_id',
      as: 'transactions'
    });
    User.hasMany(models.AuditLog, {
      foreignKey: 'user_id',
      as: 'auditLogs'
    });
    User.hasMany(models.PurchaseOrder, {
      foreignKey: 'created_by',
      as: 'purchaseOrders'
    });
  };

  return User;
};
