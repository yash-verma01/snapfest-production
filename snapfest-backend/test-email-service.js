import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Testing Email Service Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail');
console.log('');

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('🔧 Transporter Configuration:');
console.log('Service:', process.env.EMAIL_SERVICE || 'gmail');
console.log('Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
console.log('Port:', process.env.SMTP_PORT || 587);
console.log('Secure:', process.env.SMTP_SECURE === 'true' || false);
console.log('');

// Test connection
async function testEmailConnection() {
  try {
    console.log('🔌 Testing email connection...');
    await transporter.verify();
    console.log('✅ Email service connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Response:', error.response);
    return false;
  }
}

// Test sending email
async function testSendEmail() {
  try {
    console.log('📧 Testing email sending...');
    
    const mailOptions = {
      from: `"SnapFest Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'SnapFest Email Service Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; font-size: 32px; margin: 0;">🎉 SnapFest Email Test</h1>
            <p style="color: #666; font-size: 18px; margin: 10px 0;">Email service is working correctly!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Test Details</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>Timestamp:</strong> ${new Date().toLocaleString()}<br>
              <strong>From:</strong> ${process.env.EMAIL_USER}<br>
              <strong>Service:</strong> ${process.env.EMAIL_SERVICE || 'gmail'}
            </p>
            
            <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 15px; border-radius: 8px;">
              <p style="color: #2e7d32; margin: 0; font-weight: bold;">✅ Email service is working correctly!</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} SnapFest. Email Service Test.</p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Response:', error.response);
    return false;
  }
}

// Main test function
async function runEmailTests() {
  console.log('🚀 Starting Email Service Tests...\n');
  
  // Test 1: Connection
  const connectionSuccess = await testEmailConnection();
  
  if (connectionSuccess) {
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Send email
    const emailSuccess = await testSendEmail();
    
    if (emailSuccess) {
      console.log('\n🎉 All email tests passed! Your email service is working correctly.');
    } else {
      console.log('\n❌ Email sending failed. Check the error messages above.');
    }
  } else {
    console.log('\n❌ Email connection failed. Please check your configuration.');
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Verify your Gmail app password is correct');
    console.log('2. Ensure 2-Factor Authentication is enabled on Gmail');
    console.log('3. Check if "Less secure app access" is enabled');
    console.log('4. Verify your .env file is in the correct location');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Test Summary:');
  console.log('Connection:', connectionSuccess ? '✅ Success' : '❌ Failed');
  console.log('Email Sending:', connectionSuccess ? 'Tested' : 'Skipped');
}

// Run the tests
runEmailTests().catch(console.error);
