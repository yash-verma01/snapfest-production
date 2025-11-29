// SMS Service for sending OTP and notifications
// Supports Twilio or fallback mode for development

class SMSService {
  constructor() {
    // Initialize with your SMS provider credentials
    // For Twilio (install: npm install twilio)
    // You can also use AWS SNS, MessageBird, or any other SMS provider
    
    this.client = null;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.SMS_FROM_NUMBER;
    
    // Initialize Twilio if credentials are available
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require('twilio');
        this.client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        console.log('✅ SMS Service initialized with Twilio');
      } catch (error) {
        console.warn('⚠️ Twilio not installed. Install with: npm install twilio');
        console.warn('⚠️ SMS will run in fallback mode');
      }
    } else {
      console.log('📱 SMS Service: No credentials found, running in fallback mode');
    }
  }

  async sendSMS(toPhone, message) {
    if (!this.client) {
      console.log('📱 [FALLBACK MODE] SMS would be sent to:', toPhone);
      console.log('📱 [FALLBACK MODE] Message:', message);
      return { success: true, messageId: 'fallback-mode', fallback: true };
    }

    if (!this.fromNumber) {
      console.warn('⚠️ SMS from number not configured');
      return { success: false, message: 'SMS from number not configured', fallback: true };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toPhone
      });
      console.log('✅ SMS sent:', result.sid);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      throw error;
    }
  }

  async sendOTP(toPhone, otpCode, userName, bookingId) {
    const message = `Hi ${userName}, Your booking verification OTP is: ${otpCode}. This OTP is valid for 10 minutes. Booking ID: ${bookingId.slice(-8)}`;
    return await this.sendSMS(toPhone, message);
  }
}

export default new SMSService();








