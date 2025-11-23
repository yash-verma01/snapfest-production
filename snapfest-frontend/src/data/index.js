// Import dummy data
import { dummyPackages, packageCategories, priceRanges } from './dummyPackages';
import { dummyTestimonials, testimonialStats } from './dummyTestimonials';
import { dummyEvents, eventTypes, eventStats } from './dummyEvents';
import { dummyBeatBlooms, beatBloomCategories } from './dummyBeatBlooms';

// Main dummy data exports
export { dummyPackages, packageCategories, priceRanges };
export { dummyTestimonials, testimonialStats };
export { dummyEvents, eventTypes, eventStats };
export { dummyBeatBlooms, beatBloomCategories };

// Combined data for easy access
export const dummyData = {
  packages: dummyPackages,
  testimonials: dummyTestimonials,
  events: dummyEvents,
  beatBlooms: dummyBeatBlooms,
  stats: {
    packages: packageCategories.length,
    testimonials: testimonialStats.totalReviews,
    events: eventStats.total
  }
};
