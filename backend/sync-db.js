require('dotenv').config();
const { sequelize, Supplier, ShelfTag, CashSession, PesapalTransaction } = require('./src/models');

async function sync() {
  try {
    console.log("Syncing Supplier...");
    await Supplier.sync({ alter: true });
    
    console.log("Syncing ShelfTag...");
    await ShelfTag.sync({ alter: true });

    console.log("Syncing CashSession (adding notes column)...");
    await CashSession.sync({ alter: true });

    console.log("Syncing PesapalTransaction...");
    await PesapalTransaction.sync({ alter: true });
    
    console.log("✓ Sync complete!");
  } catch (error) {
    console.error("Sync failed:", error);
  } finally {
    process.exit();
  }
}

sync();
