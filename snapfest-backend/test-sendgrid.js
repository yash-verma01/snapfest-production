import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

// Load environment variables
dotenv.config();

console.log('📧 Testing SendGrid Email Service\n');

// Check if SendGrid API key is configured
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not found in .env file');
  console.error('Please add your SendGrid API key to .env file:');
  console.error('SENDGRID_API_KEY=your_sendgrid_api_key_here');
  process.exit(1);
}

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

console.log('📋 Configuration:');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '***' + process.env.SENDGRID_API_KEY.slice(-4) : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'noreply@snapfest.com');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('');

// Test SendGrid connection
async function testSendGridConnection() {
  try {
    console.log('🔌 Testing SendGrid connection...');
    
    // Test sending a simple email
    const msg = {
      to: process.env.EMAIL_USER || 'test@example.com',
      from: {
        email: process.env.EMAIL_FROM || 'noreply@snapfest.com',
        name: 'SnapFest'
      },
      subject: 'SendGrid Test - SUCCESS!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; font-size: 32px; margin: 0;">🎉 SendGrid Test Success!</h1>
            <p style="color: #666; font-size: 18px; margin: 10px 0;">Your SendGrid configuration is working correctly</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Test Details</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>Timestamp:</strong> ${new Date().toLocaleString()}<br>
              <strong>From:</strong> ${process.env.EMAIL_FROM || 'noreply@snapfest.com'}<br>
              <strong>Service:</strong> SendGrid
            </p>
            
            <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 15px; border-radius: 8px;">
              <p style="color: #2e7d32; margin: 0; font-weight: bold;">✅ SendGrid is working perfectly!</p>
              <p style="color: #2e7d32; margin: 5px 0 0 0;">Users will now receive emails in their inboxes</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} SnapFest. SendGrid Test Successful.</p>
          </div>
        </div>
      `
    };
    
    const result = await sgMail.send(msg);
    console.log('✅ SendGrid test email sent successfully!');
    console.log('Message ID:', result[0].headers['x-message-id']);
    console.log('Check your inbox for the test email!');
    
    return true;
    
  } catch (error) {
    console.error('❌ SendGrid test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Response:', error.response);
    
    if (error.code === 401) {
      console.error('\n🔧 Authentication Error - Your SendGrid API key is invalid');
      console.error('Please check your SENDGRID_API_KEY in .env file');
    } else if (error.code === 403) {
      console.error('\n🔧 Permission Error - Your SendGrid API key does not have permission to send emails');
      console.error('Please check your SendGrid account permissions');
    } else if (error.code === 400) {
      console.error('\n🔧 Bad Request - Check your email configuration');
      console.error('Please verify your EMAIL_FROM and other settings');
    }
    
    return false;
  }
}

// Test the complete flow
async function runSendGridTest() {
  console.log('🚀 Starting SendGrid Email Test...\n');
  
  const success = await testSendGridConnection();
  
  if (success) {
    console.log('\n🎉 SUCCESS! SendGrid is working perfectly!');
    console.log('✅ Users will now receive emails in their inboxes');
    console.log('✅ Email verification will work with real emails');
    console.log('✅ Password reset will work with real emails');
    console.log('✅ Welcome emails will be sent to users');
    console.log('\n📧 Next steps:');
    console.log('1. Update your email service to use SendGrid');
    console.log('2. Restart your backend server');
    console.log('3. Test email verification in your app');
  } else {
    console.log('\n❌ FAILED! SendGrid is not working');
    console.log('🔧 Next steps:');
    console.log('1. Check your SENDGRID_API_KEY in .env file');
    console.log('2. Verify your SendGrid account is active');
    console.log('3. Check your SendGrid account permissions');
    console.log('4. Run this test again');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test Summary:');
  console.log('SendGrid Authentication:', success ? '✅ Working' : '❌ Failed');
  console.log('Email Sending:', success ? '✅ Working' : '❌ Failed');
  console.log('User Experience:', success ? '✅ Real emails' : '❌ Console logs only');
}

// Run the test
runSendGridTest().catch(console.error);
