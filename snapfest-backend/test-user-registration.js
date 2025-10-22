import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:5001/api';

async function testUserRegistration() {
  console.log('🧪 Testing User Registration and Login\n');
  
  // Test user data
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '9876543210',
    password: 'Test123!'
  };
  
  try {
    // Test 1: Register a new user
    console.log('🔍 Test 1: Registering new user...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
      console.log('✅ User registration - SUCCESS');
      console.log('Response:', registerResponse.data);
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('⚠️ User already exists - This is expected');
      } else {
        console.log('❌ User registration - FAILED');
        console.log('Error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Login with the user
    console.log('🔍 Test 2: Testing user login...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('✅ User login - SUCCESS');
      console.log('Response:', loginResponse.data);
      
      // Test 3: Test protected route
      console.log('\n🔍 Test 3: Testing protected route...');
      const token = loginResponse.data.data.token;
      try {
        const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Protected route - SUCCESS');
        console.log('Response:', meResponse.data);
      } catch (error) {
        console.log('❌ Protected route - FAILED');
        console.log('Error:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('❌ User login - FAILED');
      console.log('Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserRegistration();
