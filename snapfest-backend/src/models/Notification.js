import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      // Admin notifications
      'NEW_BOOKING',
      'NEW_ENQUIRY',
      'NEW_PAYMENT',
      'NEW_USER',
      'BOOKING_ASSIGNED',
      'PAYMENT_RECEIVED',
      
      // Vendor notifications
      'BOOKING_ASSIGNED_TO_VENDOR',
      'BOOKING_ACCEPTED',
      'BOOKING_REJECTED',
      'PAYMENT_PENDING',
      'OTP_GENERATED',
      
      // User notifications
      'BOOKING_CONFIRMED',
      'VENDOR_ASSIGNED',
      'PAYMENT_SUCCESS',
      'BOOKING_COMPLETED'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // bookingId, enquiryId, paymentId, etc.
  },
  relatedType: {
    type: String,
    enum: ['Booking', 'Enquiry', 'Payment', 'User'],
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
