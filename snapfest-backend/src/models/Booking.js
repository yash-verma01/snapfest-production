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
  // Vendor status - updated by vendor in dashboard (ONLY status field)
  vendorStatus: {
    type: String,
    enum: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: null
  },
  // Payment status - updated when payments are processed
  paymentStatus: {
    type: String,
    enum: ['PENDING_PAYMENT', 'PARTIALLY_PAID', 'FULLY_PAID', 'FAILED_PAYMENT'],
    default: 'PENDING_PAYMENT'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  // Remaining amount to be paid (calculated as totalAmount - amountPaid)
  remainingAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  // Payment percentage configuration (20-100%)
  paymentPercentage: {
    type: Number,
    default: 20,
    min: 20,
    max: 100
  },
  // Track how much percentage has been paid (0-100%)
  paymentPercentagePaid: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Remaining percentage to be paid (0-100%)
  remainingPercentage: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  // Flag to indicate if ANY payment is done online (not just 100%)
  onlinePaymentDone: {
    type: Boolean,
    default: false
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
