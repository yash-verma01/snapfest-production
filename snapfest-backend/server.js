import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import userRoutes from './src/routes/userRoutes.js';
import vendorRoutes from './src/routes/vendorRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import adminAuthRoutes from './src/routes/adminAuthRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import publicRoutes from './src/routes/publicRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import webhookRoutes from './src/routes/webhookRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect Database
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting - Very lenient for development
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP - very high for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
  }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost ports for development
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Allow file:// protocol for local testing
    if (origin.startsWith('file://')) {
      return callback(null, true);
    }
    
    // Allow specific production domains
    const allowedOrigins = [
      'https://snapfest-frontend.vercel.app',
      'https://snapfest.vercel.app'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log the origin for debugging
    console.log('CORS: Blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// API Routes - Organized by Role
app.use('/api/auth', authRoutes);            // Authentication routes (register, login, logout)
app.use('/api/users', userRoutes);           // User-specific routes
app.use('/api/vendors', vendorRoutes);       // Vendor-specific routes  
app.use('/api/admin/auth', adminAuthRoutes); // Admin authentication routes (no auth required)
app.use('/api/admin', adminRoutes);          // Admin-specific routes
app.use('/api', publicRoutes);               // Public routes (packages, events, search)
app.use('/api/cart', cartRoutes);            // User cart management
app.use('/api/payments', paymentRoutes);     // User payment management
app.use('/api/bookings', bookingRoutes);     // User booking management
app.use('/api/upload', uploadRoutes);        // Image upload routes
app.use('/api/webhooks', webhookRoutes);     // Webhook routes (Razorpay)

// Health check routes
app.get(['/api/health', '/'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SnapFest Backend Server is running!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SnapFest Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Health check: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

