const axios = require('axios');

const PESAPAL_SANDBOX_URL = 'https://cybqa.pesapal.com/pesapalv3';
const PESAPAL_PROD_URL = 'https://pay.pesapal.com/v3';

// Cache values in module-level scope
let cachedToken = null;
let tokenExpiry = 0;
let cachedIpnId = null;

// Exponential backoff helper for retries
async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 1) throw err;
    const errMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Connection Timeout / Network Error';
    console.warn(`[Pesapal Service] Call failed: "${errMessage}". Retrying in ${delay}ms... (${retries - 1} left)`);
    await new Promise(res => setTimeout(res, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

class PesapalService {
  constructor() {
    this.env = process.env.PESAPAL_ENV || 'sandbox';
    this.consumerKey = process.env.PESAPAL_CONSUMER_KEY || 'ufUgLvAFoKeuomS/h5NcsoMNZDkknKga';
    this.consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || 'o4rVsxQU7nIqOn8dAORXPBsisOs=';
    this.baseUrl = this.env === 'production' ? PESAPAL_PROD_URL : PESAPAL_SANDBOX_URL;
  }

  /**
   * Request OAuth Token
   * POST /api/Auth/RequestToken
   */
  async getAccessToken() {
    // Return cached token if it has more than 2 minutes before expiry
    if (cachedToken && Date.now() + 120 * 1000 < tokenExpiry) {
      return cachedToken;
    }

    console.log('[Pesapal Service] Fetching a new OAuth access token...');
    return retry(async () => {
      const response = await axios.post(`${this.baseUrl}/api/Auth/RequestToken`, {
        consumer_key: this.consumerKey,
        consumer_secret: this.consumerSecret
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('[Pesapal Service] Token Response Status:', response.status);
      console.log('[Pesapal Service] Token Response Data:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.token) {
        cachedToken = response.data.token;
        // Parse expiry or default to 50 minutes (Pesapal token normally lasts 1 hour)
        const durationMs = 50 * 60 * 1000; 
        tokenExpiry = Date.now() + durationMs;
        console.log('[Pesapal Service] Access token updated successfully');
        return cachedToken;
      }

      throw new Error(`OAuth RequestToken response did not contain access token. Received: ${JSON.stringify(response.data)}`);
    });
  }

  /**
   * Get/Register IPN ID
   * GET /api/URLSetup/GetIpnList
   * POST /api/URLSetup/RegisterIPN
   * 
   * Works for both sandbox and production via API 3.0
   */
  async getIPNId(callbackUrl) {
    if (cachedIpnId) return cachedIpnId;

    return retry(async () => {
      const token = await this.getAccessToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // 1. Try to check list of registered IPNs
      try {
        const listRes = await axios.get(`${this.baseUrl}/api/URLSetup/GetIpnList`, { headers });
        const ipns = listRes.data || [];
        if (Array.isArray(ipns) && ipns.length > 0) {
          const matched = ipns.find(ipn => ipn.url === callbackUrl);
          if (matched && matched.ipn_id) {
            console.log(`[Pesapal Service] Reusing existing IPN ID: ${matched.ipn_id} for URL: ${callbackUrl}`);
            cachedIpnId = matched.ipn_id;
            return cachedIpnId;
          }
        }
      } catch (listErr) {
        console.warn(`[Pesapal Service] GetIpnList failed (non-blocking): ${listErr.message}`);
      }

      // 2. Register a new IPN URL
      console.log(`[Pesapal Service] Registering new webhook URL with Pesapal: ${callbackUrl}`);
      const regRes = await axios.post(`${this.baseUrl}/api/URLSetup/RegisterIPN`, {
        url: callbackUrl,
        ipn_notification_type: 'GET'
      }, { headers });

      // Check response structure
      const ipnData = regRes.data;
      if (ipnData && ipnData.ipn_id) {
        cachedIpnId = ipnData.ipn_id;
        console.log(`[Pesapal Service] Successfully registered IPN ID: ${cachedIpnId}`);
        return cachedIpnId;
      }

      throw new Error(`Failed to register IPN URL. Response: ${JSON.stringify(ipnData)}`);
    });
  }

  /**
   * Submit Order Request
   * POST /api/Transactions/SubmitOrderRequest
   */
  async submitOrder(orderParams) {
    const {
      merchantRef,
      amount,
      description,
      callbackUrl,
      ipnId,
      phoneNumber,
      emailAddress
    } = orderParams;

    return retry(async () => {
      const token = await this.getAccessToken();
      const payload = {
        id: merchantRef,
        currency: 'UGX',
        amount: parseFloat(amount),
        description: description || 'Supermarket POS Sale',
        callback_url: callbackUrl,
        notification_id: ipnId,
        billing_address: {
          email_address: emailAddress || 'customer@supermarket.ug',
          phone_number: phoneNumber,
          country_code: 'UG',
          first_name: 'POS',
          last_name: 'Customer',
          line_1: '',
          line_2: '',
          city: '',
          state: '',
          postal_code: '',
          zip_code: ''
        }
      };

      console.log(`[Pesapal Service] Submitting order: ${merchantRef} for amount: ${amount} UGX`);
      console.log('[Pesapal Service] Request Payload:', JSON.stringify(payload, null, 2));
      console.log('[Pesapal Service] Endpoint:', `${this.baseUrl}/api/Transactions/SubmitOrderRequest`);

      try {
        const response = await axios.post(`${this.baseUrl}/api/Transactions/SubmitOrderRequest`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log('[Pesapal Service] Submit Response Status:', response.status);
        console.log('[Pesapal Service] Submit Response Data:', JSON.stringify(response.data, null, 2));

        const resData = response.data;
        
        // Check for error in response even with 200 status
        if (resData.error && resData.error.message) {
          throw new Error(`Pesapal error: ${resData.error.message} (${resData.error.code || 'unknown'})`);
        }

        if (resData && resData.order_tracking_id) {
          console.log('[Pesapal Service] Order submitted successfully!');
          return {
            orderTrackingId: resData.order_tracking_id,
            redirectUrl: resData.redirect_url,
            merchantReference: resData.merchant_reference
          };
        }

        throw new Error(`No order_tracking_id in response. Full response: ${JSON.stringify(response.data)}`);
      } catch (error) {
        if (error.response) {
          console.error('[Pesapal Service] SubmitOrder HTTP Error:');
          console.error('  Status:', error.response.status);
          console.error('  Status Text:', error.response.statusText);
          console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
          throw new Error(`Pesapal API returned ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        } else {
          console.error('[Pesapal Service] SubmitOrder Error:', error.message || 'Connection Timeout / Network Error');
          throw error;
        }
      }
    });
  }

  /**
   * Get Transaction Status
   * GET /api/Transactions/GetTransactionStatus
   */
  async getTransactionStatus(orderTrackingId) {
    return retry(async () => {
      const token = await this.getAccessToken();
      console.log(`[Pesapal Service] Checking transaction status for tracking ID: ${orderTrackingId}`);
      const response = await axios.get(
        `${this.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      const resData = response.data?.data || response.data;
      if (resData) {
        // Map status code or description to internal status
        // Pesapal returns payment status description/codes, e.g. "COMPLETED", "FAILED", "PENDING"
        let status = 'pending';
        const rawStatus = String(resData.payment_status_description || resData.status || '').toUpperCase();
        
        if (rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS') {
          status = 'paid';
        } else if (rawStatus === 'FAILED' || rawStatus === 'REJECTED' || rawStatus === 'INVALID') {
          status = 'failed';
        }

        return {
          pesapalOrderTrackingId: orderTrackingId,
          merchantReference: resData.merchant_reference,
          amount: resData.amount,
          currency: resData.currency,
          paymentMethod: resData.payment_method,
          status, // normalized: pending | paid | failed
          raw: resData
        };
      }

      throw new Error(`Failed to query transaction status for tracking ID ${orderTrackingId}`);
    });
  }
}

module.exports = new PesapalService();
