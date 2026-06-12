const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testProductAPI() {
  try {
    console.log('🔍 Testing Product API...\n');

    // Step 1: Login
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'stock@rstms.com',
      password: 'stock123'
    });

    const token = loginRes.data.token;
    const user = loginRes.data.user;
    console.log(`✅ Logged in as: ${user.email} (${user.role})`);
    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Get categories
    console.log('2. Fetching categories...');
    const categoriesRes = await axios.get(`${API_URL}/categories`, { headers });
    const categories = categoriesRes.data.data || categoriesRes.data;
    console.log(`✅ Categories found: ${categories.length}`);
    if (categories.length > 0) {
      console.log(`   First category: ${categories[0].name} (ID: ${categories[0].id})\n`);
    }

    // Step 3: Get suppliers
    console.log('3. Fetching suppliers...');
    const suppliersRes = await axios.get(`${API_URL}/suppliers`, { headers });
    const suppliers = suppliersRes.data.data || suppliersRes.data;
    console.log(`✅ Suppliers found: ${suppliers.length}`);
    if (suppliers.length > 0) {
      console.log(`   First supplier: ${suppliers[0].name} (ID: ${suppliers[0].id})\n`);
    }

    // Step 4: Create a test product
    console.log('4. Creating test product...');
    const testProduct = {
      name: 'Test Product ' + Date.now(),
      sku: 'TEST-' + Date.now(),
      barcode: '123456789',
      category_id: categories[0].id,
      unit_price: 5000,
      cost_price: 3000,
      supplier_id: suppliers[0].id,
      stock: 50,
      reorder_point: 10,
      unit_of_measure: 'pcs',
      expiry_date: null,
      location: 'Test Shelf'
    };

    console.log('   Sending product data:', JSON.stringify(testProduct, null, 2));

    try {
      const createRes = await axios.post(`${API_URL}/products`, testProduct, { headers });
      console.log('✅ Product created successfully!');
      console.log('   Response:', JSON.stringify(createRes.data, null, 2));
      
      // Clean up
      const productId = createRes.data.data.id;
      await axios.delete(`${API_URL}/products/${productId}`, { headers });
      console.log(`✅ Test product cleaned up (ID: ${productId})\n`);
      
    } catch (createError) {
      console.error('❌ Product creation failed!');
      console.error('   Status:', createError.response?.status);
      console.error('   Error:', createError.response?.data);
      console.error('   Full error:', createError.message);
      throw createError;
    }

    console.log('✅ All API tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

testProductAPI();
