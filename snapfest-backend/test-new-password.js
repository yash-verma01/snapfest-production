import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔐 Testing New Gmail App Password\n');

// Check current credentials
console.log('📋 Current Configuration:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
console.log('');

// Test Gmail connection
async function testGmailConnection() {
  try {
    console.log('🧪 Testing Gmail connection...');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Test connection
    await transporter.verify();
    console.log('✅ Gmail connection successful!');
    
    // Test sending email
    console.log('📧 Testing email sending...');
    const result = await transporter.sendMail({
      from: `"SnapFest Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'SnapFest Gmail Test - SUCCESS!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; font-size: 32px; margin: 0;">🎉 Gmail Authentication Success!</h1>
            <p style="color: #666; font-size: 18px; margin: 10px 0;">Your Gmail configuration is working correctly</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Test Details</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>Timestamp:</strong> ${new Date().toLocaleString()}<br>
              <strong>From:</strong> ${process.env.EMAIL_USER}<br>
              <strong>Status:</strong> ✅ Working
            </p>
            
            <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 15px; border-radius: 8px;">
              <p style="color: #2e7d32; margin: 0; font-weight: bold;">✅ Gmail authentication is working!</p>
              <p style="color: #2e7d32; margin: 5px 0 0 0;">Users will now receive emails in their inboxes</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} SnapFest. Gmail Test Successful.</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Check your inbox for the test email!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Gmail connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔧 Authentication Error - Your app password is still not working');
      console.error('Please generate a new Gmail app password:');
      console.error('1. Go to https://myaccount.google.com/security');
      console.error('2. Enable 2-Factor Authentication');
      console.error('3. Generate new App Password for "Mail"');
      console.error('4. Update your .env file with the new password');
    }
    
    return false;
  }
}

// Main test function
async function runTest() {
  console.log('🚀 Starting Gmail Password Test...\n');
  
  const success = await testGmailConnection();
  
  if (success) {
    console.log('\n🎉 SUCCESS! Your Gmail app password is working!');
    console.log('✅ Users will now receive emails in their inboxes');
    console.log('✅ Email verification will work with real emails');
    console.log('✅ Password reset will work with real emails');
    console.log('✅ Welcome emails will be sent to users');
  } else {
    console.log('\n❌ FAILED! Your Gmail app password is still not working');
    console.log('🔧 Next steps:');
    console.log('1. Go to https://myaccount.google.com/security');
    console.log('2. Enable 2-Factor Authentication');
    console.log('3. Generate new App Password for "Mail"');
    console.log('4. Update your .env file with the new password');
    console.log('5. Run this test again');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test Summary:');
  console.log('Gmail Authentication:', success ? '✅ Working' : '❌ Failed');
  console.log('Email Sending:', success ? '✅ Working' : '❌ Failed');
  console.log('User Experience:', success ? '✅ Real emails' : '❌ Console logs only');
}

// Run the test
runTest().catch(console.error);
