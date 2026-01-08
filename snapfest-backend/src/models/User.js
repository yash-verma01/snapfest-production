import mongoose from 'mongoose';
import { USER_ROLES } from '../config/constants.js';

/**
 * User Model - Simplified for Clerk-based authentication
 * 
 * Clerk handles all authentication, email verification, password reset, and social logins.
 * This model only stores application-specific data like profile information.
 * 
 * Removed fields (now handled by Clerk):
 * - password, resetPasswordToken, resetPasswordExpire (password management)
 * - isEmailVerified, emailVerificationToken, emailVerificationExpire (email verification)
 * - isPhoneVerified, phoneVerificationOTP, phoneVerificationExpire (phone verification)
 */
const userSchema = new mongoose.Schema({
  // Clerk authentication - required for all users
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    comment: 'Clerk user ID - used to link local user with Clerk account'
  },
  
  // Profile information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    comment: 'Email from Clerk - email verification status is managed by Clerk'
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    comment: 'Phone number - phone verification is managed by Clerk if used'
  },
  profileImage: {
    type: String,
    default: null
  },
  
  // Application-specific fields
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.USER
  },
  isActive: {
    type: Boolean,
    default: true,
    comment: 'Account status - can be deactivated by admin'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Address information
  address: {
    street: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Vendor-specific fields (only used when role = 'vendor')
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
  // GPS Location Tracking (for vendors)
  currentLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    address: {
      type: String,
      default: ''
    },
    lastUpdated: {
      type: Date,
      default: null
    },
    isTrackingEnabled: {
      type: Boolean,
      default: false
    }
  },
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    address: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
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
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ clerkId: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
