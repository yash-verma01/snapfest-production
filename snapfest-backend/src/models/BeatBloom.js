import mongoose from 'mongoose';

// Beat & Bloom individual service packages (e.g., DJ, Decor, Photography)
const beatBloomSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true, required: true },
  category: {
    type: String,
    enum: ['ENTERTAINMENT', 'DECOR', 'PHOTOGRAPHY', 'CATERING', 'LIGHTING', 'OTHER'],
    default: 'OTHER'
  },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  features: [{ type: String }],
  images: [{ type: String }],
  rating: { type: Number, min: 0, max: 5, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Pre-save middleware to generate slug
beatBloomSchema.pre('save', function(next) {
  if (this.isNew && (!this.slug || this.slug === '')) {
    // Generate slug from title
    let slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
    
    // Add timestamp and random string to ensure uniqueness
    this.slug = `${slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

const BeatBloom = mongoose.model('BeatBloom', beatBloomSchema);
export default BeatBloom;





