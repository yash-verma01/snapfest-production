import mongoose from 'mongoose';

// Enhanced OTP Model for Payment Verification
const otpSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['PARTIAL_PAYMENT', 'FULL_PAYMENT'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;
