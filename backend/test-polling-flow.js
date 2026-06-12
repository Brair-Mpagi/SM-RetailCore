#!/usr/bin/env node
/**
 * Test Complete Polling Flow
 * Simulates the entire payment flow using polling mode
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api/v1';

async function testPollingFlow() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔄 TESTING POLLING MODE PAYMENT FLOW');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Initiate Payment
    console.log('Step 1: Initiating payment...');
    const initRes = await axios.post(`${BASE_URL}/payments/initiate`, {
      amount: 1000,
      phone_number: '256700000000',
      description: 'Test Polling Payment'
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_TEST_TOKEN', // Replace with actual token
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.error('❌ Payment initiation failed');
      console.error('Error:', err.response?.data || err.message);
      throw err;
    });

    if (!initRes.data.success) {
      console.error('❌ Payment initiation unsuccessful');
      console.error('Response:', initRes.data);
      return;
    }

    const { merchantReference, orderTrackingId, redirectUrl } = initRes.data.data;
    console.log('✅ Payment initiated successfully');
    console.log(`   Merchant Reference: ${merchantReference}`);
    console.log(`   Order Tracking ID: ${orderTrackingId}`);
    console.log(`   Redirect URL: ${redirectUrl}\n`);

    // Step 2: Simulate opening payment page
    console.log('Step 2: Customer would open this URL to complete payment:');
    console.log(`   ${redirectUrl}`);
    console.log('   (In real flow, this opens in new window)\n');

    // Step 3: Start polling
    console.log('Step 3: Starting status polling...');
    console.log('   Polling every 5 seconds for status updates\n');

    let pollCount = 0;
    const maxPolls = 12; // 1 minute for demo
    let finalStatus = null;

    const pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`[Poll #${pollCount}] Checking status...`);

      try {
        const statusRes = await axios.get(
          `${BASE_URL}/payments/status/${merchantReference}`,
          {
            headers: {
              'Authorization': 'Bearer YOUR_TEST_TOKEN' // Replace with actual token
            }
          }
        );

        if (statusRes.data.success) {
          const { status, amount, currency, paymentMethod } = statusRes.data.data;
          console.log(`   Status: ${status.toUpperCase()}`);

          if (status === 'paid') {
            clearInterval(pollInterval);
            finalStatus = 'paid';
            console.log('\n✅ PAYMENT SUCCESSFUL!');
            console.log(`   Amount: ${amount} ${currency}`);
            console.log(`   Method: ${paymentMethod || 'N/A'}`);
            console.log('\n🎉 In real flow, POS would now:');
            console.log('   1. Finalize sale');
            console.log('   2. Generate receipt');
            console.log('   3. Update inventory');
            console.log('   4. Clear cart\n');
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            finalStatus = 'failed';
            console.log('\n❌ PAYMENT FAILED');
            console.log('   Customer may have cancelled or insufficient funds\n');
          } else if (status === 'pending') {
            console.log('   Waiting for customer to complete payment...');
          }
        }

        // Timeout
        if (pollCount >= maxPolls && !finalStatus) {
          clearInterval(pollInterval);
          console.log('\n⏱️  POLLING TIMEOUT');
          console.log('   Payment is still pending after 1 minute');
          console.log('   In production, would continue for 5 minutes\n');
        }

      } catch (pollErr) {
        console.error(`   ❌ Poll failed: ${pollErr.message}`);
        
        if (pollCount >= 3) {
          clearInterval(pollInterval);
          console.error('\n❌ Multiple polling failures - stopping\n');
        }
      }
    }, 5000);

    // Keep script running
    await new Promise(resolve => {
      const checkDone = setInterval(() => {
        if (finalStatus || pollCount >= maxPolls) {
          clearInterval(checkDone);
          resolve();
        }
      }, 1000);
    });

    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.log('═══════════════════════════════════════════════════════════\n');
  }
}

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('1. Make sure backend server is running (npm start)');
console.log('2. Update the Authorization token in this script');
console.log('3. This test initiates a REAL payment order');
console.log('4. Complete the payment on Pesapal page to see "paid" status');
console.log('5. Or let it timeout to see polling behavior\n');

testPollingFlow();
