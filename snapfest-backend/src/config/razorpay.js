// Razorpay Configuration for Backend
// This file contains the SECRET key - NEVER commit to version control!

const razorpayConfig = {
  keyId: 'rzp_test_RWpCivnUSkVbTS',
  keySecret: 'hlA0mfH2eHc3BNh1iSGYshtw',
  
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

export default razorpayConfig;


