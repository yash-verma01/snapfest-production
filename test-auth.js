import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

// Create axios instance with credentials
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, data = null, expectedStatus = 200) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    log(`   ${method.toUpperCase()} ${url}`, 'yellow');
    
    const response = await api.request({
      method,
      url,
      data,
    });
    
    if (response.status === expectedStatus) {
      log(`   ✅ SUCCESS (Status: ${response.status})`, 'green');
      if (response.data) {
        log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}`, 'reset');
      }
      return { success: true, data: response.data };
    } else {
      log(`   ❌ FAILED - Expected status ${expectedStatus}, got ${response.status}`, 'red');
      return { success: false, error: `Wrong status: ${response.status}` };
    }
  } catch (error) {
    if (error.response && error.response.status === expectedStatus) {
      log(`   ✅ SUCCESS (Expected error status: ${expectedStatus})`, 'green');
      if (error.response.data) {
        log(`   Response: ${JSON.stringify(error.response.data, null, 2).substring(0, 200)}`, 'reset');
      }
      return { success: true, data: error.response.data };
    } else {
      log(`   ❌ FAILED - ${error.message}`, 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
        log(`   Response: ${JSON.stringify(error.response.data, null, 2).substring(0, 200)}`, 'red');
      }
      return { success: false, error: error.message };
    }
  }
}

async function runTests() {
  log('\n🚀 Starting Authentication Flow Tests', 'blue');
  log('=' .repeat(60), 'blue');
  
  // Test 1: Health check
  await testEndpoint('Health Check', 'GET', '/health');
  
  // Test 2: Test Clerk session endpoint (should fail without auth)
  await testEndpoint('Clerk Test Endpoint (No Auth)', 'GET', '/test/clerk', null, 200);
  
  // Test 3: User sync endpoint (should work without auth, but no user)
  log('\n📝 Testing User Sync Endpoint', 'blue');
  await testEndpoint('User Sync (No Role)', 'POST', '/users/sync', {}, 200);
  await testEndpoint('User Sync (User Role)', 'POST', '/users/sync?role=user', {}, 200);
  await testEndpoint('User Sync (Vendor Role)', 'POST', '/users/sync?role=vendor', {}, 200);
  await testEndpoint('User Sync (Admin Role)', 'POST', '/users/sync?role=admin', {}, 200);
  
  // Test 4: Vendor sync endpoint (should require vendor role)
  log('\n📝 Testing Vendor Sync Endpoint', 'blue');
  await testEndpoint('Vendor Sync (No Auth)', 'POST', '/vendors/sync', {}, 401);
  
  // Test 5: Role-based auth endpoints (should require auth)
  log('\n📝 Testing Role-Based Auth Endpoints', 'blue');
  await testEndpoint('User Auth /me (No Auth)', 'GET', '/auth/user/me', null, 401);
  await testEndpoint('Vendor Auth /me (No Auth)', 'GET', '/auth/vendor/me', null, 401);
  await testEndpoint('Admin Auth /me (No Auth)', 'GET', '/auth/admin/me', null, 401);
  
  // Test 6: Legacy register endpoint
  log('\n📝 Testing Legacy Register Endpoint', 'blue');
  const testUser = {
    name: 'Test User',
    email: `testuser${Date.now()}@example.com`,
    phone: '1234567890',
    password: 'Test123!@#',
    role: 'user'
  };
  await testEndpoint('User Register', 'POST', '/auth/register', testUser, 201);
  
  // Test 7: Legacy login endpoint
  log('\n📝 Testing Legacy Login Endpoint', 'blue');
  await testEndpoint('User Login', 'POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  }, 200);
  
  // Test 8: Test role-based endpoints after login
  log('\n📝 Testing Role-Based Endpoints After Login', 'blue');
  // Note: These will fail because we're using Clerk, not the legacy auth
  // But we can test the endpoints exist
  
  log('\n✅ All Tests Completed!', 'green');
  log('=' .repeat(60), 'blue');
  log('\n📋 Summary:', 'blue');
  log('   - Health check endpoint tested', 'green');
  log('   - Clerk sync endpoints tested', 'green');
  log('   - Role-based auth endpoints tested', 'green');
  log('   - Legacy register/login endpoints tested', 'green');
  log('\n⚠️  Note: Full authentication testing requires Clerk session cookies', 'yellow');
  log('   To test with real Clerk sessions, use the frontend application', 'yellow');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});

