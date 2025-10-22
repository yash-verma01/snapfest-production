import express from 'express';
import {
  getUserPayments,
  getPaymentById,
  createPayment,
  getPaymentStats,
  processPartialPayment,
  processFullPayment,
  confirmCashPayment,
  verifyPaymentOTP,
  createPartialPaymentOrder,
  createFullPaymentOrder,
  verifyPayment,
  processRefund,
  getRefundDetails
} from '../controllers/paymentController.js';
import { authenticate, vendorOnly } from '../middleware/auth.js';
import { validatePayment, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Basic payment routes
router.get('/', validatePagination, getUserPayments);
router.get('/stats', getPaymentStats);
router.get('/:id', getPaymentById);
router.post('/', validatePayment, createPayment);

// ==================== RAZORPAY PAYMENT INTEGRATION ====================

// @route   POST /api/payments/create-order/partial
// @desc    Create Razorpay order for partial payment (20%)
// @access  Private
router.post('/create-order/partial', createPartialPaymentOrder);

// @route   POST /api/payments/create-order/full
// @desc    Create Razorpay order for full payment (remaining 80%)
// @access  Private
router.post('/create-order/full', createFullPaymentOrder);

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post('/verify', verifyPayment);

// @route   POST /api/payments/refund
// @desc    Process refund
// @access  Private
router.post('/refund', processRefund);

// @route   GET /api/payments/refund/:refundId
// @desc    Get refund details
// @access  Private
router.get('/refund/:refundId', getRefundDetails);

// ==================== PAYMENT FLOW WITH OTP ====================

// @route   POST /api/payments/partial
// @desc    Process partial payment (20%) - Legacy method
// @access  Private
router.post('/partial', processPartialPayment);

// @route   POST /api/payments/full
// @desc    Process full payment (remaining 80%) - Legacy method
// @access  Private
router.post('/full', processFullPayment);

// @route   POST /api/payments/confirm-cash
// @desc    Confirm cash payment (Vendor)
// @access  Private/Vendor
router.post('/confirm-cash', vendorOnly, confirmCashPayment);

// @route   POST /api/payments/verify-otp
// @desc    Verify OTP for full payment (Vendor)
// @access  Private/Vendor
router.post('/verify-otp', vendorOnly, verifyPaymentOTP);

export default router;

