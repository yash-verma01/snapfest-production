import express from 'express';
import {
  // User Management
  getAllUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
  toggleUserStatus,
  searchUsers,
  getUserStats,
  
  // Vendor Management
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  toggleVendorStatus,
  searchVendors,
  assignVendorToBooking,
  
  // Package Management
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus,
  getPackageStats,
  
  // Booking Management
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getBookingStats,
  
  // Payment Management
  getAllPayments,
  getPaymentById,
  verifyPayment,
  processRefund,
  getPaymentStats,
  
  // OTP Management
  getPendingOTPs,
  generateOTP,
  verifyOTP,
  generateBookingVerificationOTP,
  
  // Dashboard & Reports
  getDashboard,
  getAuditLogs,
  getSystemStats,
  
  // Settings Management
  getSettings,
  updateSettings,
  
  // Testimonial Management
  getAllTestimonials,
  approveTestimonial,
  rejectTestimonial,
  getTestimonialStats,
  
  // Email Management
  sendWelcomeEmail,
  sendActivationEmail,
  sendDeactivationEmail,
  sendCustomEmail,
  sendBulkEmail,
  getAdminProfile,
  updateAdminProfile
} from '../controllers/adminController.js';
import {
  // Beat & Bloom Management
  getAllBeatBloomsAdmin,
  getBeatBloomByIdAdmin,
  createBeatBloom,
  updateBeatBloom,
  deleteBeatBloom,
  toggleBeatBloomStatus,
  getBeatBloomStats,
  searchBeatBlooms
} from '../controllers/beatBloomController.js';
import {
  // Venue Management
  getAllVenuesAdmin,
  getVenueByIdAdmin,
  createVenue,
  updateVenue,
  deleteVenue,
  toggleVenueStatus,
  getVenueStats,
  searchVenues
} from '../controllers/venueController.js';
import {
  // Event Management
  getAllEventsAdmin,
  getEventByIdAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventStatus,
  getEventStats,
  searchEventsAdmin
} from '../controllers/eventControllerAdmin.js';
import { validatePagination, validateSearch, validateBeatBloom, validateBeatBloomUpdate, validateVenue, validateVenueUpdate } from '../middleware/validation.js';

const router = express.Router();

// NOTE: All routes in this router are protected by requireAdminClerk middleware
// which is applied at the router level in server.js
// The middleware checks Clerk's publicMetadata.role === 'admin' or ADMIN_EMAILS fallback
// Old authenticate + adminOnly middleware removed - protection handled at router level

// Test route to check if admin routes are working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Admin routes are working!',
    admin: req.admin || 'Not set',
    note: 'This route is protected by requireAdminClerk middleware'
  });
});

// NOTE: Admin login route moved to /api/admin/auth/login (see adminAuthRoutes.js)
// All routes below are protected by requireAdminClerk middleware (applied at router level)
// No need for authenticate/adminOnly on individual routes

// ==================== DASHBOARD ====================
router.get('/dashboard', getDashboard);
router.get('/stats', getSystemStats);
router.get('/audit-logs', validatePagination, getAuditLogs);

// ==================== USER MANAGEMENT ====================
router.get('/users', validatePagination, getAllUsers);
router.get('/users/search', validateSearch, searchUsers);
router.get('/users/stats', getUserStats);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUserById);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUserById);

// ==================== VENDOR MANAGEMENT ====================
router.get('/vendors', validatePagination, getAllVendors);
router.get('/vendors/search', validateSearch, searchVendors);
router.get('/vendors/:id', getVendorById);
router.post('/vendors', createVendor);
router.put('/vendors/:id', updateVendor);
router.put('/vendors/:id/toggle-status', toggleVendorStatus);
router.delete('/vendors/:id', deleteVendor);

// ==================== PACKAGE MANAGEMENT ====================
router.get('/packages', validatePagination, getAllPackages);
router.get('/packages/stats', getPackageStats);
router.get('/packages/:id', getPackageById);
router.post('/packages', createPackage);
router.put('/packages/:id', updatePackage);
router.put('/packages/:id/toggle-status', togglePackageStatus);
router.delete('/packages/:id', deletePackage);

// ==================== BOOKING MANAGEMENT ====================
router.get('/bookings', validatePagination, getAllBookings);
router.get('/bookings/stats', getBookingStats);
router.get('/bookings/:id', getBookingById);
router.put('/bookings/:id/status', updateBookingStatus);
router.put('/bookings/:id/cancel', cancelBooking);
router.post('/bookings/:id/assign-vendor', assignVendorToBooking);
router.post('/bookings/:id/generate-otp', generateBookingVerificationOTP);

// ==================== PAYMENT MANAGEMENT ====================
router.get('/payments', validatePagination, getAllPayments);
router.get('/payments/stats', getPaymentStats);
router.get('/payments/:id', getPaymentById);
router.post('/payments/:id/verify', verifyPayment);
router.post('/payments/:id/refund', processRefund);

// ==================== OTP MANAGEMENT ====================
router.get('/otp/pending', getPendingOTPs);
router.post('/otp/generate', generateOTP);
router.post('/otp/verify', verifyOTP);

// ==================== EVENT MANAGEMENT ====================
router.get('/events', validatePagination, getAllEventsAdmin);
router.get('/events/stats', getEventStats);
router.get('/events/search', validateSearch, searchEventsAdmin);
router.get('/events/:id', getEventByIdAdmin);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.put('/events/:id/toggle-status', toggleEventStatus);
router.delete('/events/:id', deleteEvent);

// ==================== BEAT & BLOOM MANAGEMENT ====================
router.get('/beatbloom', validatePagination, getAllBeatBloomsAdmin);
router.get('/beatbloom/stats', getBeatBloomStats);
router.get('/beatbloom/search', validateSearch, searchBeatBlooms);
router.get('/beatbloom/:id', getBeatBloomByIdAdmin);
router.post('/beatbloom', validateBeatBloom, createBeatBloom);
router.put('/beatbloom/:id', validateBeatBloomUpdate, updateBeatBloom);
router.put('/beatbloom/:id/toggle-status', toggleBeatBloomStatus);
router.delete('/beatbloom/:id', deleteBeatBloom);

// ==================== VENUE MANAGEMENT ====================
router.get('/venues', validatePagination, getAllVenuesAdmin);
router.get('/venues/stats', getVenueStats);
router.get('/venues/search', validateSearch, searchVenues);
router.get('/venues/:id', getVenueByIdAdmin);
router.post('/venues', validateVenue, createVenue);
router.put('/venues/:id', validateVenueUpdate, updateVenue);
router.put('/venues/:id/toggle-status', toggleVenueStatus);
router.delete('/venues/:id', deleteVenue);

// ==================== SETTINGS MANAGEMENT ====================
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// ==================== TESTIMONIAL MANAGEMENT ====================
router.get('/testimonials', validatePagination, getAllTestimonials);
router.get('/testimonials/stats', getTestimonialStats);
router.put('/testimonials/:id/approve', approveTestimonial);
router.put('/testimonials/:id/reject', rejectTestimonial);

// ==================== EMAIL MANAGEMENT ====================
router.post('/email/welcome', sendWelcomeEmail);
router.post('/email/activate', sendActivationEmail);
router.post('/email/deactivate', sendDeactivationEmail);
router.post('/email/custom', sendCustomEmail);
router.post('/email/bulk', sendBulkEmail);

// ==================== ADMIN PROFILE MANAGEMENT ====================
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

export default router;



