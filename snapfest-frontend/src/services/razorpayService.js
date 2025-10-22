// Razorpay payment integration service
class RazorpayService {
  constructor() {
    this.razorpay = null;
    this.isLoaded = false;
  }

  // Load Razorpay script
  loadScript() {
    return new Promise((resolve, reject) => {
      if (this.isLoaded) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.isLoaded = true;
        this.razorpay = window.Razorpay;
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // Create Razorpay order
  async createOrder(orderData) {
    try {
      await this.loadScript();
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1234567890',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: orderData.name || 'SnapFest',
        description: orderData.description || 'Photography Service Payment',
        order_id: orderData.razorpay_order_id,
        handler: orderData.handler,
        prefill: {
          name: orderData.customer_name,
          email: orderData.customer_email,
          contact: orderData.customer_phone,
        },
        notes: orderData.notes || {},
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: orderData.onDismiss || (() => {}),
        },
      };

      const razorpay = new this.razorpay(options);
      razorpay.open();
      
      return razorpay;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  // Verify payment signature
  verifyPayment(paymentData, signature) {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', import.meta.env.VITE_RAZORPAY_KEY_SECRET || 'dummy_secret')
        .update(paymentData)
        .digest('hex');
      
      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  // Format amount for Razorpay (amount in paise)
  formatAmount(amount) {
    return Math.round(amount * 100);
  }

  // Format amount from Razorpay (amount in rupees)
  formatAmountFromRazorpay(amount) {
    return amount / 100;
  }
}

export default new RazorpayService();



