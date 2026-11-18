/**
 * Test Setup
 * Creates test database and seeds minimal test data before running tests
 */

const { sequelize } = require('../src/models');
const { User, Category, Supplier, Product, Inventory } = require('../src/models');
const bcrypt = require('bcryptjs');

// Increase timeout for database operations
jest.setTimeout(30000);

beforeAll(async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    
    // Sync database schema (force: true drops and recreates tables)
    await sequelize.sync({ force: true });
    
    // Seed minimal test data
    await seedTestData();
    
    console.log('✓ Test database initialized');
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

/**
 * Seed minimal test data for all tests
 */
async function seedTestData() {
  const now = new Date();

  // Create test users
  const managerPassword = await bcrypt.hash('manager123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  await User.bulkCreate([
    {
      id: 1,
      name: 'Test Manager',
      email: 'manager@test.com',
      password_hash: managerPassword,
      role: 'manager',
      is_active: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: 2,
      name: 'Test Cashier',
      email: 'cashier@test.com',
      password_hash: cashierPassword,
      role: 'cashier',
      is_active: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: 3,
      name: 'Test Stock',
      email: 'stock@test.com',
      password_hash: cashierPassword,
      role: 'stock',
      is_active: 1,
      created_at: now,
      updated_at: now,
    },
  ]);

  // Create test categories
  await Category.bulkCreate([
    { id: 1, name: 'Test Category 1', description: 'Test category' },
    { id: 2, name: 'Test Category 2', description: 'Test category' },
  ]);

  // Create test supplier
  await Supplier.create({
    id: 1,
    name: 'Test Supplier',
    contact_phone: '+256700000000',
    contact_email: 'supplier@test.com',
    is_active: 1,
  });

  // Create test products
  await Product.bulkCreate([
    {
      id: 1,
      name: 'Test Product 1',
      sku: 'TEST-001',
      barcode: '1234567890',
      category_id: 1,
      supplier_id: 1,
      unit_price: 1000,
      cost_price: 700,
      reorder_point: 10,
      is_active: 1,
    },
    {
      id: 2,
      name: 'Test Product 2',
      sku: 'TEST-002',
      barcode: '0987654321',
      category_id: 1,
      supplier_id: 1,
      unit_price: 2000,
      cost_price: 1500,
      reorder_point: 5,
      is_active: 1,
    },
    {
      id: 3,
      name: 'Test Product 3',
      sku: 'TEST-003',
      category_id: 2,
      supplier_id: 1,
      unit_price: 500,
      cost_price: 300,
      reorder_point: 20,
      is_active: 1,
    },
  ]);

  // Create inventory records
  await Inventory.bulkCreate([
    { product_id: 1, quantity_on_hand: 100 },
    { product_id: 2, quantity_on_hand: 50 },
    { product_id: 3, quantity_on_hand: 1 }, // Low stock for testing
  ]);
}

/**
 * Helper to clean up database between tests
 */
global.cleanupDatabase = async () => {
  const models = [
    'SaleItem',
    'SalesTransaction',
    'CashSession',
    'StockMovement',
    'Alert',
  ];

  for (const modelName of models) {
    if (sequelize.models[modelName]) {
      await sequelize.models[modelName].destroy({ where: {}, force: true });
    }
  }
};

/**
 * Helper to generate JWT token for tests
 */
global.generateTestToken = (userId, role = 'cashier') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
};
