import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with test credentials
const razorpay = new Razorpay({
  key_id: 'rzp_test_RWpCivnUSkVbTS',
  key_secret: 'hlA0mfH2eHc3BNh1iSGYshtw'
});

console.log('💳 RazorpayService: Initialized with key_id:', 'rzp_test_RWpCivnUSkVbTS');
console.log('💳 RazorpayService: Key secret present:', true);

// Razorpay Service for Payment Gateway Integration
class RazorpayService {
  // Create payment order
  static async createOrder(amount, currency = 'INR', receipt = null) {
    try {
      console.log('💳 RazorpayService: Creating order');
      console.log('💳 RazorpayService: Amount:', amount);
      console.log('💳 RazorpayService: Currency:', currency);
      console.log('💳 RazorpayService: Receipt:', receipt);
      
      const options = {
        amount: amount * 100, // Convert to paise
        currency,
        receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`,
        payment_capture: 1
      };

      console.log('💳 RazorpayService: Order options:', options);

      const order = await razorpay.orders.create(options);
      console.log('💳 RazorpayService: Order created successfully:', order);
      
      return {
        success: true,
        order
      };
    } catch (error) {
      console.error('💳 RazorpayService: Order creation failed:', error);
      console.error('💳 RazorpayService: Error message:', error.message);
      console.error('💳 RazorpayService: Error details:', error);
      
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
        .createHmac('sha256', 'hlA0mfH2eHc3BNh1iSGYshtw')
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
        .createHmac('sha256', 'hlA0mfH2eHc3BNh1iSGYshtw')
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





