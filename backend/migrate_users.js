require('dotenv').config();
const { sequelize } = require('./src/models');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Altering users table to add reset_pin columns...');
    
    // Add reset_pin
    await sequelize.query('ALTER TABLE users ADD COLUMN reset_pin VARCHAR(255) NULL;');
    console.log('Added reset_pin');
    
    // Add reset_pin_expires_at
    await sequelize.query('ALTER TABLE users ADD COLUMN reset_pin_expires_at DATETIME NULL;');
    console.log('Added reset_pin_expires_at');
    
    console.log('Migration successful!');
  } catch (error) {
    if (error.name === 'SequelizeDatabaseError' && error.message.includes('Duplicate column name')) {
      console.log('Columns already exist, migration skipped.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    await sequelize.close();
  }
}

migrate();
