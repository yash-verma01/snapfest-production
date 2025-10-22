// Test Authentication Flow
import axios from 'axios';

const testAuthFlow = async () => {
  console.log('🔐 Testing Authentication Flow...');
  
  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:5001/api/users/login', {
      email: 'thor@gmail.com',
      password: 'Thor@1001'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // Step 2: Test cart API with token
    console.log('🛒 Step 2: Testing cart API...');
    const cartResponse = await axios.get('http://localhost:5001/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Cart API successful');
    console.log('📊 Cart data:', cartResponse.data.data);
    console.log('📦 Cart items count:', cartResponse.data.data.cartItems.length);
    
    // Step 3: Test without token (should fail)
    console.log('❌ Step 3: Testing cart API without token (should fail)...');
    try {
      await axios.get('http://localhost:5001/api/cart');
      console.log('❌ This should have failed!');
    } catch (error) {
      console.log('✅ Correctly failed without token:', error.response?.status);
    }
    
    return {
      success: true,
      token,
      cartData: cartResponse.data.data
    };
    
  } catch (error) {
    console.error('❌ Authentication flow failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Run the test
testAuthFlow().then(result => {
  console.log('🏁 Auth flow test completed:', result);
}).catch(error => {
  console.error('💥 Auth flow test failed:', error);
});


