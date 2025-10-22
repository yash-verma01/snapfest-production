import nodemailer from 'nodemailer';
import crypto from 'crypto';

class EmailService {
  constructor() {
    // Create transporter for email sending with better configuration
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration
    this.verifyConnection();
  }

  // Verify email connection
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
      console.error('Error Code:', error.code);
      console.error('Response:', error.response);
      
      // Provide specific troubleshooting tips
      if (error.code === 'EAUTH') {
        console.error('🔧 Authentication Error - Possible fixes:');
        console.error('1. Check if your Gmail app password is correct');
        console.error('2. Ensure 2-Factor Authentication is enabled');
        console.error('3. Generate a new app password for "Mail"');
        console.error('4. Verify EMAIL_USER and EMAIL_PASSWORD in .env');
        console.error('5. For now, emails will be logged to console instead of sent');
      } else if (error.code === 'ECONNECTION') {
        console.error('🔧 Connection Error - Possible fixes:');
        console.error('1. Check your internet connection');
        console.error('2. Verify SMTP settings');
        console.error('3. Check firewall settings');
      }
      
      // Set fallback mode for development
      this.fallbackMode = true;
      console.log('⚠️ Email service in fallback mode - emails will be logged to console');
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
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"SnapFest" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to SnapFest - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; font-size: 28px; margin: 0;">🎉 Welcome to SnapFest!</h1>
            <p style="color: #666; font-size: 16px; margin: 10px 0;">Your Event Planning Journey Starts Here</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Hi ${userName}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for joining SnapFest! We're excited to help you create unforgettable events.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              To get started, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #e91e63, #f06292); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);">
                ✨ Verify My Email
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; margin: 20px 0 0 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #e91e63; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="background: #e91e63; color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px;">🎊 What's Next?</h3>
            <ul style="text-align: left; margin: 0; padding-left: 20px;">
              <li style="margin: 8px 0;">Explore our curated event packages</li>
              <li style="margin: 8px 0;">Connect with professional vendors</li>
              <li style="margin: 8px 0;">Plan your dream event with ease</li>
              <li style="margin: 8px 0;">Get personalized recommendations</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with SnapFest, please ignore this email.</p>
            <p style="margin-top: 20px;">
              <strong>SnapFest Team</strong><br>
              Making Your Events Unforgettable ✨
            </p>
          </div>
        </div>
      `
    };

    try {
      // Check if in fallback mode
      if (this.fallbackMode) {
        console.log('📧 [FALLBACK MODE] Verification email would be sent to:', userEmail);
        console.log('📧 [FALLBACK MODE] Verification link:', `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`);
        console.log('📧 [FALLBACK MODE] Email content logged above');
        return { success: true, messageId: 'fallback-mode', fallback: true };
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      console.error('Error Code:', error.code);
      console.error('Response:', error.response);
      
      // If authentication fails, switch to fallback mode
      if (error.code === 'EAUTH') {
        console.log('⚠️ Switching to fallback mode due to authentication error');
        this.fallbackMode = true;
        console.log('📧 [FALLBACK MODE] Verification email would be sent to:', userEmail);
        console.log('📧 [FALLBACK MODE] Verification link:', `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`);
        return { success: true, messageId: 'fallback-mode', fallback: true };
      }
      
      // Provide specific error messages for other errors
      if (error.code === 'ECONNECTION') {
        throw new Error('Email connection failed. Please check your internet connection.');
      } else {
        throw new Error(`Failed to send verification email: ${error.message}`);
      }
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"SnapFest" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Reset Your SnapFest Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; font-size: 28px; margin: 0;">🔐 Password Reset Request</h1>
            <p style="color: #666; font-size: 16px; margin: 10px 0;">SnapFest Account Security</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Hi ${userName}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              We received a request to reset your password for your SnapFest account.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #e91e63, #f06292); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);">
                🔑 Reset My Password
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; margin: 20px 0 0 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #e91e63; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 16px;">⚠️ Security Notice</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px; font-size: 14px;">
              <li style="margin: 5px 0;">This link will expire in 1 hour for security</li>
              <li style="margin: 5px 0;">If you didn't request this reset, please ignore this email</li>
              <li style="margin: 5px 0;">Your password will remain unchanged until you click the link</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
            <p>If you're having trouble, contact our support team.</p>
            <p style="margin-top: 20px;">
              <strong>SnapFest Security Team</strong><br>
              Keeping Your Account Safe 🔒
            </p>
          </div>
        </div>
      `
    };

    try {
      // Check if in fallback mode
      if (this.fallbackMode) {
        console.log('📧 [FALLBACK MODE] Password reset email would be sent to:', userEmail);
        console.log('📧 [FALLBACK MODE] Reset link:', resetUrl);
        console.log('📧 [FALLBACK MODE] Email content logged above');
        return { success: true, messageId: 'fallback-mode', fallback: true };
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      
      // If authentication fails, switch to fallback mode
      if (error.code === 'EAUTH') {
        console.log('⚠️ Switching to fallback mode due to authentication error');
        this.fallbackMode = true;
        console.log('📧 [FALLBACK MODE] Password reset email would be sent to:', userEmail);
        console.log('📧 [FALLBACK MODE] Reset link:', resetUrl);
        return { success: true, messageId: 'fallback-mode', fallback: true };
      }
      
      throw new Error('Failed to send password reset email');
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(userEmail, userName) {
    const mailOptions = {
      from: `"SnapFest" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to SnapFest - Your Account is Ready! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; font-size: 32px; margin: 0;">🎉 Welcome to SnapFest!</h1>
            <p style="color: #666; font-size: 18px; margin: 10px 0;">Your account is now verified and ready to use</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #e91e63, #f06292); color: white; padding: 30px; border-radius: 15px; margin-bottom: 20px; text-align: center;">
            <h2 style="margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>
            <p style="font-size: 18px; margin: 0; opacity: 0.9;">
              Your email has been verified successfully! You can now access all SnapFest features.
            </p>
          </div>
          
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
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }
}

export default new EmailService();

