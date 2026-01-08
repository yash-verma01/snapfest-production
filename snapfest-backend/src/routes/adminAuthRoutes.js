import express from 'express';
import { adminAuth } from '../controllers/roleAuthController.js';
import { requireAdminRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * Admin Authentication Routes
 * Uses CLERK_SECRET_KEY_ADMIN
 * Base path: /api/auth/admin
 */

// Check Clerk role FIRST (publicMetadata.role === 'admin'), then authenticate
router.use(requireAdminRole);

// Get current admin
router.get('/me', adminAuth.getMe);

// Validate admin session
router.get('/validate', adminAuth.validate);

// Get admin session info
router.get('/session', adminAuth.getSession);

export default router;
