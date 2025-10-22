// Test Frontend Cart Loading
import axios from 'axios';

const testFrontendCart = async () => {
  console.log('🧪 Testing Frontend Cart Loading...');
  
  try {
    // Step 1: Login (simulate frontend login)
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:5001/api/users/login', {
      email: 'thor@gmail.com',
      password: 'Thor@1001'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // Step 2: Simulate frontend cart API call
    console.log('🛒 Step 2: Calling cart API like frontend...');
    const cartResponse = await axios.get('http://localhost:5001/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Cart API response:', cartResponse.data);
    
    // Step 3: Parse data like frontend does
    console.log('🔍 Step 3: Parsing data like frontend...');
    const dataNode = cartResponse.data.data;
    console.log('📊 Data node:', dataNode);
    console.log('📦 Cart items:', dataNode.cartItems);
    console.log('💰 Total amount:', dataNode.totalAmount);
    console.log('🔢 Item count:', dataNode.itemCount);
    
    // Step 4: Check if items have packageId
    console.log('🔍 Step 4: Checking package data...');
    dataNode.cartItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`);
      console.log('  - _id:', item._id);
      console.log('  - packageId exists:', !!item.packageId);
      console.log('  - packageId.title:', item.packageId?.title);
      console.log('  - guests:', item.guests);
      console.log('  - location:', item.location);
    });
    
    // Step 5: Simulate frontend cart state
    console.log('🔍 Step 5: Simulating frontend cart state...');
    const frontendCart = {
      items: dataNode.cartItems,
      totalAmount: dataNode.totalAmount,
      itemCount: dataNode.itemCount
    };
    
    console.log('📱 Frontend cart state:', frontendCart);
    console.log('📦 Items length:', frontendCart.items.length);
    console.log('💰 Total amount:', frontendCart.totalAmount);
    
    return {
      success: true,
      cartData: frontendCart,
      itemsCount: frontendCart.items.length
    };
    
  } catch (error) {
    console.error('❌ Frontend cart test failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Run the test
testFrontendCart().then(result => {
  console.log('🏁 Frontend cart test completed:', result);
}).catch(error => {
  console.error('💥 Frontend cart test failed:', error);
});


