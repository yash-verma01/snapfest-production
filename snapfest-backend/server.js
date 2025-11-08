import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './src/config/database.js';
import userRoutes from './src/routes/userRoutes.js';
import vendorRoutes from './src/routes/vendorRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import adminAuthRoutes from './src/routes/adminAuthRoutes.js';
// Note: ensureAdminUserExists is no longer called - admins created via Clerk
import authRoutes from './src/routes/authRoutes.js';
import userAuthRoutes from './src/routes/userAuthRoutes.js';
import vendorAuthRoutes from './src/routes/vendorAuthRoutes.js';
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
import { requireAdminClerk } from './src/middleware/requireAdminClerk.js';

// Get the directory where server.js is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the same directory as server.js (snapfest-backend)
const envResult = dotenv.config({ path: join(__dirname, '.env') });

// Single Clerk application configuration
const requiredKeys = [
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

// Use single Clerk application (fallback to user keys for backward compatibility)
process.env.CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || 
                                     process.env.CLERK_PUBLISHABLE_KEY_USER || 
                                     'pk_test_c3RpcnJpbmctYnJlYW0tNDkuY2xlcmsuYWNjb3VudHMuZGV2JA';
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 
                                process.env.CLERK_SECRET_KEY_USER || 
                                'sk_test_8pcerRqj0saXidBCYyG0NDth2cwCvEASypUMdrGZqC';

// Validate that keys are set
const missingKeys = requiredKeys.filter(key => !process.env[key]);

if (missingKeys.length > 0) {
  console.error('\n❌ Error: Missing Clerk keys!');
  console.error('   Required: CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY');
  missingKeys.forEach(key => {
    console.error(`   - ${key}`);
  });
  process.exit(1);
}

console.log('✅ Single Clerk application configured');
console.log(`   Publishable Key: ${process.env.CLERK_PUBLISHABLE_KEY.substring(0, 30)}...`);

const app = express();
const PORT = process.env.PORT || 5001;

// Connect Database
connectDB();

// Note: Admin users are now created automatically via Clerk authentication
// Legacy password-based admin creation has been removed
// ensureAdminUserExists(); // Disabled - admins created via Clerk sign-up/sign-in

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

// CORS configuration - Explicitly allow credentials for cross-origin requests
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost ports for development (critical for cookie transmission)
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
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ CORS: Blocked origin:', origin);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // CRITICAL: Must be true for cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Clerk-Authorization',
    'Cookie',
    'Set-Cookie'
  ],
  exposedHeaders: ['Set-Cookie'], // Allow frontend to see Set-Cookie headers
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

// Cookie parser - needed to parse Clerk session cookies
app.use(cookieParser());

// Single Clerk middleware instance (no port-based routing needed)
const clerkMiddlewareInstance = clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Apply Clerk middleware to all routes
app.use(clerkMiddlewareInstance);

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
app.use('/api/auth/user', userAuthRoutes);   // User authentication API
app.use('/api/auth/vendor', vendorAuthRoutes); // Vendor authentication API
app.use('/api/auth/admin', adminAuthRoutes); // Admin authentication API
app.use('/api/users', userRoutes);           // User-specific routes
app.use('/api/vendors', vendorRoutes);       // Vendor-specific routes  
app.use('/api/admin', requireAdminClerk, adminRoutes); // Admin routes protected by Clerk publicMetadata.role
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

// Test route to verify Clerk session parsing
app.get('/api/test/clerk', async (req, res) => {
  try {
    const { getAuth } = await import('@clerk/express');
    const { createClerkClient } = await import('@clerk/clerk-sdk-node');
    
    const clerkAuth = getAuth(req);
    const hasSession = clerkAuth?.userId ? true : false;
    
    let userData = null;
    if (clerkAuth?.userId) {
      try {
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const user = await clerkClient.users.getUser(clerkAuth.userId);
        userData = {
          userId: user.id,
          email: user.emailAddresses?.[0]?.emailAddress || null,
          publicMetadata: user.publicMetadata || null,
          role: user.publicMetadata?.role || null,
        };
      } catch (apiError) {
        console.error('❌ Failed to fetch user from Clerk API:', apiError.message);
      }
    }
    
    res.json({
      success: true,
      hasSession,
      auth: {
        isAuthenticated: clerkAuth?.isAuthenticated || false,
        userId: clerkAuth?.userId || null,
        sessionId: clerkAuth?.sessionId || null,
        sessionClaims: clerkAuth?.sessionClaims ? Object.keys(clerkAuth.sessionClaims) : null,
      },
      cookies: {
        all: Object.keys(req.cookies || {}),
        hasSession: !!req.cookies.__session,
        sessionValue: req.cookies.__session ? req.cookies.__session.substring(0, 50) + '...' : null,
      },
      user: userData,
      headers: {
        cookie: req.headers.cookie ? 'present' : 'missing',
        origin: req.headers.origin,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
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
