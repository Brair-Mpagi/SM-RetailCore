#!/usr/bin/env node
/**
 * Pesapal API 3.0 Authentication Diagnostic Tool
 * Tests both sandbox and production endpoints to find working configuration
 */

const axios = require('axios');
require('dotenv').config();

const ENDPOINTS = {
  sandbox: 'https://cybqa.pesapal.com/pesapalv3',
  live: 'https://pay.pesapal.com/v3'
};

const credentials = {
  consumer_key: (process.env.PESAPAL_CONSUMER_KEY || '').trim(),
  consumer_secret: (process.env.PESAPAL_CONSUMER_SECRET || '').trim()
};

console.log('═══════════════════════════════════════════════════════════');
console.log('🔐 PESAPAL API 3.0 AUTHENTICATION DIAGNOSTIC TOOL');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📋 Configuration:');
console.log(`   Consumer Key: ${credentials.consumer_key.substring(0, 20)}...`);
console.log(`   Consumer Secret: ${credentials.consumer_secret.substring(0, 10)}...`);
console.log(`   Current ENV Setting: ${process.env.PESAPAL_ENV || 'sandbox'}\n`);

async function testAuthentication(environment, baseUrl) {
  console.log(`\n🧪 Testing ${environment.toUpperCase()} environment...`);
  console.log(`   Endpoint: ${baseUrl}/api/Auth/RequestToken`);
  
  try {
    const response = await axios.post(
      `${baseUrl}/api/Auth/RequestToken`,
      credentials,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000,
        validateStatus: () => true // Accept all status codes
      }
    );

    console.log(`   HTTP Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));

    // Check for success
    if (response.data && response.data.token) {
      console.log(`   ✅ SUCCESS! Token received.`);
      return {
        success: true,
        environment,
        baseUrl,
        token: response.data.token,
        response: response.data
      };
    }

    // Check for errors
    if (response.data && response.data.error) {
      const error = response.data.error;
      console.log(`   ❌ FAILED: ${error.code || 'unknown_error'}`);
      console.log(`   Message: ${error.message || 'No message provided'}`);
      return {
        success: false,
        environment,
        error: error.code,
        message: error.message,
        fullResponse: response.data
      };
    }

    // Unexpected response format
    console.log(`   ⚠️  Unexpected response format`);
    return {
      success: false,
      environment,
      error: 'unexpected_response',
      fullResponse: response.data
    };

  } catch (error) {
    console.log(`   ❌ REQUEST FAILED`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`   Network Error: Connection refused`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`   Network Error: Request timeout`);
    } else if (error.response) {
      console.log(`   HTTP ${error.response.status}: ${error.response.statusText}`);
      console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    return {
      success: false,
      environment,
      error: error.code || 'request_failed',
      message: error.message
    };
  }
}

async function runDiagnostics() {
  // Validation
  if (!credentials.consumer_key || !credentials.consumer_secret) {
    console.log('❌ ERROR: Consumer key or secret not found in environment variables\n');
    process.exit(1);
  }

  console.log('─────────────────────────────────────────────────────────');
  console.log('PHASE 1: ENVIRONMENT DETECTION');
  console.log('─────────────────────────────────────────────────────────');

  const results = [];

  // Test Sandbox
  const sandboxResult = await testAuthentication('sandbox', ENDPOINTS.sandbox);
  results.push(sandboxResult);

  // Test Live
  const liveResult = await testAuthentication('live', ENDPOINTS.live);
  results.push(liveResult);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 DIAGNOSTIC RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Find successful environment
  const successfulEnv = results.find(r => r.success);

  if (successfulEnv) {
    console.log('✅ AUTHENTICATION SUCCESSFUL!\n');
    console.log('📝 Working Configuration:');
    console.log(`   Environment: ${successfulEnv.environment}`);
    console.log(`   Endpoint: ${successfulEnv.baseUrl}`);
    console.log(`   Token: ${successfulEnv.token.substring(0, 30)}...`);
    
    if (successfulEnv.environment !== process.env.PESAPAL_ENV) {
      console.log(`\n⚠️  FIX REQUIRED: Update your .env file:`);
      console.log(`   PESAPAL_ENV=${successfulEnv.environment}`);
    } else {
      console.log(`\n✅ .env configuration is correct`);
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. If environment was wrong, update .env and restart backend');
    console.log('   2. Test payment initiation from POS terminal');
    console.log('   3. Monitor webhook callbacks\n');

    process.exit(0);
  } else {
    console.log('❌ AUTHENTICATION FAILED ON BOTH ENVIRONMENTS\n');
    
    console.log('📋 Failure Analysis:');
    results.forEach(result => {
      console.log(`\n   ${result.environment.toUpperCase()}:`);
      console.log(`   └─ Error: ${result.error}`);
      if (result.message) {
        console.log(`   └─ Message: ${result.message}`);
      }
    });

    console.log('\n🔍 Likely Issues:');
    const allErrors = results.map(r => r.error);
    
    if (allErrors.includes('invalid_consumer_key_or_secret_provided')) {
      console.log('   • Credentials are incorrect or not activated');
      console.log('   • Merchant account may not be approved yet');
      console.log('   • API access may not be enabled on your account');
    }
    
    if (allErrors.includes('ECONNREFUSED') || allErrors.includes('ETIMEDOUT')) {
      console.log('   • Network connectivity issues');
      console.log('   • Firewall blocking requests');
      console.log('   • Invalid API endpoint URL');
    }

    console.log('\n🛠️  RECOMMENDED ACTIONS:');
    console.log('   1. Log into Pesapal Merchant Dashboard');
    console.log('   2. Verify account status is "Active" or "Approved"');
    console.log('   3. Check if API access is enabled');
    console.log('   4. Regenerate API credentials if available');
    console.log('   5. Contact Pesapal support with merchant ID\n');

    console.log('📧 Pesapal Support:');
    console.log('   Email: support@pesapal.com');
    console.log('   Docs: https://developer.pesapal.com\n');

    process.exit(1);
  }
}

runDiagnostics().catch(err => {
  console.error('\n💥 Fatal Error:', err.message);
  process.exit(1);
});
