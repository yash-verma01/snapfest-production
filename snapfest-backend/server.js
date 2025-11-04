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
  // CRITICAL: Handle cookies in both req.cookies (parsed) and req.headers.cookie (raw string)
  
  // Step 1: Filter cookie header string FIRST (before cookieParser creates req.cookies)
  // CRITICAL: Allow one-time migration of generic __session to portal-specific on first sign-in
  if (req.headers.cookie) {
    const cookieHeader = req.headers.cookie;
    
    // Check if we have a portal-specific cookie for this portal
    const hasPortalCookie = cookieHeader.includes(`${cookiePrefix}=`) || 
                            cookieHeader.match(new RegExp(`${cookiePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:_[^=]+)?=`));
    
    // Check if there's a generic __session cookie (from Clerk sign-in)
    const hasGenericSession = cookieHeader.match(/__session(?![_](?:user|vendor|admin))[^=]*=/);
    
    let filteredHeader = cookieHeader;
    
    // CRITICAL: If we DON'T have a portal-specific cookie but DO have a generic __session,
    // this is likely a first-time sign-in - ADD portal-specific cookie but KEEP __session
    // We need both: __session (for Clerk middleware) AND __session_user (for isolation)
    if (!hasPortalCookie && hasGenericSession) {
      // Extract the __session cookie value and instance ID
      const sessionMatch = cookieHeader.match(/__session(?![_](?:user|vendor|admin))([^=]*)=([^;]+)/);
      const sessionValue = sessionMatch ? sessionMatch[2] : null;
      const instanceId = sessionMatch ? (sessionMatch[1] || '') : '';
      
      if (sessionValue) {
        // ADD portal-specific cookie alongside __session (don't remove __session)
        // This ensures both cookies exist: __session_user (isolation) and __session (Clerk middleware)
        const portalCookieString = `${cookiePrefix}${instanceId}=${sessionValue}`;
        filteredHeader = cookieHeader ? `${cookieHeader}; ${portalCookieString}` : portalCookieString;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 [${portalType}] Adding ${cookiePrefix} cookie alongside __session (first-time sign-in)`);
        }
      }
    } else if (hasPortalCookie) {
      // We have a portal-specific cookie - ensure __session is also present for Clerk middleware
      // Extract the portal-specific cookie value from the original cookieHeader (not filteredHeader yet)
      const portalMatch = cookieHeader.match(new RegExp(`${cookiePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^=]*)=([^;]+)`));
      const portalValue = portalMatch ? portalMatch[2] : null;
      const portalInstanceId = portalMatch ? (portalMatch[1] || '') : '';
      
      if (portalValue) {
        // Check if __session already exists with the correct value in the original header
        const sessionMatch = cookieHeader.match(/__session(?![_](?:user|vendor|admin))([^=]*)=([^;]+)/);
        if (!sessionMatch || sessionMatch[2] !== portalValue) {
          // Remove existing __session cookies from filteredHeader and add correct one
          filteredHeader = filteredHeader.replace(/__session(?![_](?:user|vendor|admin))[^=]*=[^;]+(?:;|$)/g, '');
          filteredHeader = filteredHeader.replace(/;;+/g, ';').replace(/^;|;$/g, '');
          // Add __session with the portal-specific cookie value
          filteredHeader = filteredHeader ? `${filteredHeader}; __session${portalInstanceId}=${portalValue}` : `__session${portalInstanceId}=${portalValue}`;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 [${portalType}] Ensuring __session exists in header with portal-specific value (hasPortalCookie)`);
          }
        }
      } else {
        // Remove generic __session cookies if portal cookie value not found
        filteredHeader = filteredHeader.replace(/__session(?![_](?:user|vendor|admin))[^=]*=[^;]+(?:;|$)/g, '');
      }
    } else {
      // No portal-specific cookie and no generic session - remove everything
      filteredHeader = filteredHeader.replace(/__session(?![_](?:user|vendor|admin))[^=]*=[^;]+(?:;|$)/g, '');
    }
    
    // Remove cookies from OTHER portals (keep only current portal's cookies)
    const otherPortals = ['__session_user', '__session_vendor', '__session_admin'].filter(
      prefix => prefix !== cookiePrefix
    );
    otherPortals.forEach(prefix => {
      // Escape special regex characters and match with any instance ID suffix
      const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filteredHeader = filteredHeader.replace(
        new RegExp(`${escapedPrefix}(?:_[^=]+)?=[^;]+(?:;|$)`, 'g'),
        ''
      );
    });
    
    // Clean up multiple semicolons and leading/trailing semicolons
    filteredHeader = filteredHeader.replace(/;;+/g, ';').replace(/^;|;$/g, '');
    
    // Update the cookie header
    if (filteredHeader !== cookieHeader) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Filtered cookies for ${portalType} portal: ${cookieHeader.substring(0, 100)} → ${filteredHeader.substring(0, 100)}`);
      }
      req.headers.cookie = filteredHeader;
    }
  }
  
  // Step 2: Update req.cookies (after cookieParser has parsed the header)
  if (req.cookies) {
    // Look for portal-specific cookie first
    let portalCookie = req.cookies[cookiePrefix];
    
    // CRITICAL: If we DON'T have a portal-specific cookie but DO have a generic __session,
    // this is likely a first-time sign-in - migrate it to portal-specific
    if (!portalCookie && req.cookies.__session) {
      const genericSession = req.cookies.__session;
      
      // Check if this is a generic __session (not portal-specific)
      const isGenericSession = !req.cookies.__session_user && !req.cookies.__session_vendor && !req.cookies.__session_admin;
      
      if (isGenericSession) {
        // Migrate generic __session to portal-specific (one-time migration)
        portalCookie = genericSession;
        req.cookies[cookiePrefix] = portalCookie;
        
        // Also check for instance ID cookies (e.g., __session_R-SCx821)
        Object.keys(req.cookies).forEach(key => {
          if (key.startsWith('__session_') && !key.startsWith('__session_user') && 
              !key.startsWith('__session_vendor') && !key.startsWith('__session_admin')) {
            const instanceId = key.replace(/^__session/, '');
            req.cookies[`${cookiePrefix}${instanceId}`] = req.cookies[key];
          }
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 [${portalType}] Migrating generic __session to ${cookiePrefix} in req.cookies (first-time sign-in)`);
        }
      }
    }
    
    // Now map portal-specific cookie to __session for Clerk middleware to process
    if (portalCookie) {
      // Map to __session for Clerk middleware (Clerk expects __session)
      // Keep __session in req.cookies so Clerk middleware can read it
      req.cookies.__session = portalCookie;
      
      // Remove generic __session cookies that don't match the portal-specific value
      // (they're from other portals or old values)
      const genericSessionKeys = Object.keys(req.cookies).filter(key => {
        if (key === '__session') {
          // Keep __session if it matches the portal cookie value
          return req.cookies[key] !== portalCookie;
        }
        return key.startsWith('__session_') && !key.startsWith('__session_user') && !key.startsWith('__session_vendor') && !key.startsWith('__session_admin');
      });
      genericSessionKeys.forEach(key => {
        delete req.cookies[key];
      });
      
      // CRITICAL: Also update the cookie header so Clerk middleware can read it
      // Clerk middleware reads from req.headers.cookie, not just req.cookies
      // Also handle instance ID cookies (e.g., __session_kelXm73C)
      if (req.headers.cookie) {
        const cookieHeader = req.headers.cookie;
        
        // Check for base __session cookie
        const baseSessionMatch = cookieHeader.match(/__session=([^;]+)/);
        // Check for instance ID cookies (e.g., __session_kelXm73C)
        const instanceSessionMatch = cookieHeader.match(/__session(_[^=]+)=([^;]+)/);
        
        // Check if portal-specific cookie has instance ID
        const portalInstanceKeys = Object.keys(req.cookies).filter(key => 
          key.startsWith(cookiePrefix) && key !== cookiePrefix
        );
        
        let needsHeaderUpdate = false;
        let updatedHeader = cookieHeader;
        
        // Handle instance ID cookies first (e.g., __session_kelXm73C)
        if (portalInstanceKeys.length > 0) {
          portalInstanceKeys.forEach(key => {
            const instanceId = key.replace(cookiePrefix, '');
            const portalInstanceValue = req.cookies[key];
            // Check if __session with same instance ID exists in header
            const headerInstanceMatch = updatedHeader.match(new RegExp(`__session${instanceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`));
            if (!headerInstanceMatch || headerInstanceMatch[1] !== portalInstanceValue) {
              // Remove old instance cookie and add correct one
              updatedHeader = updatedHeader.replace(new RegExp(`__session${instanceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=[^;]+(;|$)`, 'g'), '');
              updatedHeader = updatedHeader.replace(/;;+/g, ';').replace(/^;|;$/g, '');
              updatedHeader = updatedHeader ? `${updatedHeader}; __session${instanceId}=${portalInstanceValue}` : `__session${instanceId}=${portalInstanceValue}`;
              needsHeaderUpdate = true;
            }
          });
        }
        
        // Check if base __session exists with correct value
        if (!baseSessionMatch || baseSessionMatch[1] !== portalCookie) {
          // Remove existing base __session cookie
          updatedHeader = updatedHeader.replace(/__session=([^;]+)(;|$)/g, '');
          updatedHeader = updatedHeader.replace(/;;+/g, ';').replace(/^;|;$/g, '');
          // Add the migrated __session cookie with the portal-specific value
          updatedHeader = updatedHeader ? `${updatedHeader}; __session=${portalCookie}` : `__session=${portalCookie}`;
          needsHeaderUpdate = true;
        }
        
        if (needsHeaderUpdate) {
          req.headers.cookie = updatedHeader;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 [${portalType}] Updated cookie header with migrated __session for Clerk middleware`);
            console.log(`   Cookie header after update: ${updatedHeader.substring(0, 150)}...`);
          }
        }
      } else {
        // No cookie header exists, create one with __session
        req.headers.cookie = `__session=${portalCookie}`;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 [${portalType}] Created cookie header with migrated __session for Clerk middleware`);
        }
      }
    } else {
      // No portal-specific cookie - remove __session if it somehow still exists
      delete req.cookies.__session;
      
      // Also remove from cookie header
      if (req.headers.cookie) {
        req.headers.cookie = req.headers.cookie.replace(/__session=[^;]+(;|$)/g, '').replace(/;;+/g, ';').replace(/^;|;$/g, '');
      }
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
    
    // Ensure __session only exists if we have a portal-specific cookie
    if (!portalCookie && req.cookies.__session) {
      delete req.cookies.__session;
    }
  }
  
  // Intercept Set-Cookie headers in responses to rename cookies back to portal-specific names
  // CRITICAL: This MUST catch all cookies Clerk sets, otherwise they'll be shared across portals
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = function(name, value) {
    if (name.toLowerCase() === 'set-cookie') {
      // Convert to array if single value
      const cookies = Array.isArray(value) ? value : [value];
      
      // Rename __session cookie to portal-specific name in responses
      let needsRenaming = false;
      const renamedCookies = cookies.map(cookie => {
        if (typeof cookie !== 'string') return cookie;
        
        // Handle __session=value (base session cookie) - CRITICAL: Must rename
        if (cookie.startsWith('__session=') && !cookie.startsWith(cookiePrefix)) {
          needsRenaming = true;
          const renamed = cookie.replace(/^__session=/, `${cookiePrefix}=`);
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 [${portalType}] Renaming cookie in response: __session → ${cookiePrefix} (via setHeader)`);
          }
          return renamed;
        }
        
        // Handle __session_instanceId=value (Clerk instance-specific cookies)
        if (cookie.startsWith('__session_') && !cookie.startsWith(cookiePrefix)) {
          // Check if it's NOT already a portal-specific cookie
          if (!cookie.match(/^__session_(user|vendor|admin)(?:_[^=]+)?=/)) {
            needsRenaming = true;
            // Extract instance ID if present (e.g., __session_abc123=value)
            const match = cookie.match(/^__session(_[^=]+)?=(.+)$/);
            if (match) {
              const instanceId = match[1] || ''; // e.g., "_abc123" or ""
              const rest = match[2]; // The rest of the cookie string (value, attributes, etc.)
              const renamed = `${cookiePrefix}${instanceId}=${rest}`;
              if (process.env.NODE_ENV === 'development') {
                console.log(`🔄 [${portalType}] Renaming cookie in response: __session${instanceId} → ${cookiePrefix}${instanceId} (via setHeader)`);
              }
              return renamed;
            }
          }
        }
        
        // Handle cookies that contain __session in the middle (shouldn't happen, but safe)
        if (cookie.includes('__session') && !cookie.includes(cookiePrefix) && 
            !cookie.match(/__session_(user|vendor|admin)/)) {
          needsRenaming = true;
          const renamed = cookie.replace(/__session([^=;]*)/g, `${cookiePrefix}$1`);
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 [${portalType}] Renaming cookie containing __session → ${cookiePrefix} (via setHeader)`);
          }
          return renamed;
        }
        
        return cookie;
      });
      
      if (needsRenaming) {
        // CRITICAL: Add deletion headers for generic __session cookies
        // This ensures the browser removes old generic cookies when setting portal-specific ones
        const cookiesToSet = [...renamedCookies];
        
        // Check if we're setting a portal-specific cookie
        const isSettingPortalCookie = renamedCookies.some(c => 
          typeof c === 'string' && c.startsWith(cookiePrefix)
        );
        
        if (isSettingPortalCookie) {
          // Extract attributes from a sample cookie to preserve them
          const sampleCookie = renamedCookies.find(c => 
            typeof c === 'string' && c.startsWith(cookiePrefix)
          );
          
          if (sampleCookie) {
            // Extract path and other attributes from the cookie string
            const cookieParts = sampleCookie.split(';');
            let path = '/';
            let sameSite = 'Lax';
            let httpOnly = 'HttpOnly';
            let secure = '';
            let domain = '';
            
            // Parse attributes
            cookieParts.slice(1).forEach(attr => {
              const trimmed = attr.trim();
              if (trimmed.toLowerCase().startsWith('path=')) {
                path = trimmed.split('=')[1];
              } else if (trimmed.toLowerCase().startsWith('samesite=')) {
                sameSite = trimmed.split('=')[1];
              } else if (trimmed.toLowerCase() === 'httponly') {
                httpOnly = 'HttpOnly';
              } else if (trimmed.toLowerCase() === 'secure') {
                secure = 'Secure';
              } else if (trimmed.toLowerCase().startsWith('domain=')) {
                domain = trimmed;
              }
            });
            
            // Build attribute string
            const attributes = `${httpOnly}; SameSite=${sameSite}; Path=${path}${secure ? '; ' + secure : ''}${domain ? '; ' + domain : ''}`;
            
            // Delete generic __session cookie (base cookie without instance ID)
            cookiesToSet.push(`__session=; Max-Age=0; ${attributes}`);
            
            // Also delete any __session_* cookies that aren't portal-specific
            // We'll catch common patterns - Clerk may use instance IDs
            if (process.env.NODE_ENV === 'development') {
              console.log(`🗑️ [${portalType}] Adding deletion headers for generic __session cookies`);
            }
          }
        }
        
        return originalSetHeader('set-cookie', cookiesToSet);
      }
      return originalSetHeader('set-cookie', cookies);
    }
    return originalSetHeader(name, value);
  };
  
  // Also intercept res.cookie() method to rename cookies
  const originalCookie = res.cookie.bind(res);
  res.cookie = function(name, value, options) {
    // If Clerk is setting a __session cookie, rename it to portal-specific name
    if (name === '__session' || (name.startsWith('__session_') && !name.startsWith(cookiePrefix))) {
      const newName = name.replace(/^__session(_.*)?$/, `${cookiePrefix}$1`);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Renaming cookie: ${name} → ${newName} (via res.cookie)`);
      }
      return originalCookie(newName, value, options);
    }
    return originalCookie(name, value, options);
  };
  
  // Intercept res.end() to catch any cookies set during the response
  // This is a final safety net to ensure all cookies are renamed
  const originalEnd = res.end.bind(res);
  res.end = function(chunk, encoding) {
    // Get current Set-Cookie headers and rename them
    const setCookieHeaders = res.getHeader('set-cookie');
    if (setCookieHeaders) {
      const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
      let needsRenaming = false;
      const renamedCookies = cookies.map(cookie => {
        if (typeof cookie !== 'string') return cookie;
        
        // Handle __session=value
        if (cookie.startsWith('__session=') && !cookie.startsWith(cookiePrefix)) {
          needsRenaming = true;
          const renamed = cookie.replace(/^__session=/, `${cookiePrefix}=`);
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Final rename: __session → ${cookiePrefix} (via res.end)`);
          }
          return renamed;
        }
        
        // Handle __session_instanceId=value (but not already renamed)
        if (cookie.startsWith('__session_') && !cookie.startsWith(cookiePrefix)) {
          // Check if it's NOT already a portal-specific cookie
          if (!cookie.match(/^__session_(user|vendor|admin)(?:_[^=]+)?=/)) {
            const match = cookie.match(/^__session(_[^=]+)?=(.+)$/);
            if (match) {
              needsRenaming = true;
              const instanceId = match[1] || '';
              const rest = match[2];
              const renamed = `${cookiePrefix}${instanceId}=${rest}`;
              if (process.env.NODE_ENV === 'development') {
                console.log(`🔄 Final rename: __session${instanceId} → ${cookiePrefix}${instanceId} (via res.end)`);
              }
              return renamed;
            }
          }
        }
        
        return cookie;
      });
      
      if (needsRenaming) {
        // CRITICAL: Also add deletion headers for generic __session cookies
        const cookiesToSet = [...renamedCookies];
        
        // Check if we're setting a portal-specific cookie
        const isSettingPortalCookie = renamedCookies.some(c => 
          typeof c === 'string' && c.startsWith(cookiePrefix)
        );
        
        if (isSettingPortalCookie) {
          // Extract attributes from a sample cookie
          const sampleCookie = renamedCookies.find(c => 
            typeof c === 'string' && c.startsWith(cookiePrefix)
          );
          
          if (sampleCookie) {
            const cookieParts = sampleCookie.split(';');
            let path = '/';
            let sameSite = 'Lax';
            let httpOnly = 'HttpOnly';
            let secure = '';
            let domain = '';
            
            // Parse attributes
            cookieParts.slice(1).forEach(attr => {
              const trimmed = attr.trim();
              if (trimmed.toLowerCase().startsWith('path=')) {
                path = trimmed.split('=')[1];
              } else if (trimmed.toLowerCase().startsWith('samesite=')) {
                sameSite = trimmed.split('=')[1];
              } else if (trimmed.toLowerCase() === 'httponly') {
                httpOnly = 'HttpOnly';
              } else if (trimmed.toLowerCase() === 'secure') {
                secure = 'Secure';
              } else if (trimmed.toLowerCase().startsWith('domain=')) {
                domain = trimmed;
              }
            });
            
            // Build attribute string
            const attributes = `${httpOnly}; SameSite=${sameSite}; Path=${path}${secure ? '; ' + secure : ''}${domain ? '; ' + domain : ''}`;
            
            // Delete generic __session cookie
            cookiesToSet.push(`__session=; Max-Age=0; ${attributes}`);
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`🗑️ [${portalType}] Adding deletion headers for generic __session cookies in res.end`);
            }
          }
        }
        
        res.removeHeader('set-cookie');
        res.setHeader('set-cookie', cookiesToSet);
      }
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

