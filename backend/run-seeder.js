require('dotenv').config();
const { sequelize } = require('./src/models');
const seeder = require('./src/seeders/20260426-initial-data');

async function runSeeder() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connected');

    console.log('\nRunning seeder...');
    await seeder.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('\n✓ Seeder completed successfully!');
    console.log('\nInitial data created:');
    console.log('- 5 users (managers, cashiers, stock)');
    console.log('- 6 categories (Beverages, Dairy, Bakery, etc.)');
    console.log('- 3 suppliers (Coca-Cola, Nile Breweries, Mukwano)');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeder failed:', error);
    process.exit(1);
  }
}

runSeeder();
