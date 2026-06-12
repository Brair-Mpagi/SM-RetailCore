#!/usr/bin/env node
/**
 * Test Submit Order Request to Pesapal
 */

const axios = require('axios');
require('dotenv').config();

const PESAPAL_PROD_URL = 'https://pay.pesapal.com/v3';

const credentials = {
  consumer_key: (process.env.PESAPAL_CONSUMER_KEY || '').trim(),
  consumer_secret: (process.env.PESAPAL_CONSUMER_SECRET || '').trim()
};

async function testSubmitOrder() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('💳 TESTING PESAPAL SUBMIT ORDER REQUEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Get OAuth token
    console.log('Step 1: Getting OAuth token...');
    const authRes = await axios.post(`${PESAPAL_PROD_URL}/api/Auth/RequestToken`, credentials, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    const token = authRes.data.token;
    console.log('✅ Token received\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Step 2: Get IPN ID
    console.log('Step 2: Getting IPN list...');
    const ipnListRes = await axios.get(`${PESAPAL_PROD_URL}/api/URLSetup/GetIpnList`, { headers });
    const ipns = ipnListRes.data || [];
    
    if (ipns.length === 0) {
      console.log('❌ No IPN registered. Run test-ipn-registration.js first');
      return;
    }

    const ipnId = ipns[0].ipn_id;
    console.log(`✅ Using IPN ID: ${ipnId}\n`);

    // Step 3: Submit test order
    console.log('Step 3: Submitting test order...');
    
    const testOrder = {
      id: `TEST-${Date.now()}`,
      currency: 'UGX',
      amount: 1000,
      description: 'Test POS Payment',
      callback_url: 'http://localhost:3000/api/v1/payments/webhook',
      notification_id: ipnId,
      billing_address: {
        email_address: 'test@supermarket.ug',
        phone_number: '256700000000',
        country_code: 'UG',
        first_name: 'Test',
        last_name: 'Customer',
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        postal_code: '',
        zip_code: ''
      }
    };

    console.log('Request Payload:');
    console.log(JSON.stringify(testOrder, null, 2));
    console.log();

    const submitRes = await axios.post(
      `${PESAPAL_PROD_URL}/api/Transactions/SubmitOrderRequest`,
      testOrder,
      { 
        headers,
        validateStatus: () => true 
      }
    );

    console.log(`Response Status: ${submitRes.status}`);
    console.log('Response Data:');
    console.log(JSON.stringify(submitRes.data, null, 2));

    if (submitRes.status === 200 && submitRes.data.order_tracking_id) {
      console.log('\n✅ SUCCESS! Order submitted');
      console.log(`Order Tracking ID: ${submitRes.data.order_tracking_id}`);
      console.log(`Redirect URL: ${submitRes.data.redirect_url}`);
    } else {
      console.log('\n❌ Order submission failed');
      console.log('Check response above for error details');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

testSubmitOrder();
