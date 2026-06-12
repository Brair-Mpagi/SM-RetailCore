#!/usr/bin/env node
/**
 * Register IPN with Network IP instead of localhost
 */

const axios = require('axios');
require('dotenv').config();

const PESAPAL_PROD_URL = 'https://pay.pesapal.com/v3';

const credentials = {
  consumer_key: (process.env.PESAPAL_CONSUMER_KEY || '').trim(),
  consumer_secret: (process.env.PESAPAL_CONSUMER_SECRET || '').trim()
};

const networkIp = process.env.NETWORK_IP || '172.20.10.4';
const port = process.env.PORT || '3000';
const webhookUrl = `http://${networkIp}:${port}/api/v1/payments/webhook`;

async function registerNetworkIPN() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🌐 REGISTERING IPN WITH NETWORK IP');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Network IP: ${networkIp}`);
  console.log(`Port: ${port}`);
  console.log(`Webhook URL: ${webhookUrl}\n`);

  try {
    // Get OAuth token
    console.log('Getting OAuth token...');
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

    // Check existing IPNs
    console.log('Checking existing IPN registrations...');
    const listRes = await axios.get(`${PESAPAL_PROD_URL}/api/URLSetup/GetIpnList`, { headers });
    const ipns = listRes.data || [];
    
    console.log(`Found ${ipns.length} existing IPN(s):\n`);
    ipns.forEach((ipn, i) => {
      console.log(`  ${i + 1}. ${ipn.url}`);
      console.log(`     IPN ID: ${ipn.ipn_id}`);
      console.log(`     Status: ${ipn.ipn_status_decription || 'Unknown'}\n`);
    });

    // Check if network IP webhook already exists
    const existing = ipns.find(ipn => ipn.url === webhookUrl);
    if (existing) {
      console.log('✅ Network IP webhook already registered!');
      console.log(`   IPN ID: ${existing.ipn_id}`);
      console.log(`   URL: ${existing.url}`);
      console.log('\nNo action needed. Use this IPN ID in your code.\n');
      return;
    }

    // Register new IPN with network IP
    console.log('Registering new IPN with network IP...');
    const registerRes = await axios.post(
      `${PESAPAL_PROD_URL}/api/URLSetup/RegisterIPN`,
      {
        url: webhookUrl,
        ipn_notification_type: 'GET'
      },
      { headers }
    );

    console.log('Response:', JSON.stringify(registerRes.data, null, 2));

    if (registerRes.data.ipn_id) {
      console.log('\n✅ SUCCESS! Network IP IPN registered');
      console.log(`   IPN ID: ${registerRes.data.ipn_id}`);
      console.log(`   URL: ${registerRes.data.url}`);
      console.log(`   Status: ${registerRes.data.ipn_status_decription}`);
      console.log('\n🎉 Restart your backend server to use the new IPN.\n');
    } else {
      console.log('\n⚠️  Registration response received but no IPN ID found');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

registerNetworkIPN();
