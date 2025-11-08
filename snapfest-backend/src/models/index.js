// Export all models - Simple and Clean
// Note: Vendor and Admin collections removed - all users now use User collection with role field
export { default as User } from './User.js';
export { default as Package } from './Package.js';
export { default as Booking } from './Booking.js';
export { default as Payment } from './Payment.js';
export { default as OTP } from './OTP.js';
export { default as Cart } from './Cart.js';
export { default as Review } from './Review.js';
export { default as Event } from './Event.js';
export { default as Venue } from './Venue.js';
export { default as BeatBloom } from './BeatBloom.js';
export { default as AuditLog } from './AuditLog.js';

// Export all models as default
import User from './User.js';
import Package from './Package.js';
import Booking from './Booking.js';
import Payment from './Payment.js';
import OTP from './OTP.js';
import Cart from './Cart.js';
import Review from './Review.js';
import Event from './Event.js';
import Venue from './Venue.js';
import BeatBloom from './BeatBloom.js';
import AuditLog from './AuditLog.js';

export default {
  User,
  Package,
  Booking,
  Payment,
  OTP,
  Cart,
  Review,
  Event,
  Venue,
  BeatBloom,
  AuditLog
};
