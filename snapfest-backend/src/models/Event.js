import mongoose from 'mongoose';

// Event model to store gallery/listing of events for inspiration and discovery
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['WEDDING', 'BIRTHDAY', 'HALDI', 'CORPORATE', 'BABY_SHOWER', 'ANNIVERSARY', 'FESTIVAL', 'OTHER'],
    default: 'OTHER'
  },
  description: { type: String, default: '' },
  shortDescription: { type: String, maxlength: 150 }, // For card preview
  date: { type: Date, default: null },
  location: { 
    name: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    fullAddress: { type: String, default: '' }
  },
  image: { type: String, default: '' }, // Primary image
  images: [{ type: String }], // Gallery images
  guestCount: { type: Number, default: 0 },
  duration: { type: String, default: '' }, // e.g., "6 hours", "Full day"
  budget: { 
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  // Vendor information
  photographer: {
    name: { type: String, default: '' },
    contact: { type: String, default: '' }
  },
  // Event highlights/features
  highlights: [{ type: String }], // Key features of the event
  tags: [{ type: String }], // Searchable tags
  // Status and visibility
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: true },
  // SEO and metadata
  slug: { type: String, unique: true, sparse: true },
  metaDescription: { type: String, maxlength: 160 },
  // Engagement metrics
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
export default Event;




