import express from 'express';
import {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  respondToEnquiry,
  getEnquiryStats
} from '../controllers/enquiryController.js';
import { optionalAuth } from '../middleware/auth.js';
import { requireAdminClerk } from '../middleware/requireAdminClerk.js';

const router = express.Router();

// Public route (optional auth - if logged in, use their email)
router.post('/enquiries', optionalAuth, createEnquiry);

// Admin routes
router.get('/admin/enquiries', requireAdminClerk, getAllEnquiries);
router.get('/admin/enquiries/stats', requireAdminClerk, getEnquiryStats);
router.get('/admin/enquiries/:id', requireAdminClerk, getEnquiryById);
router.put('/admin/enquiries/:id/status', requireAdminClerk, updateEnquiryStatus);
router.post('/admin/enquiries/:id/respond', requireAdminClerk, respondToEnquiry);

export default router;

