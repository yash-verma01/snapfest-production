import express from 'express';
import {
  // Vendor Authentication & Profile
  registerVendor,
  loginVendor,
  getVendorProfile,
  updateVendorProfile,
  changeVendorPassword,
  logoutVendor,
  
  // Vendor Dashboard & Analytics
  getVendorDashboard,
  getVendorStats,
  getVendorPerformance,
  
  // Booking Management
  getVendorBookings,
  getVendorBookingById,
  getAssignedBookings,
  updateBookingStatus,
  startBooking,
  completeBooking,
  cancelBooking,
  acceptBooking,
  rejectBooking,
  
  // OTP Verification System
  getPendingOTPs,
  verifyOTP,
  getOTPHistory,
  requestNewOTP,
  getOTPById,
  verifySpecificOTP,
  
  // Payment Management
  confirmCashPayment,
  getPendingPayments,
  verifyPaymentCompletion,
  processPayment,
  getVendorPayments,
  getPaymentById,
  
  // Availability & Settings
  getVendorAvailability,
  updateVendorAvailability,
  toggleVendorActive,
  getVendorSettings,
  updateVendorSettings,
  
  // Notifications & Communication
  getVendorNotifications,
  markNotificationRead,
  getVendorMessages,
  sendMessageToAdmin,
  
  // Earnings & Payouts
  getVendorEarnings,
  getMonthlyEarnings,
  getPayoutHistory,
  getPendingPayouts,
  requestPayout,
  
  // Workflow Management
  getPreparationTasks,
  completeTask,
  getEventChecklist,
  startEventExecution,
  completeEvent,
  reportIssues
} from '../controllers/vendorController.js';
import { authenticate, vendorOnly } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.post('/register', registerVendor);
router.post('/login', loginVendor);

// ==================== PROTECTED ROUTES ====================
router.use(authenticate);
router.use(vendorOnly);

// ==================== PROFILE MANAGEMENT ====================
router.get('/profile', getVendorProfile);
router.put('/profile', updateVendorProfile);
router.put('/change-password', changeVendorPassword);
router.post('/logout', logoutVendor);

// ==================== DASHBOARD & ANALYTICS ====================
router.get('/dashboard', getVendorDashboard);
router.get('/stats', getVendorStats);
router.get('/performance', getVendorPerformance);

// ==================== BOOKING MANAGEMENT ====================
router.get('/bookings', validatePagination, getVendorBookings);
router.get('/bookings/assigned', validatePagination, getAssignedBookings);
router.get('/bookings/:id', getVendorBookingById);
router.put('/bookings/:id/status', updateBookingStatus);
router.put('/bookings/:id/start', startBooking);
router.put('/bookings/:id/complete', completeBooking);
router.put('/bookings/:id/cancel', cancelBooking);

// ==================== OTP VERIFICATION SYSTEM ====================
router.get('/otps/pending', getPendingOTPs);
router.post('/verify-otp', verifyOTP);
router.get('/otp/history', getOTPHistory);
router.post('/otp/request', requestNewOTP);

// ==================== PAYMENT MANAGEMENT ====================
router.post('/payments/cash-confirm', confirmCashPayment);
router.get('/payments/pending', getPendingPayments);
router.put('/payments/:id/verify', verifyPaymentCompletion);

// ==================== AVAILABILITY & SETTINGS ====================
router.get('/availability', getVendorAvailability);
router.put('/availability', updateVendorAvailability);
router.put('/toggle-active', toggleVendorActive);
router.get('/settings', getVendorSettings);
router.put('/settings', updateVendorSettings);

// ==================== NOTIFICATIONS & COMMUNICATION ====================
router.get('/notifications', getVendorNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/messages', getVendorMessages);
router.post('/messages', sendMessageToAdmin);

// ==================== EARNINGS & PAYOUTS ====================
router.get('/earnings', getVendorEarnings);
router.get('/earnings/monthly', getMonthlyEarnings);
router.get('/payouts', getPayoutHistory);
router.get('/payouts/pending', getPendingPayouts);
router.post('/payouts/request', requestPayout);

// ==================== WORKFLOW MANAGEMENT ====================
router.get('/preparation', getPreparationTasks);
router.post('/preparation/:id/complete', completeTask);
router.get('/checklist', getEventChecklist);
router.post('/events/:id/start', startEventExecution);
router.post('/events/:id/complete', completeEvent);
router.post('/events/:id/issues', reportIssues);

// ==================== ADDITIONAL MISSING ENDPOINTS ====================

// Additional OTP Management
router.get('/otps/:id', getOTPById);
router.post('/otps/:id/verify', verifySpecificOTP);

// Additional Payment Management
router.post('/process-payment', processPayment);
router.get('/payments', getVendorPayments);
router.get('/payments/:id', getPaymentById);

// Additional Booking Management
router.put('/bookings/:id/accept', acceptBooking);
router.put('/bookings/:id/reject', rejectBooking);

export default router;
