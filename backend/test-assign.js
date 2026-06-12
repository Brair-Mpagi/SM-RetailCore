const axios = require('axios');

async function test() {
  try {
    console.log('Logging in as manager...');
    let res = await axios.post('http://localhost:3000/api/v1/auth/login', { email: 'admin@rstms.com', password: 'password123' });
    const managerToken = res.data.data.token;

    console.log('Logging in as cashier...');
    res = await axios.post('http://localhost:3000/api/v1/auth/login', { email: 'cashier@rstms.com', password: 'password123' });
    const cashierToken = res.data.data.token;
    const cashierId = res.data.data.user.id;

    console.log(`Cashier ID: ${cashierId}`);

    console.log('Assigning shift...');
    res = await axios.post('http://localhost:3000/api/v1/cash-sessions/assign', {
      cashier_id: cashierId,
      opening_balance: 50000
    }, { headers: { Authorization: `Bearer ${managerToken}` } });
    console.log('Assign shift response:', res.data);

    console.log('Fetching active session as cashier...');
    res = await axios.get('http://localhost:3000/api/v1/cash-sessions/active', { headers: { Authorization: `Bearer ${cashierToken}` } });
    console.log('Active session response:', res.data);

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
test();
