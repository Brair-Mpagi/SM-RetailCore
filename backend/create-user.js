const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createUser() {
  try {
    // Database connection
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'rstms_user',
      password: 'root',
      database: 'rstms_db'
    });

    console.log('✓ Connected to database');

    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('✓ Password hashed');

    // Delete existing user with same email if exists
    await connection.execute(
      'DELETE FROM users WHERE email = ?',
      ['admin@admin.com']
    );

    // Insert new user
    const [result] = await connection.execute(
      `INSERT INTO users (name, email, password_hash, role, is_active, is_deleted, failed_attempts, device_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      ['Admin User', 'admin@admin.com', hashedPassword, 'manager', 1, 0, 0, 'ADMIN-PC']
    );

    console.log('✓ User created successfully!');
    console.log('');
    console.log('=================================');
    console.log('LOGIN CREDENTIALS:');
    console.log('=================================');
    console.log('Email: admin@admin.com');
    console.log('Password: admin123');
    console.log('Role: manager');
    console.log('=================================');
    console.log('');
    console.log('You can now login with these credentials!');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createUser();
