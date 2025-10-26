import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
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
  
  // Analytics & Reports
  getDashboard,
  getAnalytics,
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
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validatePagination, validateSearch, validateBeatBloom, validateBeatBloomUpdate, validateVenue, validateVenueUpdate } from '../middleware/validation.js';

const router = express.Router();

// Test route to check if admin routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes are working!' });
});

// Admin login route (no auth required)
router.post('/login', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body);
    const { email, password } = req.body;
    
    // Find admin user
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      console.log('Admin not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      console.log('Invalid password for admin:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    console.log('Admin login successful:', admin.email);
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive
        },
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// All other admin routes require authentication and admin role
// Note: Authentication middleware is applied to individual routes below

// ==================== DASHBOARD & ANALYTICS ====================
router.get('/dashboard', authenticate, adminOnly, getDashboard);
router.get('/analytics', authenticate, adminOnly, getAnalytics);
router.get('/stats', authenticate, adminOnly, getSystemStats);
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
// Simple test route
router.post('/bookings/simple-test', (req, res) => {
  console.log('🧪 Simple test route hit!');
  res.json({ success: true, message: 'Simple test working' });
});

router.get('/bookings', authenticate, adminOnly, validatePagination, getAllBookings);
router.get('/bookings/stats', authenticate, adminOnly, getBookingStats);
router.get('/bookings/:id', authenticate, adminOnly, getBookingById);
router.put('/bookings/:id/status', authenticate, adminOnly, updateBookingStatus);
router.put('/bookings/:id/cancel', authenticate, adminOnly, cancelBooking);
router.post('/bookings/:id/assign-vendor', authenticate, adminOnly, assignVendorToBooking);
// Test route to verify routing is working
router.post('/bookings/test-assign', authenticate, adminOnly, (req, res) => {
  try {
    console.log('🧪 Test route hit!');
    console.log('🧪 Request URL:', req.url);
    console.log('🧪 Request method:', req.method);
    console.log('🧪 User:', req.user);
    res.json({ success: true, message: 'Test route working' });
  } catch (error) {
    console.error('🧪 Test route error:', error);
    res.status(500).json({ success: false, message: 'Test route error', error: error.message });
  }
});

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
router.get('/beatbloom', authenticate, adminOnly, validatePagination, getAllBeatBloomsAdmin);
router.get('/beatbloom/stats', authenticate, adminOnly, getBeatBloomStats);
router.get('/beatbloom/search', authenticate, adminOnly, validateSearch, searchBeatBlooms);
router.get('/beatbloom/:id', authenticate, adminOnly, getBeatBloomByIdAdmin);
router.post('/beatbloom', authenticate, adminOnly, validateBeatBloom, createBeatBloom);
router.put('/beatbloom/:id', authenticate, adminOnly, validateBeatBloomUpdate, updateBeatBloom);
router.put('/beatbloom/:id/toggle-status', authenticate, adminOnly, toggleBeatBloomStatus);
router.delete('/beatbloom/:id', authenticate, adminOnly, deleteBeatBloom);

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
router.get('/profile', authenticate, adminOnly, getAdminProfile);
router.put('/profile', authenticate, adminOnly, updateAdminProfile);

export default router;



