require('dotenv').config();
const { sequelize, Product, Category, Supplier, Inventory } = require('./src/models');

async function testProductCreation() {
  try {
    console.log('=== Testing Product Creation ===\n');
    
    // Connect to database
    console.log('1. Connecting to database...');
    await sequelize.authenticate();
    console.log('   ✓ Connected\n');

    // Check categories
    console.log('2. Checking categories...');
    const categories = await Category.findAll();
    console.log(`   ✓ Found ${categories.length} categories:`);
    categories.forEach(cat => console.log(`      - ${cat.id}: ${cat.name}`));
    console.log();

    // Check suppliers
    console.log('3. Checking suppliers...');
    const suppliers = await Supplier.findAll();
    console.log(`   ✓ Found ${suppliers.length} suppliers:`);
    suppliers.forEach(sup => console.log(`      - ${sup.id}: ${sup.name}`));
    console.log();

    // Try to create a test product
    console.log('4. Creating test product...');
    const transaction = await sequelize.transaction();
    
    try {
      const testProduct = await Product.create({
        name: 'Test Product - Coca Cola 500ml',
        sku: 'TEST-' + Date.now(),
        barcode: '123456789' + Date.now(),
        category_id: 1, // Beverages
        unit_price: 2500.00,
        cost_price: 1800.00,
        supplier_id: 1, // Coca-Cola Uganda
        reorder_point: 20,
        unit_of_measure: 'bottle',
        is_active: 1,
        is_deleted: 0
      }, { transaction });

      console.log(`   ✓ Product created with ID: ${testProduct.id}`);

      // Create inventory record
      await Inventory.create({
        product_id: testProduct.id,
        quantity_on_hand: 50,
        last_updated: new Date()
      }, { transaction });

      console.log('   ✓ Inventory record created');

      await transaction.commit();
      console.log('   ✓ Transaction committed\n');

      // Fetch the complete product
      console.log('5. Fetching complete product with associations...');
      const completeProduct = await Product.findByPk(testProduct.id, {
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' },
          { model: Inventory, as: 'inventory' }
        ]
      });

      console.log('   ✓ Product details:');
      console.log(`      - Name: ${completeProduct.name}`);
      console.log(`      - SKU: ${completeProduct.sku}`);
      console.log(`      - Category: ${completeProduct.category.name}`);
      console.log(`      - Supplier: ${completeProduct.supplier.name}`);
      console.log(`      - Price: UGX ${completeProduct.unit_price}`);
      console.log(`      - Stock: ${completeProduct.inventory.quantity_on_hand}`);
      console.log();

      // Clean up test product
      console.log('6. Cleaning up test product...');
      await completeProduct.update({ is_deleted: 1 });
      console.log('   ✓ Test product marked as deleted\n');

      console.log('=== Test Successful! ===\n');
      console.log('Your database is ready for product creation.');
      console.log('You can now add products through the frontend.\n');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error('\nFull error:', error);
    console.error('\nPossible issues:');
    console.error('1. Categories or suppliers not seeded - run: node setup-database.js');
    console.error('2. Database connection issue - check XAMPP MySQL is running');
    console.error('3. Foreign key constraint - check category_id and supplier_id exist\n');
    process.exit(1);
  }
}

testProductCreation();
