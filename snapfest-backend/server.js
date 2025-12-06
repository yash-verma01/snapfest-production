// ============================================
// CRITICAL: Load .env file FIRST before any other imports
// This ensures environment variables are available when modules are initialized
// ============================================
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory where server.js is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the same directory as server.js (snapfest-backend)
// MUST be done before importing any routes/controllers that use environment variables
const envResult = dotenv.config({ path: join(__dirname, '.env') });

// ============================================
// Now import everything else (after .env is loaded)
// ============================================
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import connectDB from './src/config/database.js';
import { initializeSocket } from './src/socket/socketServer.js';
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
import enquiryRoutes from './src/routes/enquiryRoutes.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import requestLogger, { enhancedRequestLogger, errorLogger } from './src/middleware/requestLogger.js';
import { logInfo, logError } from './src/config/logger.js';
import { clerkMiddleware } from '@clerk/express';
import { requireAdminClerk } from './src/middleware/requireAdminClerk.js';

// Single Clerk application configuration
// SECURITY: All keys must be in environment variables, never hardcoded!

const requiredKeys = [
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

// Use single Clerk application (fallback to user keys for backward compatibility)
// But NEVER use hardcoded fallback values in production
process.env.CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || 
                                     process.env.CLERK_PUBLISHABLE_KEY_USER;
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 
                                process.env.CLERK_SECRET_KEY_USER;

// Validate that keys are set
const missingKeys = requiredKeys.filter(key => !process.env[key]);

if (missingKeys.length > 0) {
  console.error('\n❌ CRITICAL ERROR: Missing Clerk keys!');
  console.error('   Required environment variables:');
  missingKeys.forEach(key => {
    console.error(`   - ${key}`);
  });
  console.error('\n   Please set these in your .env file:');
  console.error('   CLERK_PUBLISHABLE_KEY=pk_test_... or pk_live_...');
  console.error('   CLERK_SECRET_KEY=sk_test_... or sk_live_...');
  console.error('\n   Or use role-specific keys:');
  console.error('   CLERK_PUBLISHABLE_KEY_USER=pk_test_...');
  console.error('   CLERK_SECRET_KEY_USER=sk_test_...');
  process.exit(1);
}

// Log configuration (without exposing full keys)
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Single Clerk application configured');
  console.log(`   Publishable Key: ${process.env.CLERK_PUBLISHABLE_KEY.substring(0, 30)}...`);
} else {
  console.log('✅ Clerk application configured');
}

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

// Initialize Socket.io BEFORE connecting to database
initializeSocket(httpServer);

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

// Security middleware - Enhanced configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles (needed for some UI libraries)
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"], // Allow images from various sources
      connectSrc: ["'self'", "https://api.clerk.dev", "https://*.clerk.accounts.dev"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://checkout.razorpay.com"], // Allow Razorpay iframe
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility with some services
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'sameorigin' // Allow same-origin frames (needed for some features)
  },
  noSniff: true, // Prevent MIME type sniffing
  xssFilter: true, // Enable XSS filter
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// Rate limiting - Production-ready configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// General API rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Lower limit for production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only skip in development mode for localhost
    if (isDevelopment) {
      return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
    }
    return false; // Never skip in production
  },
  // Store rate limit info in response headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60) // seconds
    });
  }
}));

// CORS configuration - Explicitly allow credentials for cross-origin requests
// EXCLUDE /PUBLIC routes - they are handled separately below for static files
app.use((req, res, next) => {
  // Skip CORS for /PUBLIC routes - handled separately for static files
  // This prevents conflicts between credentials:true and Access-Control-Allow-Origin:*
  if (req.path.startsWith('/PUBLIC')) {
    return next();
  }
  
  // Apply CORS for all other routes (API routes that need credentials)
  cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) - but only in development
    if (!origin) {
      if (isDevelopment) {
        return callback(null, true);
      }
      // In production, reject requests without origin for security
      return callback(new Error('Origin header required'));
    }
    
    // Whitelist specific localhost ports for development
    if (isDevelopment && origin.startsWith('http://localhost:')) {
      const port = origin.split(':')[2]?.split('/')[0];
      const allowedLocalhostPorts = ['5173', '3000', '3001', '5174', '5175'];
      if (port && allowedLocalhostPorts.includes(port)) {
        return callback(null, true);
      }
      // Block other localhost ports
      if (isDevelopment) {
        console.log('⚠️ CORS: Blocked localhost port:', port);
      }
      return callback(new Error('Not allowed by CORS'));
    }
    
    // SECURITY: Remove file:// protocol support (security risk)
    // if (origin.startsWith('file://')) {
    //   return callback(null, true);
    // }
    
    // Allow specific production domains
    const allowedOrigins = [
      'https://snapfest-frontend.vercel.app',
      'https://snapfest.vercel.app',
      process.env.FRONTEND_URL // Allow from environment variable
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log the origin for debugging
    if (isDevelopment) {
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
  })(req, res, next);
});

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

// CORS middleware for static files - Custom middleware to ensure headers are set correctly
// This MUST run before express.static() to set CORS headers
app.use('/PUBLIC', (req, res, next) => {
  const origin = req.headers.origin;
  
  // Determine the allowed origin
  let allowedOrigin = '*';
  
  if (origin) {
    // Whitelist specific localhost ports for development
    if (isDevelopment && origin.startsWith('http://localhost:')) {
      const port = origin.split(':')[2]?.split('/')[0];
      const allowedLocalhostPorts = ['5173', '3000', '3001', '5174', '5175'];
      if (port && allowedLocalhostPorts.includes(port)) {
        allowedOrigin = origin;
      } else {
        // For other localhost ports, use wildcard in development only
        allowedOrigin = isDevelopment ? '*' : null;
      }
    }
    // Allow specific production domains
    else if (origin === 'https://snapfest-frontend.vercel.app' || 
             origin === 'https://snapfest.vercel.app' ||
             origin === process.env.FRONTEND_URL) {
      allowedOrigin = origin;
    }
    // For other origins in production, be more restrictive
    else if (!isDevelopment) {
      // In production, only allow known origins
      allowedOrigin = null;
    }
    // In development, allow all for static assets
    else {
      allowedOrigin = '*';
    }
  } else if (!isDevelopment) {
    // In production, require origin for static files too
    allowedOrigin = null;
  }
  
  // Set CORS headers explicitly
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // CRITICAL FIX: Override Helmet's Cross-Origin-Resource-Policy to allow cross-origin access
  // Helmet sets this to 'same-origin' by default, which blocks cross-origin image requests
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Static files - Serve PUBLIC folder for uploaded images
app.use('/PUBLIC', express.static('PUBLIC', {
  setHeaders: (res, path, stat) => {
    // Get origin from request (res.req is available in setHeaders)
    const origin = res.req?.headers?.origin;
    let allowedOrigin = '*';
    
    // Determine allowed origin based on request origin
    if (origin) {
      // Whitelist specific localhost ports for development
      if (isDevelopment && origin.startsWith('http://localhost:')) {
        const port = origin.split(':')[2]?.split('/')[0];
        const allowedLocalhostPorts = ['5173', '3000', '3001', '5174', '5175'];
        if (port && allowedLocalhostPorts.includes(port)) {
          allowedOrigin = origin; // Specific origin for localhost
        } else {
          allowedOrigin = isDevelopment ? '*' : null;
        }
      }
      // Allow specific production domains
      else if (origin === 'https://snapfest-frontend.vercel.app' || 
               origin === 'https://snapfest.vercel.app' ||
               origin === process.env.FRONTEND_URL) {
        allowedOrigin = origin; // Specific origin for production
      }
      // For other origins, be restrictive
      else {
        allowedOrigin = isDevelopment ? '*' : null;
      }
    }
    // If no origin header (common with <img> tags), use wildcard only in development
    else {
      allowedOrigin = isDevelopment ? '*' : null;
    }
    
    // Set CORS headers - CRITICAL: This runs when file is actually served
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // CRITICAL FIX: Override Helmet's Cross-Origin-Resource-Policy to allow cross-origin access
    // This ensures the header is set even if the middleware above didn't run
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set cache headers for images
    if (path.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    }
  }
}));

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
app.use('/api', enquiryRoutes);              // Enquiry routes (public + admin)

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

// Start server with HTTP server (for Socket.io)
httpServer.listen(PORT, () => {
  logInfo('SnapFest Backend Server started successfully', {
    port: PORT,
    healthCheck: `http://localhost:${PORT}/api/health`,
    environment: process.env.NODE_ENV || 'development',
    websocket: 'enabled'
  });
  
  console.log(`🚀 SnapFest Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Health check: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket enabled on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📝 Logs are being written to: ./logs/`);
});
