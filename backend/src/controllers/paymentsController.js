const pesapalService = require('../services/pesapalService');
const { PesapalTransaction } = require('../models');

/**
 * Helper to determine protocol + host dynamically for callback registration
 * Note: For local development, callbacks won't work. Use polling mode instead.
 */
function getCallbackUrl(req) {
  // Check if polling mode is enabled (no webhook needed)
  if (process.env.PESAPAL_MODE === 'polling') {
    console.log(`[Payments Controller] Polling mode enabled - webhook not required`);
    return 'https://yoursite.com/webhook'; // Dummy URL for Pesapal (required field)
  }

  // Check if custom webhook URL is set in environment
  const customWebhookUrl = process.env.PESAPAL_WEBHOOK_URL;
  if (customWebhookUrl) {
    console.log(`[Payments Controller] Using custom webhook URL from env: ${customWebhookUrl}`);
    return customWebhookUrl;
  }

  // Auto-detect from request
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const protocol = isHttps ? 'https' : 'http';
  const host = req.get('host');
  
  // Replace localhost with network IP if detected
  let finalHost = host;
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    // Try to get network IP from environment or use a sensible default
    const networkIp = process.env.NETWORK_IP || '172.20.10.4';
    const port = process.env.PORT || '3000';
    finalHost = `${networkIp}:${port}`;
    console.log(`[Payments Controller] Replaced localhost with network IP: ${finalHost}`);
  }
  
  return `${protocol}://${finalHost}/api/v1/payments/webhook`;
}

/**
 * 1. Initiate Payment Request (from POS)
 * POST /api/v1/payments/initiate
 */
exports.initiatePayment = async (req, res, next) => {
  try {
    const { amount, phone_number, email_address, description } = req.body;

    if (!amount || !phone_number) {
      return res.status(400).json({
        success: false,
        error: 'Amount and phone number are required fields'
      });
    }

    // Generate a unique local merchant reference
    const merchantReference = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Save pending attempt in local database
    const localTx = await PesapalTransaction.create({
      merchant_reference: merchantReference,
      amount: parseFloat(amount),
      currency: 'UGX',
      status: 'pending',
      phone_number,
      metadata: { description }
    });

    // 2. Resolve callback URL dynamically and get IPN notification ID
    const callbackUrl = getCallbackUrl(req);
    console.log(`[Payments Controller] Resolved callback URL for IPN: ${callbackUrl}`);
    const ipnId = await pesapalService.getIPNId(callbackUrl);

    // 3. Submit Order to Pesapal
    const orderParams = {
      merchantRef: merchantReference,
      amount: parseFloat(amount),
      description: description || `POS Transaction ${merchantReference}`,
      callbackUrl,
      ipnId,
      phoneNumber: phone_number,
      emailAddress: email_address
    };

    const result = await pesapalService.submitOrder(orderParams);

    // 4. Update transaction with the returned order_tracking_id
    await localTx.update({
      pesapal_order_tracking_id: result.orderTrackingId,
      metadata: {
        ...localTx.metadata,
        redirectUrl: result.redirectUrl
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Payment request initiated successfully',
      data: {
        merchantReference,
        orderTrackingId: result.orderTrackingId,
        redirectUrl: result.redirectUrl,
        amount
      }
    });
  } catch (error) {
    console.error('[Payments Controller] Initiate Payment Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate payment with Pesapal',
      message: error.message
    });
  }
};

/**
 * 2. Webhook / Instant Payment Notification (IPN) Listener
 * GET / POST /api/v1/payments/webhook
 */
exports.webhookHandler = async (req, res, next) => {
  try {
    // Pesapal sends variables via query parameters or body depending on event
    const orderTrackingId = req.query.OrderTrackingId || req.body.OrderTrackingId;
    const merchantReference = req.query.OrderMerchantReference || req.body.OrderMerchantReference;
    const notificationType = req.query.OrderNotificationType || req.body.OrderNotificationType;

    console.log(`[Payments Controller Webhook] Received IPN. TrackingID: ${orderTrackingId}, Ref: ${merchantReference}, Type: ${notificationType}`);

    if (!orderTrackingId) {
      return res.status(400).json({ success: false, error: 'Missing OrderTrackingId in request' });
    }

    // 1. Query the actual status from Pesapal API directly (Ensures validity/security)
    const verification = await pesapalService.getTransactionStatus(orderTrackingId);
    console.log(`[Payments Controller Webhook] Verification status: ${verification.status} for Ref: ${verification.merchantReference}`);

    // 2. Fetch the local transaction attempt
    const localTx = await PesapalTransaction.findOne({
      where: { merchant_reference: verification.merchantReference }
    });

    if (!localTx) {
      console.warn(`[Payments Controller Webhook] Local transaction reference not found: ${verification.merchantReference}`);
      return res.status(404).json({ success: false, error: 'Transaction reference not found' });
    }

    // 3. Update DB if status changed
    if (localTx.status !== verification.status) {
      await localTx.update({
        status: verification.status,
        metadata: {
          ...localTx.metadata,
          verificationRaw: verification.raw,
          paymentMethod: verification.paymentMethod
        }
      });

      console.log(`[Payments Controller Webhook] Status updated: ${localTx.status}`);

      // 4. Broadcast the update to Socket.IO clients in the 'pos' room
      const io = req.app.get('io');
      if (io) {
        console.log(`[Payments Controller Webhook] Broadcasting payment status to room 'pos'...`);
        io.to('pos').emit('payment_status_update', {
          merchantReference: verification.merchantReference,
          pesapalOrderTrackingId: orderTrackingId,
          status: verification.status,
          paymentMethod: verification.paymentMethod
        });
      }
    }

    // Pesapal response expectation: return status indicating success
    return res.status(200).json({
      response: 'OK',
      status: '200',
      message: 'Notification received successfully'
    });
  } catch (error) {
    console.error('[Payments Controller Webhook] Error processing callback:', error);
    return res.status(500).json({
      success: false,
      error: 'Error processing webhook payment notification',
      message: error.message
    });
  }
};

/**
 * 3. Polling Fallback Status Endpoint
 * GET /api/v1/payments/status/:reference
 * 
 * Primary method for local development (polling mode)
 * Also serves as fallback when webhooks are delayed
 */
exports.pollPaymentStatus = async (req, res, next) => {
  try {
    const { reference } = req.params;

    console.log(`[Payments Controller Polling] Checking status for reference: ${reference}`);

    const localTx = await PesapalTransaction.findOne({
      where: { merchant_reference: reference }
    });

    if (!localTx) {
      return res.status(404).json({
        success: false,
        error: `Transaction with reference ${reference} not found`
      });
    }

    // If already finalized (paid or failed), return cached status immediately
    if (localTx.status === 'paid' || localTx.status === 'failed') {
      console.log(`[Payments Controller Polling] Returning cached status: ${localTx.status}`);
      return res.status(200).json({
        success: true,
        data: {
          merchantReference: localTx.merchant_reference,
          orderTrackingId: localTx.pesapal_order_tracking_id,
          status: localTx.status,
          amount: localTx.amount,
          currency: localTx.currency,
          paymentMethod: localTx.metadata?.paymentMethod || null,
          updatedAt: localTx.updated_at
        }
      });
    }

    // If still pending, check live status from Pesapal
    if (localTx.pesapal_order_tracking_id) {
      try {
        console.log(`[Payments Controller Polling] Querying Pesapal for tracking ID: ${localTx.pesapal_order_tracking_id}`);
        const verification = await pesapalService.getTransactionStatus(localTx.pesapal_order_tracking_id);
        
        console.log(`[Payments Controller Polling] Pesapal returned status: ${verification.status}`);

        // Update local status if changed
        if (verification.status !== localTx.status) {
          await localTx.update({
            status: verification.status,
            metadata: {
              ...localTx.metadata,
              verificationRaw: verification.raw,
              paymentMethod: verification.paymentMethod,
              lastPolled: new Date().toISOString()
            }
          });

          console.log(`[Payments Controller Polling] Updated local status to: ${verification.status}`);

          // Broadcast state to Socket.IO clients (optional - for multi-terminal sync)
          const io = req.app.get('io');
          if (io) {
            io.to('pos').emit('payment_status_update', {
              merchantReference: localTx.merchant_reference,
              pesapalOrderTrackingId: localTx.pesapal_order_tracking_id,
              status: verification.status,
              paymentMethod: verification.paymentMethod
            });
          }

          // Return updated status
          return res.status(200).json({
            success: true,
            data: {
              merchantReference: localTx.merchant_reference,
              orderTrackingId: localTx.pesapal_order_tracking_id,
              status: verification.status,
              amount: localTx.amount,
              currency: localTx.currency,
              paymentMethod: verification.paymentMethod,
              updatedAt: new Date()
            }
          });
        }

        // Status unchanged, return current state
        return res.status(200).json({
          success: true,
          data: {
            merchantReference: localTx.merchant_reference,
            orderTrackingId: localTx.pesapal_order_tracking_id,
            status: localTx.status,
            amount: localTx.amount,
            currency: localTx.currency,
            paymentMethod: verification.paymentMethod || null,
            updatedAt: localTx.updated_at
          }
        });

      } catch (checkErr) {
        console.error(`[Payments Controller Polling] Pesapal status check failed: ${checkErr.message}`);
        
        // Return current local status with error note
        return res.status(200).json({
          success: true,
          data: {
            merchantReference: localTx.merchant_reference,
            orderTrackingId: localTx.pesapal_order_tracking_id,
            status: localTx.status,
            amount: localTx.amount,
            currency: localTx.currency,
            error: 'Failed to query Pesapal - returning cached status'
          }
        });
      }
    }

    // No tracking ID yet (shouldn't happen, but handle gracefully)
    return res.status(200).json({
      success: true,
      data: {
        merchantReference: localTx.merchant_reference,
        orderTrackingId: null,
        status: 'pending',
        amount: localTx.amount,
        currency: localTx.currency
      }
    });

  } catch (error) {
    console.error('[Payments Controller Polling] Status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to poll payment status',
      message: error.message
    });
  }
};
