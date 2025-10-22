import { OTP } from '../models/index.js';

// OTP Service for Payment Verification
class OTPService {
  // Generate OTP for payment verification
  static generateOTP(bookingId, type = 'FULL_PAYMENT') {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return {
      code,
      expiresAt,
      bookingId,
      type
    };
  }

  // Create OTP in database
  static async createOTP(bookingId, type = 'FULL_PAYMENT') {
    const otpData = this.generateOTP(bookingId, type);
    
    const otp = await OTP.create({
      bookingId,
      code: otpData.code,
      type,
      expiresAt: otpData.expiresAt
    });

    return otp;
  }

  // Verify OTP
  static async verifyOTP(bookingId, code) {
    const otp = await OTP.findOne({
      bookingId,
      code,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otp) {
      return { isValid: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as used
    otp.isUsed = true;
    otp.verifiedAt = new Date();
    await otp.save();

    return { isValid: true, otp };
  }

  // Check if OTP exists and is valid
  static async checkOTP(bookingId, code) {
    const otp = await OTP.findOne({
      bookingId,
      code,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    return !!otp;
  }

  // Get pending OTPs for a booking
  static async getPendingOTPs(bookingId) {
    return await OTP.find({
      bookingId,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
  }

  // Clean expired OTPs
  static async cleanExpiredOTPs() {
    return await OTP.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }
}

export default OTPService;





