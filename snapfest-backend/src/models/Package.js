import mongoose from 'mongoose';

// Enhanced Package Model with detailed features and multiple photos
const packageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['WEDDING', 'BIRTHDAY', 'BABY_SHOWER', 'DEMISE', 'HALDI_MEHNDI', 'CAR_DIGGI_CELEBRATION', 'CORPORATE'],
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // Enhanced photo gallery
  images: [{
    type: String
  }],
  // Primary image for cards
  primaryImage: {
    type: String,
    default: ''
  },
  // Detailed included features with pricing and removable options
  includedFeatures: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      default: 0
    },
    isRemovable: {
      type: Boolean,
      default: false
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  // Package highlights
  highlights: [{
    type: String
  }],
  // Package tags
  tags: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Customization options
  customizationOptions: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'DECORATION', 'CATERING', 'ENTERTAINMENT', 'TRANSPORTATION', 'OTHER'],
      default: 'OTHER'
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    maxQuantity: {
      type: Number,
      default: 1
    }
  }],
  // SEO fields
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  metaDescription: {
    type: String,
    maxlength: 160
  }
}, {
  timestamps: true
});

const Package = mongoose.model('Package', packageSchema);
export default Package;
