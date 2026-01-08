import sgMail from '@sendgrid/mail';

class SendGridService {
  constructor() {
    // Initialize SendGrid with API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  // Send email verification
  async sendVerificationEmail(toEmail, userName, token) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const msg = {
      to: toEmail,
      from: {
        email: 'noreply@snapfest.com',
        name: 'SnapFest'
      },
      subject: 'Verify Your SnapFest Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #e91e63, #f06292); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to SnapFest!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your account is almost ready</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Thank you for registering with SnapFest! To activate your account and start planning your perfect event, please verify your email address by clicking the button below:
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
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">What happens next?</h3>
              <ul style="color: #555; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Click the verification button above</li>
                <li>Your email will be verified instantly</li>
                <li>You'll have full access to all SnapFest features</li>
                <li>Start planning your perfect event!</li>
              </ul>
            </div>
            
            <p style="color: #888; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              This link will expire in 24 hours. If you did not register for a SnapFest account, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} SnapFest. All rights reserved.</p>
            <p>Making Your Events Unforgettable ✨</p>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('✅ SendGrid: Verification email sent successfully to:', toEmail);
      return { success: true, messageId: 'sent' };
    } catch (error) {
      console.error('❌ SendGrid: Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(toEmail, userName, token) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const msg = {
      to: toEmail,
      from: {
        email: 'noreply@snapfest.com',
        name: 'SnapFest'
      },
      subject: 'Reset Your SnapFest Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #f44336, #e57373); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🔒 Password Reset Request</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Secure your account</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              We received a request to reset the password for your SnapFest account. If you made this request, please click the button below to reset your password:
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
              <h3 style="color: #e65100; margin: 0 0 15px 0; font-size: 18px;">⚠️ Security Notice</h3>
              <ul style="color: #bf360c; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>This link will expire in 1 hour for security</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
                <li>Contact support if you have concerns</li>
              </ul>
            </div>
            
            <p style="color: #888; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              For your security, do not share this link with anyone.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} SnapFest. All rights reserved.</p>
            <p>Your security is our priority 🔒</p>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('✅ SendGrid: Password reset email sent successfully to:', toEmail);
      return { success: true, messageId: 'sent' };
    } catch (error) {
      console.error('❌ SendGrid: Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Send welcome email
  async sendWelcomeEmail(toEmail, userName) {
    const msg = {
      to: toEmail,
      from: {
        email: 'welcome@snapfest.com',
        name: 'SnapFest Team'
      },
      subject: 'Welcome to SnapFest - Your Account is Ready! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to SnapFest!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your account is ready to use</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Welcome to SnapFest! Your account has been created and is ready to use. Start planning your perfect event today!
            </p>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">🚀 What You Can Do Now:</h3>
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
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #4caf50, #66bb6a); 
                        color: white; padding: 15px 30px; text-decoration: none; 
                        border-radius: 25px; font-weight: bold; font-size: 16px;
                        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                🎊 Login to Your Account
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} SnapFest. All rights reserved.</p>
            <p>Making Your Events Unforgettable ✨</p>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('✅ SendGrid: Welcome email sent successfully to:', toEmail);
      return { success: true, messageId: 'sent' };
    } catch (error) {
      console.error('❌ SendGrid: Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }
}

export default new SendGridService();

