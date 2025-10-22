// Razorpay Configuration
// Replace these with your actual Razorpay keys from https://razorpay.com

export const RAZORPAY_CONFIG = {
  // ✅ SAFE: Only Key ID on frontend (public key)
  keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RWUolG3GI32kTt',
  
  // ❌ SECURITY: Secret key should NEVER be on frontend
  // keySecret: 'your_secret_key_here' // DON'T PUT SECRET HERE!
};

// Instructions for getting Razorpay keys:
export const RAZORPAY_SETUP_INSTRUCTIONS = `
1. Go to https://razorpay.com
2. Sign up for free account
3. Go to Dashboard → Settings → API Keys
4. Generate test keys
5. Replace the keys in this file:
   - keyId: Your test key ID
   - keySecret: Your test key secret
6. Restart your frontend server
`;

export default RAZORPAY_CONFIG;
