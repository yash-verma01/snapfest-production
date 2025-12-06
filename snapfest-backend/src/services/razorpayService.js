import Razorpay from 'razorpay';
import crypto from 'crypto';
import { logInfo, logError, logDebug } from '../config/logger.js';

// Lazy initialization - only create Razorpay instance when needed
// This allows server to start even if Razorpay credentials are missing
let razorpay = null;

// Get Razorpay credentials from environment variables (lazy evaluation)
// This function reads env vars at call time, not module load time
const getRazorpayCredentials = () => {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID_TEST,
    keySecret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET_TEST
  };
};

const getRazorpayInstance = () => {
  if (!razorpay) {
    // Read credentials at function call time (after .env is loaded)
    const credentials = getRazorpayCredentials();
    
    if (!credentials.keyId || !credentials.keySecret) {
      logError('Razorpay credentials not found in environment variables', {
        keyIdPresent: !!credentials.keyId,
        keySecretPresent: !!credentials.keySecret,
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('RAZORPAY')),
        nodeEnv: process.env.NODE_ENV
      });
      throw new Error('Razorpay credentials are required. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file');
    }

    // Initialize Razorpay with environment variables
    razorpay = new Razorpay({
      key_id: credentials.keyId,
      key_secret: credentials.keySecret
    });

    // Log initialization (without exposing secrets)
    if (process.env.NODE_ENV === 'development') {
      logInfo('RazorpayService initialized', {
        keyId: credentials.keyId.substring(0, 8) + '...',
        keySecretPresent: !!credentials.keySecret
      });
    }
  }
  return razorpay;
};

// Razorpay Service for Payment Gateway Integration
class RazorpayService {
  // Create payment order
  static async createOrder(amount, currency = 'INR', receipt = null) {
    try {
      const rzp = getRazorpayInstance();
      
      // Log only in development mode and without sensitive data
      if (process.env.NODE_ENV === 'development') {
        logDebug('Creating Razorpay order', {
          amount,
          currency,
          receipt: receipt ? receipt.substring(0, 8) + '...' : 'auto-generated'
        });
      }
      
      const options = {
        amount: amount * 100, // Convert to paise
        currency,
        receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`,
        payment_capture: 1
      };

      const order = await rzp.orders.create(options);
      
      if (process.env.NODE_ENV === 'development') {
        logInfo('Razorpay order created successfully', {
          orderId: order.id,
          amount: order.amount
        });
      }
      
      return {
        success: true,
        order
      };
    } catch (error) {
      logError('Razorpay order creation failed', {
        error: error.message,
        amount,
        currency
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment signature
  static verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      // Read credentials at function call time (after .env is loaded)
      const credentials = getRazorpayCredentials();
      
      if (!credentials.keySecret) {
        logError('Razorpay key secret not available for signature verification');
        return {
          success: false,
          message: 'Payment verification service unavailable'
        };
      }

      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', credentials.keySecret)
        .update(body.toString())
        .digest('hex');

      const isValid = expectedSignature === signature;
      
      if (process.env.NODE_ENV === 'development') {
        logDebug('Payment signature verification', {
          isValid,
          orderId: orderId.substring(0, 8) + '...'
        });
      }
      
      return {
        success: isValid,
        message: isValid ? 'Payment verified successfully' : 'Invalid payment signature'
      };
    } catch (error) {
      logError('Error verifying payment signature', { error: error.message });
      return {
        success: false,
        message: 'Error verifying payment signature',
        error: error.message
      };
    }
  }

  // Capture payment
  static async capturePayment(paymentId, amount) {
    try {
      const rzp = getRazorpayInstance();
      const payment = await rzp.payments.capture(paymentId, amount * 100);
      return {
        success: true,
        payment
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment details
  static async getPaymentDetails(paymentId) {
    try {
      const rzp = getRazorpayInstance();
      const payment = await rzp.payments.fetch(paymentId);
      return {
        success: true,
        payment
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process refund
  static async processRefund(paymentId, amount, notes = '') {
    try {
      const rzp = getRazorpayInstance();
      const refund = await rzp.payments.refund(paymentId, {
        amount: amount * 100, // Convert to paise
        notes: {
          reason: notes
        }
      });
      return {
        success: true,
        refund
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get refund details
  static async getRefundDetails(refundId) {
    try {
      const rzp = getRazorpayInstance();
      const refund = await rzp.payments.fetchRefund(refundId);
      return {
        success: true,
        refund
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify webhook signature
  static verifyWebhookSignature(body, signature) {
    try {
      // Read credentials at function call time (after .env is loaded)
      const credentials = getRazorpayCredentials();
      
      if (!credentials.keySecret) {
        logError('Razorpay key secret not available for webhook verification');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', credentials.keySecret)
        .update(body)
        .digest('hex');

      const isValid = expectedSignature === signature;
      
      if (process.env.NODE_ENV === 'development') {
        logDebug('Webhook signature verification', { isValid });
      }
      
      return isValid;
    } catch (error) {
      logError('Error verifying webhook signature', { error: error.message });
      return false;
    }
  }

  // Generate payment link
  static async createPaymentLink(amount, description, customer = {}) {
    try {
      const rzp = getRazorpayInstance();
      const paymentLink = await rzp.paymentLink.create({
        amount: amount * 100,
        currency: 'INR',
        description,
        customer: {
          name: customer.name || 'Customer',
          email: customer.email || 'customer@example.com',
          contact: customer.phone || '9999999999'
        },
        notify: {
          sms: true,
          email: true
        },
        reminder_enable: true,
        callback_url: process.env.FRONTEND_URL + '/payment/callback',
        callback_method: 'get'
      });

      return {
        success: true,
        paymentLink
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment link details
  static async getPaymentLinkDetails(linkId) {
    try {
      const rzp = getRazorpayInstance();
      const paymentLink = await rzp.paymentLink.fetch(linkId);
      return {
        success: true,
        paymentLink
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default RazorpayService;





