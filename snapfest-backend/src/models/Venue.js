import mongoose from 'mongoose';

// Venue model to list event venues with basic attributes for discovery/selection
const venueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  capacity: { type: Number, default: 0 },
  pricePerDay: { type: Number, default: 0 },
  amenities: [{ type: String }],
  images: [{ type: String }],
  // Primary image for cards
  primaryImage: { type: String, default: '' },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  isActive: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  description: { type: String, default: '' },
  features: [{ type: String }], // Key features of the venue
  contactInfo: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  // Venue specifications
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 }
  },
  // Additional services
  services: [{ type: String }], // Catering, Photography, etc.
  // Venue type
  type: {
    type: String,
    enum: ['HOTEL', 'BANQUET_HALL', 'RESORT', 'GARDEN', 'BEACH', 'ROOFTOP', 'CONVENTION_CENTER', 'OTHER'],
    default: 'OTHER'
  },
  // Location details
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    fullAddress: { type: String, default: '' }
  }
}, { timestamps: true });

const Venue = mongoose.model('Venue', venueSchema);
export default Venue;




