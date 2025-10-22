import express from 'express';
import {
  register,
  login,
  getMe,
  logout
} from '../controllers/authController.js';
import { authenticate, authRateLimit } from '../middleware/auth.js';
import {
  validateUserRegistration,
  validateUserLogin
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', authRateLimit, validateUserRegistration, register);
router.post('/login', authRateLimit, validateUserLogin, login);

// Protected routes
router.use(authenticate);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;
