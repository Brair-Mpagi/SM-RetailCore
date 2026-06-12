#!/usr/bin/env node
/**
 * Test IPN Registration with Pesapal API 3.0
 */

const axios = require('axios');
require('dotenv').config();

const PESAPAL_PROD_URL = 'https://pay.pesapal.com/v3';

const credentials = {
  consumer_key: (process.env.PESAPAL_CONSUMER_KEY || '').trim(),
  consumer_secret: (process.env.PESAPAL_CONSUMER_SECRET || '').trim()
};

async function testIPNRegistration() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔔 TESTING PESAPAL IPN REGISTRATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Get OAuth token
    console.log('Step 1: Getting OAuth token...');
    const authRes = await axios.post(`${PESAPAL_PROD_URL}/api/Auth/RequestToken`, credentials, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    if (!authRes.data.token) {
      console.log('❌ Failed to get token');
      console.log('Response:', authRes.data);
      return;
    }

    const token = authRes.data.token;
    console.log('✅ Token received:', token.substring(0, 30) + '...\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Step 2: Get existing IPN list
    console.log('Step 2: Checking existing IPN registrations...');
    try {
      const listRes = await axios.get(`${PESAPAL_PROD_URL}/api/URLSetup/GetIpnList`, { 
        headers,
        validateStatus: () => true 
      });
      console.log(`Status: ${listRes.status}`);
      console.log('Response:', JSON.stringify(listRes.data, null, 2));
      console.log();
    } catch (err) {
      console.log('⚠️  GetIpnList failed:', err.message);
      console.log();
    }

    // Step 3: Register new IPN
    const testWebhookUrl = 'http://localhost:3000/api/v1/payments/webhook';
    console.log('Step 3: Registering new IPN...');
    console.log(`URL: ${testWebhookUrl}`);
    
    const registerRes = await axios.post(
      `${PESAPAL_PROD_URL}/api/URLSetup/RegisterIPN`,
      {
        url: testWebhookUrl,
        ipn_notification_type: 'GET'
      },
      { 
        headers,
        validateStatus: () => true 
      }
    );

    console.log(`Status: ${registerRes.status}`);
    console.log('Response:', JSON.stringify(registerRes.data, null, 2));

    if (registerRes.status === 200 && registerRes.data.ipn_id) {
      console.log('\n✅ SUCCESS! IPN registered successfully');
      console.log(`IPN ID: ${registerRes.data.ipn_id}`);
      console.log(`URL: ${registerRes.data.url || testWebhookUrl}`);
      console.log('\n🎉 The endpoint is working! No manual setup needed.');
    } else if (registerRes.status === 200) {
      console.log('\n✅ Request succeeded but check response format');
    } else {
      console.log('\n❌ Registration failed');
      console.log('Status:', registerRes.status);
      console.log('Data:', registerRes.data);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

testIPNRegistration();
