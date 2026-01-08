import mongoose from 'mongoose';

// SIMPLE Vendor Model - Exactly as per requirements
// Updated to support Clerk authentication - vendors are stored directly in Vendor collection
const vendorSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Basic user info (stored in Vendor, not User table)
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String
  },
  profileImage: {
    type: String
  },
  // Legacy userId for backward compatibility (optional now)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    unique: false
  },
  businessName: {
    type: String,
    required: false
  },
  businessType: {
    type: String,
    enum: ['PHOTOGRAPHY', 'CATERING', 'DECORATION', 'ENTERTAINMENT', 'VENUE', 'LIGHTING', 'SOUND', 'TRANSPORTATION', 'SECURITY', 'OTHER']
  },
  servicesOffered: [{
    type: String,
    enum: ['CATERING', 'DECORATION', 'PHOTOGRAPHY', 'VIDEOGRAPHY', 'ENTERTAINMENT', 'VENUE', 'LIGHTING', 'SOUND', 'TRANSPORTATION', 'SECURITY']
  }],
  location: {
    type: String
  },
  bio: {
    type: String,
    maxlength: 500
  },
  experience: {
    type: Number,
    default: 0
  },
  portfolio: [{
    type: String // URLs to portfolio images
  }],
  pricing: {
    basePrice: {
      type: Number
    },
    perHourRate: {
      type: Number
    },
    packagePricing: [{
      name: String,
      price: Number,
      description: String
    }]
  },
  availability: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'UNAVAILABLE'],
    default: 'AVAILABLE'
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  earningsSummary: {
    totalEarnings: {
      type: Number,
      default: 0
    },
    thisMonthEarnings: {
      type: Number,
      default: 0
    },
    totalBookings: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
