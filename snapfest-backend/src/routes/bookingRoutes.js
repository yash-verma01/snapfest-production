import express from 'express';
import {
  getUserBookings,
  getBookingById,
  createBooking,
  cancelBooking,
  getBookingStats
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBooking, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User booking routes
router.get('/', validatePagination, getUserBookings);
router.get('/stats', getBookingStats);
router.get('/:id', getBookingById);
router.post('/', validateBooking, createBooking);
router.put('/:id/cancel', cancelBooking);

export default router;






