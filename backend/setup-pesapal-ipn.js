#!/usr/bin/env node
/**
 * Pesapal Production IPN Setup Guide
 * This script helps you register the IPN (webhook) URL with Pesapal
 */

require('dotenv').config();

const currentEnv = process.env.PESAPAL_ENV || 'sandbox';
const ipnId = process.env.PESAPAL_IPN_ID;
const port = process.env.PORT || 3000;

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🔔 PESAPAL IPN (WEBHOOK) SETUP GUIDE');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`Current Environment: ${currentEnv.toUpperCase()}`);
console.log(`Current IPN ID: ${ipnId || '(not set)'}\n`);

if (currentEnv === 'sandbox') {
  console.log('✅ SANDBOX MODE');
  console.log('   IPN registration is handled automatically by the system.');
  console.log('   No manual setup required.\n');
  process.exit(0);
}

console.log('⚠️  PRODUCTION MODE DETECTED\n');
console.log('Production requires manual IPN registration via Pesapal dashboard.\n');

// Determine the webhook URL
let webhookUrl;
if (process.env.NODE_ENV === 'production') {
  // Production server - use your actual domain
  const domain = process.env.DOMAIN || 'yourdomain.com';
  webhookUrl = `https://${domain}/api/v1/payments/webhook`;
} else {
  // Local development
  webhookUrl = `http://localhost:${port}/api/v1/payments/webhook`;
}

console.log('📋 YOUR WEBHOOK URL:');
console.log(`   ${webhookUrl}\n`);

if (!ipnId) {
  console.log('❌ PESAPAL_IPN_ID is NOT configured in .env\n');
  console.log('📝 SETUP INSTRUCTIONS:\n');
  console.log('1. Log into Pesapal Merchant Dashboard');
  console.log('   → https://www.pesapal.com\n');
  
  console.log('2. Navigate to IPN Settings');
  console.log('   → Dashboard → Settings → IPN Settings\n');
  
  console.log('3. Register Your Webhook URL');
  console.log(`   → URL: ${webhookUrl}`);
  console.log('   → Notification Type: GET (or POST if preferred)\n');
  
  console.log('4. Copy the IPN ID');
  console.log('   → After registration, Pesapal will provide an IPN ID');
  console.log('   → It looks like: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"\n');
  
  console.log('5. Add to Your .env File');
  console.log('   → Open backend/.env');
  console.log('   → Add this line:');
  console.log('     PESAPAL_IPN_ID=your_ipn_id_from_step_4\n');
  
  console.log('6. Restart Backend Server');
  console.log('   → Stop current server (Ctrl+C)');
  console.log('   → npm start\n');
  
  console.log('⚠️  Until IPN ID is configured, payment initiations will fail.\n');
  console.log('───────────────────────────────────────────────────────────\n');
} else {
  console.log('✅ PESAPAL_IPN_ID is configured\n');
  console.log(`   IPN ID: ${ipnId}\n`);
  console.log('🔍 Verify in Pesapal Dashboard:');
  console.log('   1. Login to https://www.pesapal.com');
  console.log('   2. Go to Settings → IPN Settings');
  console.log(`   3. Confirm IPN ID "${ipnId}" exists`);
  console.log(`   4. Confirm URL matches: ${webhookUrl}\n`);
  console.log('✅ If everything matches, your IPN is properly configured!\n');
}

console.log('═══════════════════════════════════════════════════════════\n');
