import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with test credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RWUolG3GI32kTt',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'irmrpkk9MKojXKUlA0OT8FCp'
});

// Razorpay Service for Payment Gateway Integration
class RazorpayService {
  // Create payment order
  static async createOrder(amount, currency = 'INR', receipt = null) {
    try {
      const options = {
        amount: amount * 100, // Convert to paise
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        payment_capture: 1
      };

      const order = await razorpay.orders.create(options);
      return {
        success: true,
        order
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment signature
  static verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'irmrpkk9MKojXKUlA0OT8FCp')
        .update(body.toString())
        .digest('hex');

      const isValid = expectedSignature === signature;
      return {
        success: isValid,
        message: isValid ? 'Payment verified successfully' : 'Invalid payment signature'
      };
    } catch (error) {
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
      const payment = await razorpay.payments.capture(paymentId, amount * 100);
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
      const payment = await razorpay.payments.fetch(paymentId);
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
      const refund = await razorpay.payments.refund(paymentId, {
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
      const refund = await razorpay.payments.fetchRefund(refundId);
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
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'irmrpkk9MKojXKUlA0OT8FCp')
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      return false;
    }
  }

  // Generate payment link
  static async createPaymentLink(amount, description, customer = {}) {
    try {
      const paymentLink = await razorpay.paymentLink.create({
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
      const paymentLink = await razorpay.paymentLink.fetch(linkId);
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





