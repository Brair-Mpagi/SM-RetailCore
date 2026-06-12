require('dotenv').config();
const { User } = require('./src/models');

async function testLogin() {
  try {
    console.log('Testing login for admin@admin.com...\n');
    
    // Find user
    const user = await User.findOne({
      where: { 
        email: 'admin@admin.com',
        is_deleted: 0
      }
    });

    if (!user) {
      console.error('✗ User not found');
      process.exit(1);
    }

    console.log('✓ User found:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Active: ${user.is_active ? 'Yes' : 'No'}`);
    console.log();

    // Test password
    const testPassword = 'admin123';
    const isValid = await user.validatePassword(testPassword);

    if (isValid) {
      console.log(`✓ Password '${testPassword}' is VALID`);
      console.log('\n✓ Login should work!');
    } else {
      console.log(`✗ Password '${testPassword}' is INVALID`);
      console.log('\nPassword hash in DB:', user.password_hash.substring(0, 20) + '...');
      console.log('\nTrying to reset password...');
      
      // Reset password
      user.password_hash = await User.hashPassword(testPassword);
      await user.save();
      
      console.log('✓ Password reset complete');
      console.log('✓ Try logging in again with: admin@admin.com / admin123');
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testLogin();
