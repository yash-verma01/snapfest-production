import express from 'express';
import { userAuth } from '../controllers/roleAuthController.js';
import { requireUserRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * User Authentication Routes
 * Uses CLERK_SECRET_KEY_USER
 * Base path: /api/auth/user
 */

// Check Clerk role FIRST (publicMetadata.role === 'user'), then authenticate
router.use(requireUserRole);

// Get current user
router.get('/me', userAuth.getMe);

// Validate user session
router.get('/validate', userAuth.validate);

// Get user session info
router.get('/session', userAuth.getSession);

export default router;

