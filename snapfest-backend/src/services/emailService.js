import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

class EmailService {
  constructor() {
    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY is not set in .env file');
      console.error('   Please set SENDGRID_API_KEY to use email service');
      this.initialized = false;
      return;
    }

    // Initialize SendGrid
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.initialized = true;
      console.log('✅ Email Service: SendGrid initialized successfully');
    } catch (error) {
      console.error('❌ SendGrid initialization failed:', error.message);
      this.initialized = false;
    }
  }

  // Verify SendGrid API key
  async verifyApiKey() {
    if (!this.initialized) {
      return false;
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ SendGrid API key verified successfully');
        return true;
      } else if (response.status === 401) {
        console.error('❌ SendGrid API key is invalid (401 Unauthorized)');
        return false;
      } else if (response.status === 403) {
        console.error('❌ SendGrid API key does not have required permissions (403 Forbidden)');
        return false;
      } else {
        console.warn('⚠️ SendGrid API key verification returned status:', response.status);
        return true; // Assume valid if not 401/403
      }
    } catch (error) {
      console.error('❌ SendGrid verification failed:', error.message);
      return false;
    }
  }

  // Generic email sending method
  async sendEmail(toEmail, subject, htmlContent, fromEmail = null, fromName = 'SnapFest') {
    if (!this.initialized) {
      console.error('❌ Email service not initialized. SENDGRID_API_KEY is required.');
      throw new Error('Email service not configured. Please set SENDGRID_API_KEY in .env file');
    }

    // Validate email address
    if (!toEmail || typeof toEmail !== 'string' || toEmail.trim() === '') {
      console.error('❌ Invalid email address:', toEmail);
      throw new Error(`Invalid email address: ${toEmail}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = toEmail.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      console.error('❌ Invalid email format:', toEmail);
      throw new Error(`Invalid email format: ${toEmail}`);
    }

    const msg = {
      to: trimmedEmail, // Use trimmed and lowercased email
      from: {
        email: fromEmail || process.env.EMAIL_FROM || 'noreply@snapfest.com',
        name: fromName
      },
      subject: subject,
      html: htmlContent
    };

    // Log email details before sending
    console.log('📧 Attempting to send email to:', trimmedEmail);
    console.log('📧 Email subject:', subject);

    try {
      const result = await sgMail.send(msg);
      const messageId = result[0]?.headers?.['x-message-id'] || 'sent';
      console.log('✅ Email sent via SendGrid:', messageId);
      console.log('✅ Email delivered to:', trimmedEmail);
      return { success: true, messageId, provider: 'sendgrid' };
    } catch (error) {
      console.error('❌ SendGrid error:', error.message);
      console.error('❌ Failed to send email to:', trimmedEmail);
      console.error('❌ Error code:', error.code);
      
      if (error.response) {
        console.error('❌ Error response status:', error.response.statusCode);
        console.error('❌ Error response statusText:', error.response.statusText);
        console.error('❌ Error response body:', JSON.stringify(error.response.body, null, 2));
        
        if (error.code === 401) {
          throw new Error('SendGrid API key is invalid. Please check your SENDGRID_API_KEY in .env file.');
        } else if (error.code === 403) {
          throw new Error('SendGrid API key does not have permission to send emails. Please check API key permissions.');
        } else if (error.code === 400) {
          const errorMessage = error.response.body?.errors?.[0]?.message || error.message;
          console.error('❌ SendGrid validation error details:', errorMessage);
          throw new Error(`SendGrid validation error: ${errorMessage}`);
        }
      }
      
      throw new Error(`Failed to send email via SendGrid: ${error.message}`);
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
    
    const htmlContent = `
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
    `;

    return await this.sendEmail(
      userEmail,
      'Welcome to SnapFest - Verify Your Email',
      htmlContent
    );
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
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
    `;

    return await this.sendEmail(
      userEmail,
      'Reset Your SnapFest Password',
      htmlContent
    );
  }

  // Send welcome email after verification
  async sendWelcomeEmail(userEmail, userName) {
    const htmlContent = `
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
    `;

    return await this.sendEmail(
      userEmail,
      'Welcome to SnapFest - Your Account is Ready! 🎉',
      htmlContent
    );
  }

  // Enquiry confirmation email
  async sendEnquiryConfirmationEmail(userEmail, userName, enquiryType) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e91e63; font-size: 28px; margin: 0;">✅ Enquiry Received!</h1>
          <p style="color: #666; font-size: 16px; margin: 10px 0;">Thank you for contacting SnapFest</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Hi ${userName}! 👋</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            We've received your ${enquiryType} enquiry and our team will get back to you within 24 hours.
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0;">
            We appreciate your interest in SnapFest and look forward to helping you plan your perfect event!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
          <p><strong>SnapFest Team</strong><br>Making Your Events Unforgettable ✨</p>
        </div>
      </div>
    `;

    return await this.sendEmail(
      userEmail,
      'Your Enquiry Has Been Received - SnapFest',
      htmlContent
    );
  }

  // Admin notification email for new enquiry
  async sendAdminEnquiryNotification(adminEmail, enquiryData) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e91e63; font-size: 28px; margin: 0;">🔔 New Enquiry</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; font-size: 20px; margin: 0 0 20px 0;">Enquiry Details:</h2>
          <p><strong>Name:</strong> ${enquiryData.name}</p>
          <p><strong>Email:</strong> ${enquiryData.email}</p>
          <p><strong>Phone:</strong> ${enquiryData.phone || 'N/A'}</p>
          <p><strong>Type:</strong> ${enquiryData.enquiryType}</p>
          <p><strong>Subject:</strong> ${enquiryData.subject}</p>
          <p><strong>Message:</strong></p>
          <p style="background: white; padding: 15px; border-radius: 5px; margin-top: 10px;">${enquiryData.message}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/admin/enquiries" 
             style="background: linear-gradient(135deg, #e91e63, #f06292); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    display: inline-block;">
            View Enquiry
          </a>
        </div>
      </div>
    `;

    return await this.sendEmail(
      adminEmail,
      `New ${enquiryData.enquiryType} Enquiry Received - SnapFest`,
      htmlContent
    );
  }

  // Admin response email to user
  async sendAdminResponseEmail(userEmail, userName, adminResponse, enquirySubject) {
    console.log('🔍 sendAdminResponseEmail called');
    console.log('  - userEmail:', userEmail);
    console.log('  - userName:', userName);
    console.log('  - adminResponse type:', typeof adminResponse);
    console.log('  - adminResponse length:', adminResponse?.length || 0);
    console.log('  - enquirySubject:', enquirySubject);
    console.log('  - this.initialized:', this.initialized);
    
    // Escape HTML to prevent injection and formatting issues
    const escapeHtml = (text) => {
      if (!text) return '';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return String(text).replace(/[&<>"']/g, m => map[m]);
    };

    // Convert newlines to <br> tags for proper formatting
    const formattedResponse = escapeHtml(adminResponse).replace(/\n/g, '<br>');
    const escapedUserName = escapeHtml(userName);
    const escapedSubject = escapeHtml(enquirySubject);
    
    console.log('📧 Email content prepared, calling sendEmail...');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e91e63; font-size: 28px; margin: 0;">📧 Response to Your Enquiry</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Hi ${escapedUserName}! 👋</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for your enquiry. Here's our response:
          </p>
          <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #e91e63; white-space: pre-wrap; word-wrap: break-word;">
            ${formattedResponse}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
          <p><strong>SnapFest Team</strong><br>Making Your Events Unforgettable ✨</p>
        </div>
      </div>
    `;

    console.log('📧 HTML content generated, length:', htmlContent.length);
    console.log('📧 Calling sendEmail method...');
    
    return await this.sendEmail(
      userEmail,
      `Re: ${escapedSubject} - SnapFest`,
      htmlContent
    );
  }

  // Send booking confirmation email
  async sendBookingConfirmationEmail(userEmail, userName, bookingData) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e91e63; font-size: 28px; margin: 0;">🎉 Booking Confirmed!</h1>
          <p style="color: #666; font-size: 16px; margin: 10px 0;">Your event booking has been confirmed</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Hi ${userName}! 👋</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Great news! Your booking for <strong>${bookingData.packageTitle}</strong> has been confirmed.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📋 Booking Details:</h3>
            <p style="margin: 8px 0; color: #555;"><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Package:</strong> ${bookingData.packageTitle}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Event Date:</strong> ${new Date(bookingData.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Location:</strong> ${bookingData.location}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Total Amount:</strong> ₹${bookingData.totalAmount.toLocaleString('en-IN')}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Amount Paid:</strong> ₹${bookingData.amountPaid.toLocaleString('en-IN')}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Remaining Amount:</strong> ₹${bookingData.remainingAmount.toLocaleString('en-IN')}</p>
            ${bookingData.customization ? `<p style="margin: 8px 0; color: #555;"><strong>Customization:</strong> ${bookingData.customization}</p>` : ''}
          </div>
          
          <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 16px;">✅ What Happens Next?</h3>
            <ul style="color: #2e7d32; margin: 0; padding-left: 20px; font-size: 14px;">
              <li style="margin: 5px 0;">Admin will assign a vendor to your booking</li>
              <li style="margin: 5px 0;">Vendor will start preparation work</li>
              <li style="margin: 5px 0;">You'll receive updates about your booking</li>
              <li style="margin: 5px 0;">On event day, you'll pay the remaining amount</li>
              <li style="margin: 5px 0;">After full payment, you'll receive an OTP to share with vendor</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/user/bookings" 
             style="background: linear-gradient(135deg, #e91e63, #f06292); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    font-size: 16px;
                    display: inline-block;
                    box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);">
            View My Bookings
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
    `;

    return await this.sendEmail(
      userEmail,
      'Booking Confirmed - SnapFest',
      htmlContent
    );
  }
}

// Lazy initialization pattern
let emailServiceInstance = null;

const getEmailService = () => {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
};

export default getEmailService;
