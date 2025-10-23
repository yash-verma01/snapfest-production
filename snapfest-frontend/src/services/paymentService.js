// Payment service functions
export const paymentService = {

  // Verify payment signature
  verifyPayment: (paymentData, signature) => {
    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', 'hlA0mfH2eHc3BNh1iSGYshtw');
      hmac.update(paymentData);
      const generatedSignature = hmac.digest('hex');
      
      return generatedSignature === signature;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  },

  // Open Razorpay checkout
  openCheckout: async (orderId, amount, currency, name, description, prefill = {}) => {
    // Load Razorpay script if not already loaded
    await loadRazorpayScript();
    
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject({
          success: false,
          error: 'Razorpay script failed to load'
        });
        return;
      }

      // Ensure minimum amount for UPI payments (₹50 minimum for better UPI support)
      const minAmount = Math.max(amount, 50);
      const amountInPaise = minAmount * 100;

      const options = {
        key: 'rzp_test_RWpCivnUSkVbTS',
        amount: amountInPaise,
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
        // Enable all payment methods including UPI
        notes: {
          source: 'snapfest_web'
        },
        // Additional options for better UPI support
        retry: {
          enabled: true,
          max_count: 3
        },
        handler: function (response) {
          resolve({
            success: true,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
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
