import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getUserDashboard,
  getUpcomingBookings,
  getBookingHistory,
  getUserPayments,
  getUserReviews,
  createUserReview,
  getUserNotifications,
  getUserActivity,
  forgotPassword,
  resetPassword,
  getSearchHistory,
  saveSearch,
  getUserStats,
  updateBookingStatus,
  getBookingInvoice,
  getBookingDetails,
  submitSupportRequest,
  addTestimonial,
  getUserTestimonials,
  sendEmailVerification,
  verifyEmail
  , syncClerkUser
} from '../controllers/userController.js';
import { authenticate, optionalAuth, authRateLimit } from '../middleware/auth.js';
import {
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateReview,
  validateForgotPassword,
  validateResetPassword,
  validateSearchSave,
  validateBookingStatus
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', authRateLimit, validateUserRegistration, register);
router.post('/login', authRateLimit, validateUserLogin, login);
router.post('/forgot-password', authRateLimit, validateForgotPassword, forgotPassword);
router.post('/reset-password', authRateLimit, validateResetPassword, resetPassword);
router.post('/verify-email', verifyEmail);

// Clerk sync route - needs to be BEFORE authenticate middleware
// This route handles the initial user sync when Clerk session might not be fully established
// It uses optionalAuth which doesn't fail if session isn't available yet
router.post('/sync', optionalAuth, syncClerkUser);

// Protected routes (require authentication)
router.use(authenticate);

// The next line ensures the module import tree is updated to include syncClerkUser
// Profile management
router.get('/profile', getProfile);
router.put('/profile', validateProfileUpdate, updateProfile);
router.put('/change-password', validatePasswordChange, changePassword);
router.post('/logout', logout);

// Dashboard & Statistics
router.get('/dashboard', getUserDashboard);
router.get('/stats', getUserStats);

// Booking management
router.get('/bookings/upcoming', getUpcomingBookings);
router.get('/bookings/history', getBookingHistory);
router.get('/bookings/:id/details', getBookingDetails);
router.get('/bookings/:id/invoice', getBookingInvoice);
router.put('/bookings/:id/status', validateBookingStatus, updateBookingStatus);

// Support
router.post('/support', submitSupportRequest);

// Payment history
router.get('/payments', getUserPayments);

// Reviews
router.get('/reviews', getUserReviews);
router.post('/reviews', validateReview, createUserReview);

// Testimonials
router.post('/testimonial', addTestimonial);
router.get('/testimonials', getUserTestimonials);

// Email verification
router.post('/send-email-verification', authenticate, sendEmailVerification);

// Notifications & Activity
router.get('/notifications', getUserNotifications);
router.get('/activity', getUserActivity);

// Search & Preferences
router.get('/search-history', getSearchHistory);
router.post('/save-search', validateSearchSave, saveSearch);

export default router;
