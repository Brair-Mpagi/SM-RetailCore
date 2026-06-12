#!/usr/bin/env node
/**
 * Database Schema Synchronization Script
 * 
 * This script safely synchronizes the database schema with Sequelize models.
 * Use this instead of automatic sync on server startup.
 * 
 * Usage:
 *   node scripts/sync-database.js           # Safe sync (no data loss)
 *   node scripts/sync-database.js --alter   # Alter existing tables (careful!)
 *   node scripts/sync-database.js --force   # Drop and recreate (DESTROYS DATA!)
 */

require('dotenv').config();
const { sequelize } = require('../src/models');

const args = process.argv.slice(2);
const mode = args[0];

async function syncDatabase() {
  try {
    console.log('─────────────────────────────────────────');
    console.log('Database Schema Synchronization');
    console.log('─────────────────────────────────────────');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');
    
    const modelCount = Object.keys(sequelize.models).length;
    console.log(`✓ Loaded ${modelCount} models`);
    
    let syncOptions = {};
    let warningMessage = '';
    
    if (mode === '--force') {
      console.log('\n⚠️  WARNING: FORCE MODE - ALL DATA WILL BE LOST!');
      syncOptions = { force: true };
      warningMessage = 'Force sync completed (all tables dropped and recreated)';
    } else if (mode === '--alter') {
      console.log('\n⚠️  WARNING: ALTER MODE - Schema will be modified');
      syncOptions = { alter: true };
      warningMessage = 'Alter sync completed (schema modified to match models)';
    } else {
      console.log('\nℹ️  Safe mode: Only creates missing tables');
      syncOptions = {};
      warningMessage = 'Safe sync completed (only missing tables created)';
    }
    
    console.log('\nSynchronizing database schema...\n');
    
    await sequelize.sync(syncOptions);
    
    console.log('\n─────────────────────────────────────────');
    console.log(`✓ ${warningMessage}`);
    console.log('─────────────────────────────────────────\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Database sync failed:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

syncDatabase();
