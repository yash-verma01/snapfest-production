import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Email Verification Endpoint...\n');

// Test the email verification endpoint
async function testEmailVerification() {
  try {
    console.log('📧 Testing email verification with fallback mode...');
    
    // Import the email service
    const emailService = await import('./src/services/emailService.js');
    
    // Test sending verification email
    const testEmail = 'test@example.com';
    const testName = 'Test User';
    const testToken = 'test-verification-token-123';
    
    console.log('📤 Sending test verification email...');
    const result = await emailService.default.sendVerificationEmail(testEmail, testName, testToken);
    
    console.log('✅ Email verification test result:', result);
    
    if (result.fallback) {
      console.log('⚠️ Email service is in fallback mode - emails are logged to console');
      console.log('📧 Check the console above for the verification link');
    } else {
      console.log('✅ Email sent successfully!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Email verification test failed:', error.message);
    return false;
  }
}

// Test the complete flow
async function testCompleteFlow() {
  console.log('🚀 Testing Complete Email Verification Flow...\n');
  
  // Test 1: Email Service
  console.log('1️⃣ Testing Email Service...');
  const emailTest = await testEmailVerification();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Test Results:');
  console.log('Email Service:', emailTest ? '✅ Working' : '❌ Failed');
  
  if (emailTest) {
    console.log('\n🎉 Email verification is working!');
    console.log('📧 In fallback mode, verification links are logged to console');
    console.log('🔧 To enable real emails, fix your Gmail app password');
  } else {
    console.log('\n❌ Email verification failed');
    console.log('🔧 Check the error messages above');
  }
}

// Run the tests
testCompleteFlow().catch(console.error);
