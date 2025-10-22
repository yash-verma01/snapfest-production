// Test Cart API from Frontend
import axios from 'axios';

const testCartAPI = async () => {
  console.log('🧪 Testing Cart API from Frontend...');
  
  // Test 1: Login to get token
  console.log('🔐 Step 1: Logging in...');
  try {
    const loginResponse = await axios.post('http://localhost:5001/api/users/login', {
      email: 'thor@gmail.com',
      password: 'Thor@1001'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // Test 2: Get cart with token
    console.log('🛒 Step 2: Fetching cart...');
    const cartResponse = await axios.get('http://localhost:5001/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Cart API response:', cartResponse.data);
    console.log('📊 Cart items count:', cartResponse.data.data.cartItems.length);
    console.log('💰 Total amount:', cartResponse.data.data.totalAmount);
    
    // Test 3: Check data structure
    console.log('🔍 Step 3: Analyzing data structure...');
    const cartItems = cartResponse.data.data.cartItems;
    if (cartItems.length > 0) {
      const firstItem = cartItems[0];
      console.log('📦 First item structure:');
      console.log('  - _id:', firstItem._id);
      console.log('  - packageId exists:', !!firstItem.packageId);
      console.log('  - packageId.title:', firstItem.packageId?.title);
      console.log('  - guests:', firstItem.guests);
      console.log('  - location:', firstItem.location);
    }
    
    return {
      success: true,
      token,
      cartData: cartResponse.data.data
    };
    
  } catch (error) {
    console.error('❌ Error testing cart API:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Run the test
testCartAPI().then(result => {
  console.log('🏁 Test completed:', result);
}).catch(error => {
  console.error('💥 Test failed:', error);
});


