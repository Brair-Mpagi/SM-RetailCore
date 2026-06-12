const { Product, Category, Supplier, Inventory, sequelize } = require('./src/models');

async function testDatabaseOperations() {
  try {
    console.log('🔍 Testing database operations...\n');

    // Test 1: Check database connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Test 2: Check if tables exist
    console.log('2. Checking tables...');
    const tables = await sequelize.query("SHOW TABLES", { type: sequelize.QueryTypes.SELECT });
    console.log('✅ Tables found:', tables.length);
    console.log('   Tables:', tables.map(t => Object.values(t)[0]).join(', '), '\n');

    // Test 3: Check categories
    console.log('3. Testing categories...');
    const categories = await Category.findAll();
    console.log(`✅ Categories found: ${categories.length}`);
    if (categories.length > 0) {
      console.log('   First category:', categories[0].toJSON());
    }
    console.log('');

    // Test 4: Check suppliers
    console.log('4. Testing suppliers...');
    const suppliers = await Supplier.findAll();
    console.log(`✅ Suppliers found: ${suppliers.length}`);
    if (suppliers.length > 0) {
      console.log('   First supplier:', suppliers[0].toJSON());
    }
    console.log('');

    // Test 5: Check products
    console.log('5. Testing products...');
    const products = await Product.findAll({ limit: 5 });
    console.log(`✅ Products found: ${products.length}`);
    if (products.length > 0) {
      console.log('   First product:', products[0].toJSON());
    }
    console.log('');

    // Test 6: Check inventory table structure
    console.log('6. Checking inventory table structure...');
    const [inventoryColumns] = await sequelize.query("DESCRIBE inventory");
    console.log('✅ Inventory columns:');
    inventoryColumns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    console.log('');

    // Test 7: Try creating a test product
    console.log('7. Testing product creation...');
    const testCategory = categories[0];
    const testSupplier = suppliers[0];

    if (!testCategory) {
      console.log('❌ No categories found. Creating test category...');
      const newCat = await Category.create({ name: 'Test Category', description: 'Test' });
      console.log('✅ Test category created:', newCat.id);
    }

    const transaction = await sequelize.transaction();
    try {
      const testProduct = await Product.create({
        name: 'Test Product ' + Date.now(),
        sku: 'TEST-' + Date.now(),
        barcode: null,
        category_id: testCategory ? testCategory.id : 1,
        unit_price: 1000,
        cost_price: 800,
        supplier_id: testSupplier ? testSupplier.id : null,
        reorder_point: 5,
        unit_of_measure: 'pcs',
        expiry_date: null,
        location: null,
        is_active: 1,
        is_deleted: 0
      }, { transaction });

      console.log('✅ Test product created:', testProduct.id);

      // Create inventory record
      const testInventory = await Inventory.create({
        product_id: testProduct.id,
        quantity_on_hand: 10,
        last_updated: new Date()
      }, { transaction });

      console.log('✅ Test inventory created:', testInventory.id);

      await transaction.commit();
      console.log('✅ Transaction committed successfully\n');

      // Clean up test product
      await testProduct.update({ is_deleted: 1 });
      console.log('✅ Test product cleaned up\n');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Product creation failed:', error.message);
      console.error('   Error details:', error);
      throw error;
    }

    console.log('✅ All tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testDatabaseOperations();
