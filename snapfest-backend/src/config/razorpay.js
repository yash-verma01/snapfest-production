// Razorpay Configuration for Backend
// SECURITY: All secrets must be in environment variables, never hardcoded!

// Get Razorpay credentials from environment variables
const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID_TEST,
  keySecret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET_TEST,
  
  // Instructions for getting Razorpay keys:
  setupInstructions: `
1. Go to https://razorpay.com
2. Sign up for free account
3. Go to Dashboard → Settings → API Keys
4. Generate test keys
5. Create .env file in backend root with:
   RAZORPAY_KEY_ID=your_test_key_id
   RAZORPAY_KEY_SECRET=your_test_key_secret
6. Restart your backend server
  `
};

// Security Note: 
// - Key ID can be public (frontend)
// - Key Secret MUST be private (backend only)
// - Never put secret in frontend code
// - Use environment variables for production
// - Never commit .env file to version control

export default razorpayConfig;


