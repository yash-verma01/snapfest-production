import mongoose from 'mongoose';

// SIMPLE Cart Model - Exactly as per requirements
const cartSchema = new mongoose.Schema({
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
    required: true
  },
  location: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
