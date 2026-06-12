require('dotenv').config();
const { sequelize, Category, Supplier, User } = require('./src/models');
const seeder = require('./src/seeders/20260426-initial-data');

async function setupDatabase() {
  try {
    console.log('=== Database Setup ===\n');
    
    // Test connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('   ✓ Connected to database\n');

    // Check if data already exists
    console.log('2. Checking existing data...');
    const categoryCount = await Category.count();
    const supplierCount = await Supplier.count();
    const userCount = await User.count();
    
    console.log(`   - Categories: ${categoryCount}`);
    console.log(`   - Suppliers: ${supplierCount}`);
    console.log(`   - Users: ${userCount}\n`);

    if (categoryCount === 0 || supplierCount === 0) {
      console.log('3. Running seeder to populate initial data...');
      await seeder.up(sequelize.getQueryInterface(), sequelize.Sequelize);
      console.log('   ✓ Seeder completed\n');
      
      console.log('4. Verifying seeded data...');
      const newCategoryCount = await Category.count();
      const newSupplierCount = await Supplier.count();
      const newUserCount = await User.count();
      
      console.log(`   - Categories: ${newCategoryCount}`);
      console.log(`   - Suppliers: ${newSupplierCount}`);
      console.log(`   - Users: ${newUserCount}\n`);
    } else {
      console.log('3. Database already has data, skipping seeder\n');
    }

    console.log('=== Setup Complete ===\n');
    console.log('You can now:');
    console.log('1. Start the backend: cd backend && npm start');
    console.log('2. Login with: admin@admin.com / admin123');
    console.log('3. Add products with proper categories and suppliers\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Setup failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

setupDatabase();
