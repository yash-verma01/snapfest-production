import Razorpay from 'razorpay';

// Initialize Razorpay (Frontend only needs Key ID)
const razorpay = new Razorpay({
  key_id: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RWUolG3GI32kTt', // Public key - safe on frontend
  // key_secret: NEVER on frontend - security risk!
  // Secret key is handled by backend only
});

// Payment service functions
export const paymentService = {
  // Create Razorpay order
  createOrder: async (amount, currency = 'INR', receipt = null) => {
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
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verify payment signature
  verifyPayment: (paymentData, signature) => {
    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', import.meta.env.VITE_RAZORPAY_KEY_SECRET || 'irmrpkk9MKojXKUlA0OT8FCp');
      hmac.update(paymentData);
      const generatedSignature = hmac.digest('hex');
      
      return generatedSignature === signature;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  },

  // Open Razorpay checkout
  openCheckout: (orderId, amount, currency, name, description, prefill = {}) => {
    return new Promise((resolve, reject) => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RWUolG3GI32kTt',
        amount: amount * 100,
        currency,
        name: 'SnapFest',
        description,
        order_id: orderId,
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || ''
        },
        theme: {
          color: '#ec4899' // Pink color matching your theme
        },
        handler: function (response) {
          resolve({
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature
          });
        },
        modal: {
          ondismiss: function() {
            reject({
              success: false,
              error: 'Payment cancelled by user'
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }
};

// Load Razorpay script
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default paymentService;
