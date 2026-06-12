const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define
  }
);

const db = {};

// Import models
db.User = require('./User')(sequelize);
db.Permission = require('./Permission')(sequelize);
db.Device = require('./Device')(sequelize);
db.Category = require('./Category')(sequelize);
db.Supplier = require('./Supplier')(sequelize);
db.Product = require('./Product')(sequelize);
db.PriceHistory = require('./PriceHistory')(sequelize);
db.Inventory = require('./Inventory')(sequelize);
db.StockMovement = require('./StockMovement')(sequelize);
db.CashSession = require('./CashSession')(sequelize);
db.SalesTransaction = require('./SalesTransaction')(sequelize);
db.SaleItem = require('./SaleItem')(sequelize);
db.Return = require('./Return')(sequelize);
db.PurchaseOrder = require('./PurchaseOrder')(sequelize);
db.PurchaseOrderItem = require('./PurchaseOrderItem')(sequelize);
db.PurchaseRequest = require('./PurchaseRequest')(sequelize);
db.PurchaseRequestItem = require('./PurchaseRequestItem')(sequelize);
db.Promotion = require('./Promotion')(sequelize);
db.Stocktake = require('./Stocktake')(sequelize);
db.StocktakeItem = require('./StocktakeItem')(sequelize);
db.Loss = require('./Loss')(sequelize);
db.Alert = require('./Alert')(sequelize);
db.AuditLog = require('./AuditLog')(sequelize);
db.ForecastData = require('./ForecastData')(sequelize);
db.ShelfTag = require('./ShelfTag')(sequelize);
db.SystemSetting = require('./SystemSetting')(sequelize);
db.PesapalTransaction = require('./PesapalTransaction')(sequelize);
// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
