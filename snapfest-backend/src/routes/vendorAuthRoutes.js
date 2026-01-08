import express from 'express';
import { vendorAuth } from '../controllers/roleAuthController.js';
import { requireVendorRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * Vendor Authentication Routes
 * Uses CLERK_SECRET_KEY_VENDOR
 * Base path: /api/auth/vendor
 */

// Check Clerk role FIRST (publicMetadata.role === 'vendor'), then authenticate
router.use(requireVendorRole);

// Get current vendor
router.get('/me', vendorAuth.getMe);

// Validate vendor session
router.get('/validate', vendorAuth.validate);

// Get vendor session info
router.get('/session', vendorAuth.getSession);

export default router;

