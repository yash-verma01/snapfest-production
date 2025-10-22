import mongoose from 'mongoose';

// SIMPLE Payment Model - Exactly as per requirements
const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  method: {
    type: String,
    enum: ['online', 'cash'],
    required: true
  },
  transactionId: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  razorpayOrderId: {
    type: String,
    default: ''
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  refundId: {
    type: String,
    default: ''
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    default: ''
  },
  paymentDetails: {
    bank: String,
    wallet: String,
    vpa: String,
    card: {
      id: String,
      entity: String,
      name: String,
      last4: String,
      network: String,
      type: String,
      issuer: String,
      international: Boolean,
      emi: Boolean,
      sub_type: String,
      token_iin: String
    }
  },
  failureReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
