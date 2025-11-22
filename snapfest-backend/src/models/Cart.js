import mongoose from 'mongoose';

// Cart Model - Supports both Packages and BeatBloom items
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Make packageId optional - only required for package items
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: function() {
      return this.itemType === 'package' || !this.itemType; // Backward compatible: if no itemType, assume package
    }
  },
  // Add beatBloomId for BeatBloom items
  beatBloomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BeatBloom',
    required: function() {
      return this.itemType === 'beatbloom';
    }
  },
  // Add itemType with default 'package' for backward compatibility
  itemType: {
    type: String,
    enum: ['package', 'beatbloom'],
    default: 'package' // Default to 'package' so existing items work
  },
  customization: {
    type: String,
    default: ''
  },
  eventDate: {
    type: Date,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    default: 1
  },
  location: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Migration helper: Set itemType for existing items without it
cartSchema.pre('save', function(next) {
  // If itemType is not set but packageId exists, set it to 'package'
  if (!this.itemType && this.packageId) {
    this.itemType = 'package';
  }
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
