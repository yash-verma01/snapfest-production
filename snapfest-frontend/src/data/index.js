// Import dummy data
import { dummyPackages, packageCategories, priceRanges } from './dummyPackages';
import { dummyTestimonials, testimonialStats } from './dummyTestimonials';
import { dummyBookings, bookingStats, bookingStatuses } from './dummyBookings';
import { dummyUser, dummyVendor, dummyAdmin, dummyNotifications, dummyActivity } from './dummyUsers';
import { dummyEvents, eventTypes, eventStats } from './dummyEvents';
import { dummyAddOns, addOnCategories, addOnStats } from './dummyAddOns';
import { dummyBeatBlooms, beatBloomCategories } from './dummyBeatBlooms';

// Main dummy data exports
export { dummyPackages, packageCategories, priceRanges };
export { dummyTestimonials, testimonialStats };
export { dummyBookings, bookingStats, bookingStatuses };
export { dummyUser, dummyVendor, dummyAdmin, dummyNotifications, dummyActivity };
export { dummyEvents, eventTypes, eventStats };
export { dummyAddOns, addOnCategories, addOnStats };
export { dummyBeatBlooms, beatBloomCategories };

// Combined data for easy access
export const dummyData = {
  packages: dummyPackages,
  testimonials: dummyTestimonials,
  bookings: dummyBookings,
  events: dummyEvents,
  addOns: dummyAddOns,
  beatBlooms: dummyBeatBlooms,
  users: {
    user: dummyUser,
    vendor: dummyVendor,
    admin: dummyAdmin
  },
  stats: {
    packages: packageCategories.length,
    testimonials: testimonialStats.totalReviews,
    bookings: bookingStats.total,
    events: eventStats.total,
    addOns: addOnStats.total
  }
};
