import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:5001/api';

async function testUserLogin() {
  console.log('🧪 Testing User Login Endpoints\n');
  
  // Test data
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!'
  };
  
  try {
    // Test 1: Test auth/login endpoint
    console.log('🔍 Test 1: Testing /api/auth/login endpoint...');
    try {
      const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
      console.log('✅ /api/auth/login - SUCCESS');
      console.log('Response:', authResponse.data);
    } catch (error) {
      console.log('❌ /api/auth/login - FAILED');
      console.log('Error:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Test users/login endpoint
    console.log('🔍 Test 2: Testing /api/users/login endpoint...');
    try {
      const userResponse = await axios.post(`${API_BASE_URL}/users/login`, testUser);
      console.log('✅ /api/users/login - SUCCESS');
      console.log('Response:', userResponse.data);
    } catch (error) {
      console.log('❌ /api/users/login - FAILED');
      console.log('Error:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Test server health
    console.log('🔍 Test 3: Testing server health...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Server is running');
      console.log('Response:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed');
      console.log('Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserLogin();
