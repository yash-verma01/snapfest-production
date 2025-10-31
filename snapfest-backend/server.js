import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import userRoutes from './src/routes/userRoutes.js';
import vendorRoutes from './src/routes/vendorRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import adminAuthRoutes, { ensureAdminUserExists } from './src/routes/adminAuthRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import publicRoutes from './src/routes/publicRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import webhookRoutes from './src/routes/webhookRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import requestLogger, { enhancedRequestLogger, errorLogger } from './src/middleware/requestLogger.js';
import { logInfo, logError } from './src/config/logger.js';
import { clerkMiddleware } from '@clerk/express';

dotenv.config();

// Validate Clerk environment variables (required for cookie-based authentication)
if (!process.env.CLERK_PUBLISHABLE_KEY) {
  console.error('❌ CLERK_PUBLISHABLE_KEY is missing in .env file!');
  console.error('   Please add: CLERK_PUBLISHABLE_KEY=pk_test_...');
  process.exit(1);
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY is missing in .env file!');
  console.error('   Please add: CLERK_SECRET_KEY=sk_test_...');
  process.exit(1);
}

console.log('✅ Clerk keys loaded successfully');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect Database
connectDB();

// Ensure admin user exists
ensureAdminUserExists();

// Log server startup
logInfo('SnapFest Backend Server starting...', {
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version
});

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Clerk-Authorization']
}));

// Clerk middleware - parses session from HTTP-only cookies automatically
// This replaces the JWT token flow: authentication now comes from secure session cookies
// Frontend no longer needs to call getToken() or send Authorization headers
app.use(clerkMiddleware());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(enhancedRequestLogger);
app.use(requestLogger);

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

// Error logging middleware
app.use(errorLogger);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logInfo('SnapFest Backend Server started successfully', {
    port: PORT,
    healthCheck: `http://localhost:${PORT}/api/health`,
    environment: process.env.NODE_ENV || 'development'
  });
  
  console.log(`🚀 SnapFest Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Health check: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📝 Logs are being written to: ./logs/`);
});

