import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartStats
} from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';
import { validateCartItem } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Cart management routes
router.get('/', getCart);
router.get('/stats', getCartStats);
router.post('/', validateCartItem, addToCart);
router.put('/:itemId', validateCartItem, updateCartItem);
router.delete('/:itemId', removeFromCart);
router.delete('/', clearCart);

export default router;






