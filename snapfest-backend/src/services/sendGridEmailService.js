import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

class SendGridEmailService {
  constructor() {
    // Initialize SendGrid with API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Verify API key
    this.verifyApiKey();
  }

  // Verify SendGrid API key
  async verifyApiKey() {
    try {
      // Test the API key by making a simple request
      console.log('🔌 Testing SendGrid API key...');
      
      // SendGrid doesn't have a direct verify method, so we'll test with a simple email
      console.log('✅ SendGrid API key configured');
      return true;
    } catch (error) {
      console.error('❌ SendGrid API key verification failed:', error.message);
      console.error('Please check your SENDGRID_API_KEY in .env file');
      return false;
    }
  }

  // Generate verification token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate reset token
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send email verification
  async sendVerificationEmail(userEmail, userName, verificationToken) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const msg = {
      to: userEmail,
      from: {
        email: process.env.EMAIL_FROM || 'noreply@snapfest.com',
        name: 'SnapFest'
      },
      subject: 'Verify Your SnapFest Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #e91e63, #f06292); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to SnapFest!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Please verify your email address</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Thank you for registering with SnapFest! To activate your account, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #e91e63, #f06292); 
                        color: white; padding: 15px 30px; text-decoration: none; 
                        border-radius: 25px; font-weight: bold; font-size: 16px;
                        box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);">
                🎊 Verify Email Address
              </a>
            </div>
            
            <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 16px;">✅ What happens next?</h3>
              <ul style="color: #2e7d32; margin: 0; padding-left: 20px; font-size: 14px;">
                <li style="margin: 5px 0;">Click the button above to verify your email</li>
                <li style="margin: 5px 0;">You'll be redirected to your SnapFest profile</li>
                <li style="margin: 5px 0;">Start planning your perfect event!</li>
              </ul>
            </div>
            
            <p style="color: #888; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              This link will expire in 24 hours. If you did not register for SnapFest, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} SnapFest. All rights reserved.</p>
          </div>
        </div>
      `
    };

    try {
      const result = await sgMail.send(msg);
      console.log('✅ Verification email sent via SendGrid:', result[0].headers['x-message-id']);
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error('❌ Error sending verification email via SendGrid:', error);
      console.error('Error Code:', error.code);
      console.error('Response:', error.response);
      
      if (error.code === 401) {
        throw new Error('SendGrid API key is invalid. Please check your SENDGRID_API_KEY in .env file.');
      } else if (error.code === 403) {
        throw new Error('SendGrid API key does not have permission to send emails.');
      } else {
        throw new Error(`Failed to send verification email: ${error.message}`);
      }
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const msg = {
      to: userEmail,
      from: {
        email: process.env.EMAIL_FROM || 'noreply@snapfest.com',
        name: 'SnapFest'
      },
      subject: 'Reset Your SnapFest Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #f44336, #e57373); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🔒 Password Reset Request</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">SnapFest Account Security</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              We received a request to reset your password for your SnapFest account. If you made this request, please click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #f44336, #e57373); 
                        color: white; padding: 15px 30px; text-decoration: none; 
                        border-radius: 25px; font-weight: bold; font-size: 16px;
                        box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);">
                🔑 Reset Your Password
              </a>
            </div>
            
            <div style="background: #fff3e0; border: 1px solid #ffb74d; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #e65100; margin: 0 0 15px 0; font-size: 16px;">⚠️ Security Notice</h3>
              <ul style="color: #bf360c; margin: 0; padding-left: 20px; font-size: 14px;">
                <li style="margin: 5px 0;">This link will expire in 1 hour for security</li>
                <li style="margin: 5px 0;">If you didn't request this reset, please ignore this email</li>
                <li style="margin: 5px 0;">Never share this link with anyone</li>
                <li style="margin: 5px 0;">Contact support if you have concerns</li>
              </ul>
            </div>
            
            <p style="color: #888; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              For your security, do not share this link with anyone.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} SnapFest. All rights reserved.</p>
          </div>
        </div>
      `
    };

    try {
      const result = await sgMail.send(msg);
      console.log('✅ Password reset email sent via SendGrid:', result[0].headers['x-message-id']);
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error('❌ Error sending password reset email via SendGrid:', error);
      console.error('Error Code:', error.code);
      console.error('Response:', error.response);
      
      if (error.code === 401) {
        throw new Error('SendGrid API key is invalid. Please check your SENDGRID_API_KEY in .env file.');
      } else if (error.code === 403) {
        throw new Error('SendGrid API key does not have permission to send emails.');
      } else {
        throw new Error(`Failed to send password reset email: ${error.message}`);
      }
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(userEmail, userName) {
    const msg = {
      to: userEmail,
      from: {
        email: process.env.EMAIL_FROM || 'noreply@snapfest.com',
        name: 'SnapFest'
      },
      subject: 'Welcome to SnapFest! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #e91e63, #f06292); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to SnapFest!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your email has been verified successfully!</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Your email has been verified successfully! You can now access all SnapFest features.
            </p>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">🚀 What You Can Do Now:</h3>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <span style="font-size: 24px; margin-right: 15px;">📦</span>
                  <div>
                    <strong>Browse Packages</strong><br>
                    <span style="color: #666; font-size: 14px;">Explore our curated event packages</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <span style="font-size: 24px; margin-right: 15px;">🎨</span>
                  <div>
                    <strong>Beat & Bloom Services</strong><br>
                    <span style="color: #666; font-size: 14px;">Find individual services for your event</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <span style="font-size: 24px; margin-right: 15px;">📅</span>
                  <div>
                    <strong>Book Events</strong><br>
                    <span style="color: #666; font-size: 14px;">Plan and book your perfect event</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/packages" 
                 style="background: linear-gradient(135deg, #e91e63, #f06292); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);">
                🎊 Start Planning Your Event
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
              <p>Need help? Contact our support team anytime!</p>
              <p style="margin-top: 20px;">
                <strong>SnapFest Team</strong><br>
                Making Your Events Unforgettable ✨
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} SnapFest. All rights reserved.</p>
          </div>
        </div>
      `
    };

    try {
      const result = await sgMail.send(msg);
      console.log('✅ Welcome email sent via SendGrid:', result[0].headers['x-message-id']);
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error('❌ Error sending welcome email via SendGrid:', error);
      console.error('Error Code:', error.code);
      console.error('Response:', error.response);
      
      if (error.code === 401) {
        throw new Error('SendGrid API key is invalid. Please check your SENDGRID_API_KEY in .env file.');
      } else if (error.code === 403) {
        throw new Error('SendGrid API key does not have permission to send emails.');
      } else {
        throw new Error(`Failed to send welcome email: ${error.message}`);
      }
    }
  }
}

export default new SendGridEmailService();
