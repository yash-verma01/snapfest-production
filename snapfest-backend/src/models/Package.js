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
    },
    // Options for this add-on (e.g., Cake flavors: Chocolate, Vanilla, Strawberry)
    options: {
      type: [{
        label: {
          type: String,
          required: true
        },
        priceModifier: {
          type: Number,
          default: 0  // Price difference from base price (can be positive or negative)
        }
      }],
      default: []  // Default to empty array for backward compatibility
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

// Ensure options array exists for backward compatibility with existing packages
packageSchema.pre('save', function(next) {
  if (this.customizationOptions && Array.isArray(this.customizationOptions)) {
    this.customizationOptions = this.customizationOptions.map(option => {
      // Ensure options array exists and is an array
      if (!option.options || !Array.isArray(option.options)) {
        option.options = [];
      }
      // Ensure each option in the array has valid structure
      if (option.options && Array.isArray(option.options)) {
        option.options = option.options.filter(opt => {
          // Only keep options that have a valid label
          return opt && opt.label && typeof opt.label === 'string' && opt.label.trim().length > 0;
        }).map(opt => ({
          label: opt.label,
          priceModifier: typeof opt.priceModifier === 'number' ? opt.priceModifier : 0
        }));
      }
      return option;
    });
  }
  next();
});

// Also handle when documents are retrieved (for backward compatibility)
packageSchema.post('init', function() {
  if (this.customizationOptions && Array.isArray(this.customizationOptions)) {
    this.customizationOptions = this.customizationOptions.map(option => {
      if (!option.options || !Array.isArray(option.options)) {
        option.options = [];
      }
      return option;
    });
  }
});

const Package = mongoose.model('Package', packageSchema);
export default Package;
