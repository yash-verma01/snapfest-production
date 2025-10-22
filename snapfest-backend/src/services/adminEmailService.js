import nodemailer from 'nodemailer';

class AdminEmailService {
  constructor() {
    // Create transporter for email sending
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send welcome email to new users
  async sendWelcomeEmail(userEmail, userName) {
    const mailOptions = {
      from: `"SnapFest Admin" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to SnapFest - Your Account is Ready! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; font-size: 32px; margin: 0;">🎉 Welcome to SnapFest!</h1>
            <p style="color: #666; font-size: 18px; margin: 10px 0;">Your account has been created by our admin team</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #e91e63, #f06292); color: white; padding: 30px; border-radius: 15px; margin-bottom: 20px; text-align: center;">
            <h2 style="margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>
            <p style="font-size: 18px; margin: 0; opacity: 0.9;">
              Your SnapFest account has been created and is ready to use!
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
            <a href="${process.env.FRONTEND_URL}/login" 
               style="background: linear-gradient(135deg, #e91e63, #f06292); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);">
              🎊 Login to Your Account
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
            <p>Need help? Contact our support team anytime!</p>
            <p style="margin-top: 20px;">
              <strong>SnapFest Admin Team</strong><br>
              Making Your Events Unforgettable ✨
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Admin welcome email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending admin welcome email:', error);
      throw new Error('Failed to send admin welcome email');
    }
  }

  // Send account activation email
  async sendAccountActivationEmail(userEmail, userName) {
    const mailOptions = {
      from: `"SnapFest Admin" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Your SnapFest Account Has Been Activated! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; font-size: 32px; margin: 0;">🎉 Account Activated!</h1>
            <p style="color: #666; font-size: 18px; margin: 10px 0;">Your SnapFest account is now active and ready to use</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 30px; border-radius: 15px; margin-bottom: 20px; text-align: center;">
            <h2 style="margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>
            <p style="font-size: 18px; margin: 0; opacity: 0.9;">
              Great news! Your SnapFest account has been activated by our admin team.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">✅ What This Means:</h3>
            <ul style="color: #555; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin: 8px 0;">You can now login to your account</li>
              <li style="margin: 8px 0;">Access all SnapFest features and services</li>
              <li style="margin: 8px 0;">Book events and manage your profile</li>
              <li style="margin: 8px 0;">Receive personalized recommendations</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/login" 
               style="background: linear-gradient(135deg, #4caf50, #66bb6a); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
              🚀 Login to Your Account
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
            <p>Welcome to the SnapFest family!</p>
            <p style="margin-top: 20px;">
              <strong>SnapFest Admin Team</strong><br>
              Making Your Events Unforgettable ✨
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Account activation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending activation email:', error);
      throw new Error('Failed to send activation email');
    }
  }

  // Send account deactivation email
  async sendAccountDeactivationEmail(userEmail, userName, reason = '') {
    const mailOptions = {
      from: `"SnapFest Admin" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Your SnapFest Account Has Been Deactivated',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f44336; font-size: 32px; margin: 0;">⚠️ Account Deactivated</h1>
            <p style="color: #666; font-size: 18px; margin: 10px 0;">Your SnapFest account has been deactivated</p>
          </div>
          
          <div style="background: #ffebee; border: 1px solid #f44336; padding: 30px; border-radius: 15px; margin-bottom: 20px; text-align: center;">
            <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #f44336;">Hi ${userName},</h2>
            <p style="font-size: 18px; margin: 0; color: #d32f2f;">
              Your SnapFest account has been deactivated by our admin team.
            </p>
          </div>
          
          ${reason ? `
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">📋 Reason:</h3>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0;">
              ${reason}
            </p>
          </div>
          ` : ''}
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">📞 Need Help?</h3>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
              If you believe this is an error or have questions, please contact our support team:
            </p>
            <ul style="color: #555; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin: 5px 0;">Email: support@snapfest.com</li>
              <li style="margin: 5px 0;">Phone: +91-XXXX-XXXX</li>
              <li style="margin: 5px 0;">Live Chat: Available on our website</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
            <p>We're sorry for any inconvenience caused.</p>
            <p style="margin-top: 20px;">
              <strong>SnapFest Admin Team</strong><br>
              Customer Support
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Account deactivation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending deactivation email:', error);
      throw new Error('Failed to send deactivation email');
    }
  }

  // Send custom email to user
  async sendCustomEmail(userEmail, userName, subject, message, adminName = 'SnapFest Admin') {
    const mailOptions = {
      from: `"${adminName}" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; font-size: 28px; margin: 0;">📧 Message from SnapFest</h1>
            <p style="color: #666; font-size: 16px; margin: 10px 0;">A message from our admin team</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>
            <div style="color: #555; font-size: 16px; line-height: 1.6; margin: 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
            <p>This message was sent by: <strong>${adminName}</strong></p>
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
      console.log('✅ Custom email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending custom email:', error);
      throw new Error('Failed to send custom email');
    }
  }

  // Send bulk email to multiple users
  async sendBulkEmail(userEmails, subject, message, adminName = 'SnapFest Admin') {
    const results = [];
    
    for (const emailData of userEmails) {
      try {
        const result = await this.sendCustomEmail(
          emailData.email, 
          emailData.name, 
          subject, 
          message, 
          adminName
        );
        results.push({ email: emailData.email, success: true, messageId: result.messageId });
      } catch (error) {
        results.push({ email: emailData.email, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

export default new AdminEmailService();

