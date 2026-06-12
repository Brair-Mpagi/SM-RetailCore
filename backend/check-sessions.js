const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('rstms_db', 'rstms_user', 'root', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false
});

const CashSession = sequelize.define('CashSession', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  cashier_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  status: { type: DataTypes.ENUM('open', 'closed', 'force_closed'), defaultValue: 'open' }
}, { tableName: 'cash_sessions', timestamps: false });

async function check() {
  try {
    const sessions = await CashSession.findAll({ order: [['id', 'DESC']], limit: 5 });
    console.log("Recent sessions:", JSON.stringify(sessions, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    sequelize.close();
  }
}
check();
