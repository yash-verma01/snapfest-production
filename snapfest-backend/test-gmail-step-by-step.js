import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔐 Gmail Authentication Step-by-Step Test\n');

// Check current credentials
console.log('📋 Current Configuration:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
console.log('');

// Test different Gmail configurations
async function testGmailConfigs() {
  const configs = [
    {
      name: 'Current Configuration',
      config: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      }
    },
    {
      name: 'Gmail with TLS',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'Gmail with SSL',
      config: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`🧪 Testing ${name}...`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      await transporter.verify();
      console.log(`✅ ${name} - SUCCESS!`);
      
      // If successful, test sending an email
      console.log('📧 Testing email sending...');
      const result = await transporter.sendMail({
        from: `"SnapFest Test" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Send to yourself
        subject: 'SnapFest Gmail Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e91e63;">🎉 Gmail Authentication Success!</h1>
            <p>Your Gmail configuration is working correctly.</p>
            <p><strong>Configuration:</strong> ${name}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `
      });
      
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Check your inbox for the test email!');
      return true;
      
    } catch (error) {
      console.log(`❌ ${name} - FAILED`);
      console.log('Error:', error.message);
      console.log('Code:', error.code);
      console.log('');
    }
  }
  
  return false;
}

// Main test function
async function runGmailTest() {
  console.log('🚀 Starting Gmail Authentication Test...\n');
  
  const success = await testGmailConfigs();
  
  if (success) {
    console.log('\n🎉 Gmail authentication is working!');
    console.log('✅ Users will now receive emails in their inboxes');
    console.log('✅ Email verification will work with real emails');
    console.log('✅ Password reset will work with real emails');
  } else {
    console.log('\n❌ Gmail authentication failed');
    console.log('🔧 Next steps:');
    console.log('1. Enable 2-Factor Authentication on Gmail');
    console.log('2. Generate a new App Password for "Mail"');
    console.log('3. Update your .env file with the new password');
    console.log('4. Run this test again');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test Summary:');
  console.log('Gmail Authentication:', success ? '✅ Working' : '❌ Failed');
  console.log('Email Sending:', success ? '✅ Working' : '❌ Failed');
  console.log('User Experience:', success ? '✅ Real emails' : '❌ Console logs only');
}

// Run the test
runGmailTest().catch(console.error);
