// Complete Cart Flow Test
import axios from 'axios';

const testCompleteCartFlow = async () => {
  console.log('🧪 Testing Complete Cart Flow...');
  
  try {
    // Step 1: Login (simulate frontend login)
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:5001/api/users/login', {
      email: 'thor@gmail.com',
      password: 'Thor@1001'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ Login successful');
    console.log('📱 Token:', token.substring(0, 20) + '...');
    console.log('👤 User:', user.email);
    
    // Step 2: Simulate localStorage (like frontend does)
    console.log('💾 Step 2: Simulating localStorage...');
    // In real frontend, this would be: localStorage.setItem('token', token)
    console.log('✅ Token would be stored in localStorage');
    
    // Step 3: Test cart API call (exactly like frontend)
    console.log('🛒 Step 3: Testing cart API call...');
    const cartResponse = await axios.get('http://localhost:5001/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Cart API successful');
    console.log('📊 Response:', cartResponse.data);
    
    // Step 4: Parse data like frontend useCart hook
    console.log('🔍 Step 4: Parsing data like frontend...');
    const dataNode = cartResponse.data.data;
    const cartItems = dataNode.cartItems;
    const totalAmount = dataNode.totalAmount;
    const itemCount = dataNode.itemCount;
    
    console.log('📦 Cart items count:', cartItems.length);
    console.log('💰 Total amount:', totalAmount);
    console.log('🔢 Item count:', itemCount);
    
    // Step 5: Check each cart item
    console.log('🔍 Step 5: Checking cart items...');
    cartItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`);
      console.log('  - _id:', item._id);
      console.log('  - packageId exists:', !!item.packageId);
      console.log('  - packageId.title:', item.packageId?.title);
      console.log('  - guests:', item.guests);
      console.log('  - location:', item.location);
      console.log('  - eventDate:', item.eventDate);
    });
    
    // Step 6: Simulate frontend cart state
    console.log('📱 Step 6: Simulating frontend cart state...');
    const frontendCart = {
      items: cartItems,
      totalAmount: totalAmount,
      itemCount: itemCount
    };
    
    console.log('✅ Frontend cart state created');
    console.log('📦 Items length:', frontendCart.items.length);
    console.log('💰 Total amount:', frontendCart.totalAmount);
    
    // Step 7: Check if items would render
    console.log('🎨 Step 7: Checking if items would render...');
    if (frontendCart.items.length > 0) {
      console.log('✅ Cart has items - should render on frontend');
      console.log('📋 Items that would render:');
      frontendCart.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.packageId?.title} (${item.guests} guests)`);
      });
    } else {
      console.log('❌ Cart is empty - would show "Your Cart is Empty"');
    }
    
    return {
      success: true,
      cartData: frontendCart,
      itemsCount: frontendCart.items.length,
      totalAmount: frontendCart.totalAmount
    };
    
  } catch (error) {
    console.error('❌ Complete cart flow test failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Run the test
testCompleteCartFlow().then(result => {
  console.log('🏁 Complete cart flow test completed:', result);
  
  if (result.success) {
    console.log('✅ SUCCESS: Cart flow is working correctly!');
    console.log(`📦 Found ${result.itemsCount} cart items`);
    console.log(`💰 Total amount: ₹${result.totalAmount}`);
    console.log('🎯 The issue must be in the frontend React app!');
  } else {
    console.log('❌ FAILED: Cart flow has issues');
    console.log('🔍 Error:', result.error);
  }
}).catch(error => {
  console.error('💥 Complete cart flow test crashed:', error);
});


