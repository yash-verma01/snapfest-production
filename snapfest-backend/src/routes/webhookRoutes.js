import express from 'express';
import { handleRazorpayWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// ==================== WEBHOOK ROUTES ====================

// @route   POST /api/webhooks/razorpay
// @desc    Handle Razorpay webhooks
// @access  Public (webhook)
router.post('/razorpay', handleRazorpayWebhook);

export default router;





