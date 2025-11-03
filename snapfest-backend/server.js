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
import { requireAdminClerk } from './src/middleware/requireAdminClerk.js';

// Get the directory where server.js is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the same directory as server.js (snapfest-backend)
const envResult = dotenv.config({ path: join(__dirname, '.env') });

// Define required keys first (before using them in debug output)
const requiredKeys = [
  'CLERK_PUBLISHABLE_KEY_USER',
  'CLERK_SECRET_KEY_USER',
  'CLERK_PUBLISHABLE_KEY_VENDOR',
  'CLERK_SECRET_KEY_VENDOR',
  'CLERK_PUBLISHABLE_KEY_ADMIN',
  'CLERK_SECRET_KEY_ADMIN'
];

// HARDCODE Clerk keys directly (as requested - for development/testing)
// TODO: Move these to .env file for production
process.env.CLERK_PUBLISHABLE_KEY_USER = 'pk_test_c3RpcnJpbmctYnJlYW0tNDkuY2xlcmsuYWNjb3VudHMuZGV2JA';
process.env.CLERK_SECRET_KEY_USER = 'sk_test_8pcerRqj0saXidBCYyG0NDth2cwCvEASypUMdrGZqC';
process.env.CLERK_PUBLISHABLE_KEY_VENDOR = 'pk_test_c3Ryb25nLWJsdWViaXJkLTc5LmNsZXJrLmFjY291bnRzLmRldiQ';
process.env.CLERK_SECRET_KEY_VENDOR = 'sk_test_sAefFSVOUmWVzYUUPPCVAx1u4E7cZCBjH31GbZHB9a';
process.env.CLERK_PUBLISHABLE_KEY_ADMIN = 'pk_test_Z3JhdGVmdWwtZ2xvd3dvcm0tMjUuY2xlcmsuYWNjb3VudHMuZGV2JA';
process.env.CLERK_SECRET_KEY_ADMIN = 'sk_test_n1CurKKSuqtjqpEPxGG8XRN7Q8rLtDNbxo8c4Tp7r2';

console.log('✅ Clerk keys loaded directly (hardcoded for development)');
console.log(`   User Portal: ${process.env.CLERK_PUBLISHABLE_KEY_USER.substring(0, 30)}...`);
console.log(`   Vendor Portal: ${process.env.CLERK_PUBLISHABLE_KEY_VENDOR.substring(0, 30)}...`);
console.log(`   Admin Portal: ${process.env.CLERK_PUBLISHABLE_KEY_ADMIN.substring(0, 30)}...`);

// Validate that all keys are set (they should be since we hardcoded them)
const missingKeys = requiredKeys.filter(key => !process.env[key]);

if (missingKeys.length > 0) {
  console.error('\n❌ Error: Missing Clerk keys even after hardcoding!');
  missingKeys.forEach(key => {
    console.error(`   - ${key}`);
  });
  process.exit(1);
}

// All keys are present - session isolation enabled
console.log('✅ All Clerk keys loaded successfully (User, Vendor, Admin - separate applications)');
console.log('✅ Session isolation enabled - each portal uses its own Clerk application');

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

// ============================================================================
// COOKIE ISOLATION MIDDLEWARE - Fixes Issue #1: Cookie Domain Sharing
// ============================================================================
// Since cookies are domain-scoped (not port-scoped), all portals on localhost
// share the same cookies. This middleware isolates cookies per portal by:
// 1. Renaming cookies based on origin (__session_user, __session_vendor, __session_admin)
// 2. Temporarily mapping to __session for Clerk middleware to process
// 3. Ensuring responses set portal-specific cookie names
// ============================================================================

app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || '';
  
  // Determine portal type based on origin
  let portalType = 'user'; // default
  let cookiePrefix = '__session_user';
  
  if (origin.includes('localhost:3001') || origin.includes(':3001')) {
    portalType = 'vendor';
    cookiePrefix = '__session_vendor';
  } else if (origin.includes('localhost:3002') || origin.includes(':3002')) {
    portalType = 'admin';
    cookiePrefix = '__session_admin';
  } else if (origin.includes('localhost:3000') || origin.includes(':3000')) {
    portalType = 'user';
    cookiePrefix = '__session_user';
  }
  
  // Store portal info in request for later use
  req._portalType = portalType;
  req._cookiePrefix = cookiePrefix;
  
  // Intercept and rename cookies BEFORE Clerk middleware processes them
  if (req.cookies) {
    // Look for portal-specific cookie first
    let portalCookie = req.cookies[cookiePrefix];
    
    // If portal-specific cookie doesn't exist, check for generic __session
    // and migrate it to portal-specific name
    if (!portalCookie && req.cookies.__session) {
      portalCookie = req.cookies.__session;
      // Rename in req.cookies for this request
      delete req.cookies.__session;
      req.cookies[cookiePrefix] = portalCookie;
      
      // Also update the cookie header string if it exists
      if (req.headers.cookie) {
        req.headers.cookie = req.headers.cookie.replace(
          /__session=([^;]+)/g,
          `${cookiePrefix}=$1`
        );
      }
    }
    
    // Now map portal-specific cookie to __session for Clerk middleware
    if (portalCookie && !req.cookies.__session) {
      req.cookies.__session = portalCookie;
    }
    
    // Filter out cookies from other portals to prevent interference
    const otherPortals = ['__session_user', '__session_vendor', '__session_admin'].filter(
      prefix => prefix !== cookiePrefix
    );
    otherPortals.forEach(prefix => {
      if (req.cookies[prefix]) {
        delete req.cookies[prefix];
      }
    });
  }
  
  // Intercept Set-Cookie headers in responses to rename cookies back to portal-specific names
  // This handles cookies set via res.setHeader('Set-Cookie', ...)
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = function(name, value) {
    if (name.toLowerCase() === 'set-cookie') {
      // Convert to array if single value
      const cookies = Array.isArray(value) ? value : [value];
      
      // Rename __session cookie to portal-specific name in responses
      const renamedCookies = cookies.map(cookie => {
        if (typeof cookie !== 'string') return cookie;
        
        // Handle __session=value (base session cookie)
        if (cookie.startsWith('__session=')) {
          return cookie.replace(/^__session=/, `${cookiePrefix}=`);
        }
        
        // Handle __session_instanceId=value (Clerk instance-specific cookies)
        if (cookie.startsWith('__session_')) {
          // Extract instance ID if present (e.g., __session_abc123=value)
          const match = cookie.match(/^__session(_[^=]+)?=(.+)$/);
          if (match) {
            const instanceId = match[1] || ''; // e.g., "_abc123" or ""
            const rest = match[2]; // The rest of the cookie string (value, attributes, etc.)
            return `${cookiePrefix}${instanceId}=${rest}`;
          }
        }
        
        // Handle cookies that contain __session in the middle (shouldn't happen, but safe)
        if (cookie.includes('__session') && !cookie.includes(cookiePrefix)) {
          return cookie.replace(/__session([^=;]*)/g, `${cookiePrefix}$1`);
        }
        
        return cookie;
      });
      
      return originalSetHeader('set-cookie', renamedCookies);
    }
    return originalSetHeader(name, value);
  };
  
  // Also intercept res.cookie() method to rename cookies
  const originalCookie = res.cookie.bind(res);
  res.cookie = function(name, value, options) {
    // If Clerk is setting a __session cookie, rename it to portal-specific name
    if (name === '__session' || name.startsWith('__session_')) {
      const newName = name.replace(/^__session(_.*)?$/, `${cookiePrefix}$1`);
      return originalCookie(newName, value, options);
    }
    return originalCookie(name, value, options);
  };
  
  // Intercept res.end() to catch any cookies set during the response
  const originalEnd = res.end.bind(res);
  res.end = function(chunk, encoding) {
    // Get current Set-Cookie headers and rename them
    const setCookieHeaders = res.getHeader('set-cookie');
    if (setCookieHeaders) {
      const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
      const renamedCookies = cookies.map(cookie => {
        if (typeof cookie !== 'string') return cookie;
        
        // Handle __session=value
        if (cookie.startsWith('__session=')) {
          return cookie.replace(/^__session=/, `${cookiePrefix}=`);
        }
        
        // Handle __session_instanceId=value
        if (cookie.startsWith('__session_')) {
          const match = cookie.match(/^__session(_[^=]+)?=(.+)$/);
          if (match) {
            const instanceId = match[1] || '';
            const rest = match[2];
            return `${cookiePrefix}${instanceId}=${rest}`;
          }
        }
        
        return cookie;
      });
      res.removeHeader('set-cookie');
      res.setHeader('set-cookie', renamedCookies);
    }
    return originalEnd(chunk, encoding);
  };
  
  next();
});

// DEBUG: Enhanced Cookie debugging middleware
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log('🍪 Cookie Isolation Debug:', {
        path: req.path,
        origin: req.headers.origin,
        portalType: req._portalType,
        cookiePrefix: req._cookiePrefix,
        cookies: Object.keys(req.cookies || {}),
        hasGenericSession: !!req.cookies.__session,
        hasPortalSession: !!req.cookies[req._cookiePrefix],
        cookieHeader: req.headers.cookie ? 'present' : 'missing',
      });
    }
    next();
  });
}

// Create separate Clerk middleware instances for each portal
// This ensures complete session isolation between User, Vendor, and Admin portals
const userClerkMiddleware = clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY_USER,
  secretKey: process.env.CLERK_SECRET_KEY_USER,
});

const vendorClerkMiddleware = clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY_VENDOR,
  secretKey: process.env.CLERK_SECRET_KEY_VENDOR,
});

const adminClerkMiddleware = clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY_ADMIN,
  secretKey: process.env.CLERK_SECRET_KEY_ADMIN,
});

// Custom middleware to route requests to the correct Clerk middleware based on origin
// This ensures each portal uses its own Clerk application and session cookies
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || '';
  
  // Determine which portal this request came from based on origin
  if (origin.includes('localhost:3000') || origin.includes(':3000')) {
    // User portal - use User Clerk app
    return userClerkMiddleware(req, res, next);
  } else if (origin.includes('localhost:3001') || origin.includes(':3001')) {
    // Vendor portal - use Vendor Clerk app
    return vendorClerkMiddleware(req, res, next);
  } else if (origin.includes('localhost:3002') || origin.includes(':3002')) {
    // Admin portal - use Admin Clerk app
    return adminClerkMiddleware(req, res, next);
  } else {
    // Default fallback: Try user portal for requests without origin header
    // This handles direct API calls or requests without origin
    return userClerkMiddleware(req, res, next);
  }
});

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
    const { clerkClient } = await import('@clerk/clerk-sdk-node');
    
    const clerkAuth = getAuth(req);
    const hasSession = clerkAuth?.userId ? true : false;
    
    let userData = null;
    if (clerkAuth?.userId) {
      try {
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

