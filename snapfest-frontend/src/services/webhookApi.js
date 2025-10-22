import api from './api';

export const webhookAPI = {
  // Razorpay webhook handling
  handleRazorpayWebhook: (data) => {
    return api.post('/webhooks/razorpay', data);
  }
};

export default webhookAPI;





