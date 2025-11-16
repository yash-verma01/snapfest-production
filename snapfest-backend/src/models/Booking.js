import mongoose from 'mongoose';

// SIMPLE Booking Model - Exactly as per requirements
const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  eventDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  customization: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING_PARTIAL_PAYMENT', 'PARTIALLY_PAID', 'ASSIGNED', 'FULLY_PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING_PARTIAL_PAYMENT'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  partialAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  assignedVendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  otpVerified: {
    type: Boolean,
    default: false
  },
  otpVerifiedAt: {
    type: Date,
    default: null
  },
  verificationOTP: {
    type: String,
    default: null
  },
  verificationOTPExpiresAt: {
    type: Date,
    default: null
  },
  verificationOTPGeneratedAt: {
    type: Date,
    default: null
  },
  verificationOTPGeneratedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
