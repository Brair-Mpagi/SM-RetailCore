const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Hash passwords
    const managerPassword = await bcrypt.hash('manager123', 10);
    const cashierPassword = await bcrypt.hash('cashier123', 10);
    const stockPassword = await bcrypt.hash('stock123', 10);

    // Insert users
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        name: 'Andrew Byamugisha',
        email: 'andrew@andrewbrothers.ug',
        password_hash: managerPassword,
        role: 'manager',
        device_id: 'PC-MAIN-01',
        is_active: 1,
        is_deleted: 0,
        failed_attempts: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        name: 'Grace Tumwebaze',
        email: 'grace@andrewbrothers.ug',
        password_hash: managerPassword,
        role: 'manager',
        device_id: 'LAPTOP-MGR',
        is_active: 1,
        is_deleted: 0,
        failed_attempts: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        name: 'Joshua Kato',
        email: 'joshua@andrewbrothers.ug',
        password_hash: cashierPassword,
        role: 'cashier',
        device_id: 'POS-01',
        is_active: 1,
        is_deleted: 0,
        failed_attempts: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: 4,
        name: 'Birungi Mackline',
        email: 'birungi@andrewbrothers.ug',
        password_hash: cashierPassword,
        role: 'cashier',
        device_id: 'POS-02',
        is_active: 1,
        is_deleted: 0,
        failed_attempts: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: 5,
        name: 'Samuel Byaruhanga',
        email: 'samuel@andrewbrothers.ug',
        password_hash: stockPassword,
        role: 'stock',
        device_id: 'STOCK-DEV-01',
        is_active: 1,
        is_deleted: 0,
        failed_attempts: 0,
        created_at: now,
        updated_at: now
      }
    ]);

    // Insert categories
    await queryInterface.bulkInsert('categories', [
      { id: 1, name: 'Beverages', description: 'Soft drinks, juices, water' },
      { id: 2, name: 'Dairy & Eggs', description: 'Milk, cheese, yogurt, eggs' },
      { id: 3, name: 'Bakery', description: 'Bread, cakes, pastries' },
      { id: 4, name: 'Snacks', description: 'Chips, biscuits, candy' },
      { id: 5, name: 'Personal Care', description: 'Soap, shampoo, toothpaste' },
      { id: 6, name: 'Household', description: 'Cleaning supplies, detergents' }
    ]);

    // Insert suppliers
    await queryInterface.bulkInsert('suppliers', [
      { id: 1, name: 'Coca-Cola Uganda', contact_phone: '+256700000001', contact_email: 'orders@cocacola.ug', lead_time_days: 2, is_active: 1 },
      { id: 2, name: 'Nile Breweries', contact_phone: '+256700000002', contact_email: 'sales@nile.ug', lead_time_days: 3, is_active: 1 },
      { id: 3, name: 'Mukwano Industries', contact_phone: '+256700000003', contact_email: 'orders@mukwano.ug', lead_time_days: 5, is_active: 1 }
    ]);

    console.log('✓ Initial data seeded successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('suppliers', null, {});
  }
};
