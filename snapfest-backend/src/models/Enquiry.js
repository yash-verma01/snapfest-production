import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional - if user is logged in
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: false
  },
  enquiryType: {
    type: String,
    enum: ['venue', 'package', 'event', 'beatbloom', 'general', 'booking', 'support', 'partnership', 'feedback'],
    required: true,
    default: 'general'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false, // venueId, packageId, etc.
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Venue', 'Package', 'Event', 'BeatBloom'],
    required: false
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  eventDate: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'closed'],
    default: 'new'
  },
  adminResponse: {
    type: String,
    required: false
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  respondedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Index for faster queries
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ userId: 1 });
enquirySchema.index({ enquiryType: 1 });

export default mongoose.model('Enquiry', enquirySchema);

