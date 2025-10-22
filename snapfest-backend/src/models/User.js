import mongoose from 'mongoose';
import { USER_ROLES } from '../config/constants.js';

// SIMPLE User Model - No business logic, just data structure
const userSchema = new mongoose.Schema({
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
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.USER
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
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
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpire: {
    type: Date,
    default: null
  },
  phoneVerificationOTP: {
    type: String,
    default: null
  },
  phoneVerificationExpire: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Simple model - no business logic here
const User = mongoose.model('User', userSchema);
export default User;
