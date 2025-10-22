// Test Razorpay Configuration
// Run this after adding your Razorpay credentials to .env file

import RazorpayService from './src/services/razorpayService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔐 Testing Razorpay Configuration...\n');

// Check if environment variables are loaded
console.log('📋 Environment Variables:');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing');
console.log('');

// Test Razorpay service
async function testRazorpayService() {
  try {
    console.log('🧪 Testing Razorpay Service...');
    
    // Test creating an order (small amount for testing)
    const orderResult = await RazorpayService.createOrder(1, 'INR', 'test_receipt');
    
    if (orderResult.success) {
      console.log('✅ Razorpay Order Creation: SUCCESS');
      console.log('Order ID:', orderResult.order.id);
    } else {
      console.log('❌ Razorpay Order Creation: FAILED');
      console.log('Error:', orderResult.error);
    }
    
  } catch (error) {
    console.log('❌ Razorpay Service Test: FAILED');
    console.log('Error:', error.message);
  }
}

// Run the test
testRazorpayService().then(() => {
  console.log('\n🎉 Razorpay configuration test completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. If test failed, check your .env file');
  console.log('2. Make sure you have valid Razorpay keys');
  console.log('3. Restart your backend server');
  console.log('4. Test payment flow in frontend');
}).catch(console.error);


