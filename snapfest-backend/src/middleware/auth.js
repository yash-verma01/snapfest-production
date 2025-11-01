import { User } from '../models/index.js';
import dotenv from 'dotenv';
import { getAuth } from '@clerk/express';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Load environment variables
dotenv.config();

/**
 * Authentication middleware using Clerk cookie-based sessions.
 * 
 * Switched from JWT/token-based authentication to Clerk cookie sessions:
 * - Removed JWT token verification and Authorization header parsing
 * - Removed legacy system JWT fallback
 * - All authentication now comes from Clerk middleware (cookie/session-based)
 * - Frontend sends session cookies automatically (no getToken() needed)
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get authenticated user from Clerk middleware (parsed from session cookies)
    // getAuth(req) should return the auth object, but if it's not authenticated, try calling req.auth() as function
    let clerkAuth = getAuth(req);
    
    // Fallback: If getAuth returns unauthenticated, try calling req.auth as function
    if (!clerkAuth?.userId && req.auth && typeof req.auth === 'function') {
      try {
        const authFromFunc = req.auth();
        if (authFromFunc?.userId) {
          clerkAuth = authFromFunc;
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ Using req.auth() fallback');
          }
        }
      } catch (e) {
        // Ignore errors from calling req.auth()
      }
    }
    
    // Also check if req.auth has properties directly (Proxy behavior)
    if (!clerkAuth?.userId && req.auth && req.auth.userId) {
      clerkAuth = req.auth;
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Using req.auth properties directly');
      }
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      if (!clerkAuth?.userId) {
        console.log('🔍 authenticate: No Clerk session found');
        console.log('   getAuth(req).isAuthenticated:', getAuth(req).isAuthenticated);
        console.log('   getAuth(req).userId:', getAuth(req).userId);
        console.log('   req.auth type:', typeof req.auth);
        if (typeof req.auth === 'function') {
          try {
            console.log('   req.auth() result:', req.auth());
          } catch (e) {
            console.log('   req.auth() error:', e.message);
          }
        }
        console.log('   Request cookies:', Object.keys(req.cookies || {}));
        console.log('   Cookie header present:', !!req.headers.cookie);
        if (req.cookies) {
          console.log('   __session cookie value (first 50 chars):', req.cookies.__session?.substring(0, 50));
        }
      }
    }
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Please sign in.' 
      });
    }

    // Extract user information from Clerk session claims
    // Clerk provides email in various claim formats - try all possibilities
    // Note: claims might be in sessionClaims, not directly in clerkAuth
    const sessionClaims = clerkAuth?.sessionClaims || clerkAuth?.claims || {};
    const email = sessionClaims?.email || 
                  sessionClaims?.primary_email_address ||
                  sessionClaims?.emailAddress ||
                  null;
    
    // Extract name - try multiple formats
    let name = null;
    if (sessionClaims?.name) {
      name = sessionClaims.name;
    } else if (sessionClaims?.firstName && sessionClaims?.lastName) {
      name = `${sessionClaims.firstName} ${sessionClaims.lastName}`;
    } else if (sessionClaims?.first_name && sessionClaims?.last_name) {
      name = `${sessionClaims.first_name} ${sessionClaims.last_name}`;
    } else if (sessionClaims?.firstName) {
      name = sessionClaims.firstName;
    } else if (sessionClaims?.first_name) {
      name = sessionClaims.first_name;
    } else if (email) {
      name = email.split('@')[0];
    }
    const sanitizedName = (name || 'User').trim();

    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Clerk Auth Debug:', {
        userId: clerkAuth.userId,
        hasClaims: !!clerkAuth.claims,
        claimKeys: clerkAuth.claims ? Object.keys(clerkAuth.claims) : [],
        email: email || 'MISSING',
        name: name || 'MISSING'
      });
    }

    // Email is required - if missing, fetch from Clerk API as fallback
    // Clerk handles authentication - email verification status is managed by Clerk
    let finalEmail = email;
    let finalName = sanitizedName;
    
    if (!finalEmail) {
      console.warn('⚠️ Email not found in claims, fetching from Clerk API for userId:', clerkAuth.userId);
      try {
        const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
        
        // Get primary email address
        finalEmail = clerkUser.emailAddresses?.find(email => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
                     clerkUser.emailAddresses?.[0]?.emailAddress ||
                     clerkUser.emailAddress ||
                     null;
        
        // Get name from Clerk user
        finalName = clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
          : clerkUser.firstName || clerkUser.lastName || finalName;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Fetched from Clerk API:', { email: finalEmail, name: finalName });
        }
      } catch (apiError) {
        console.error('❌ Failed to fetch user from Clerk API:', apiError.message);
        console.error('Available claims:', clerkAuth.claims);
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication failed: email not found. Please ensure your Clerk account has an email address.' 
        });
      }
    }
    
    // Final validation - email is required
    if (!finalEmail) {
      console.error('❌ No email found after fallback for userId:', clerkAuth.userId);
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed: email not found. Please ensure your Clerk account has an email address.' 
      });
    }
    
    // Update sanitizedName with final name
    const finalSanitizedName = (finalName || finalEmail.split('@')[0] || 'User').trim();

    // Check if request came from specific ports for role auto-detection
    const origin = req.headers.origin || req.headers.referer || '';
    const isUserPort = origin.includes('localhost:3000') || 
                       origin.includes(':3000');
    const isVendorPort = origin.includes('localhost:3001') || 
                         origin.includes(':3001');
    const isAdminPort = origin.includes('localhost:3002') || 
                        origin.includes(':3002');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 authenticate: Origin check', { origin, isUserPort, isVendorPort, isAdminPort });
    }

    // Check Clerk publicMetadata for role (admin, vendor, or default user)
    let publicMetadata = sessionClaims?.publicMetadata || clerkAuth?.claims?.publicMetadata || null;
    if (!publicMetadata) {
      try {
        const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
        publicMetadata = clerkUser.publicMetadata || null;
      } catch (e) {
        // Non-blocking, will default to 'user'
      }
    }
    
    // Auto-set role based on port if not already set
    let role = publicMetadata?.role;
    if (!role) {
      if (isVendorPort) {
        // Vendor port - auto-set vendor role
        try {
          await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
            publicMetadata: { 
              ...publicMetadata,
              role: 'vendor' 
            }
          });
          role = 'vendor';
          publicMetadata = { ...publicMetadata, role: 'vendor' };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ authenticate: Auto-set vendor role for user:', clerkAuth.userId);
          }
        } catch (e) {
          console.error('❌ authenticate: Failed to set vendor role:', e.message);
          role = 'user'; // Fallback to user
        }
      } else if (isAdminPort) {
        // Admin port - don't auto-set (security - must be set manually)
        role = 'user'; // Default to user
      } else if (isUserPort) {
        // User port - auto-set user role
        try {
          await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
            publicMetadata: { 
              ...publicMetadata,
              role: 'user' 
            }
          });
          role = 'user';
          publicMetadata = { ...publicMetadata, role: 'user' };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ authenticate: Auto-set user role for user:', clerkAuth.userId);
          }
        } catch (e) {
          console.error('❌ authenticate: Failed to set user role:', e.message);
          role = 'user'; // Fallback
        }
      } else {
        // Unknown origin - default to user
        role = 'user';
      }
    }
    
    // If role is 'vendor', create/update in Vendor collection instead of User
    if (role === 'vendor') {
      const { default: Vendor } = await import('../models/Vendor.js');
      
      let vendor = await Vendor.findOne({ clerkId: clerkAuth.userId });
      
      if (!vendor) {
        // Create new vendor document in Vendor collection
        vendor = await Vendor.create({
          clerkId: clerkAuth.userId,
          name: finalSanitizedName,
          email: finalEmail.toLowerCase().trim(),
          businessName: `${finalSanitizedName}'s Business`,
          servicesOffered: [],
          experience: 0,
          availability: 'AVAILABLE',
          profileComplete: false,
          earningsSummary: {
            totalEarnings: 0,
            thisMonthEarnings: 0,
            totalBookings: 0
          }
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Created new vendor:', { vendorId: vendor._id, email: vendor.email, clerkId: vendor.clerkId });
        }
      } else {
        // Update vendor if email/name changed
        const needsUpdate = vendor.email !== finalEmail.toLowerCase().trim() || 
                           vendor.name !== finalSanitizedName;
        
        if (needsUpdate) {
          vendor.email = finalEmail.toLowerCase().trim();
          vendor.name = finalSanitizedName;
          await vendor.save();
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Updated vendor:', { vendorId: vendor._id, email: vendor.email });
          }
        }
      }
      
      // Attach vendor to request object
      req.vendor = vendor;
      req.vendorId = vendor._id;
      req.userRole = 'vendor';
      
      // For backward compatibility, also set req.user and req.userId (pointing to vendor)
      req.user = vendor;
      req.userId = vendor._id;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Vendor authenticated:', { vendorId: vendor._id, email: vendor.email });
      }
      
      next();
      return;
    }
    
    // For admin and user roles, use User collection
    // Find or create user in local database
    let user = await User.findOne({ clerkId: clerkAuth.userId });
    
    if (!user) {
      // Check if this should be an admin user
      const adminEmail = process.env.ADMIN_EMAIL || 'admin100@gmail.com';
      const adminEmailsEnv = process.env.ADMIN_EMAILS;
      const adminEmails = adminEmailsEnv ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase()) : [];
      const normalizedEmail = finalEmail.toLowerCase().trim();
      
      const isAdmin = role === 'admin' || 
                      normalizedEmail === adminEmail.toLowerCase() ||
                      adminEmails.includes(normalizedEmail);
      
      // Create new user document if it doesn't exist (idempotent operation)
      // Clerk handles authentication, removed old auth fields (isEmailVerified, password, etc.)
      // Email and name are required fields, so we've validated them above
      user = await User.create({
        clerkId: clerkAuth.userId, // req.auth.userId from Clerk middleware
        name: finalSanitizedName,
        email: finalEmail.toLowerCase().trim(), // Ensure lowercase and trimmed
        isActive: true,
        role: isAdmin ? 'admin' : 'user',
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Created new user:', { userId: user._id, email: user.email, role: user.role, clerkId: user.clerkId });
      }
    } else {
      // Update user if email/name changed in Clerk (sync metadata)
      // Also update role if it changed in Clerk publicMetadata
      const needsUpdate = user.email !== finalEmail.toLowerCase().trim() || 
                         user.name !== finalSanitizedName ||
                         (role !== 'vendor' && user.role !== role);
      
      if (needsUpdate) {
        user.email = finalEmail.toLowerCase().trim();
        user.name = finalSanitizedName;
        if (role !== 'vendor' && role !== user.role) {
          // Only update role if it's not vendor (vendor uses Vendor collection)
          user.role = role;
        }
        await user.save();
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Updated user:', { userId: user._id, email: user.email, role: user.role });
        }
      }
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated.' 
      });
    }

    // Attach user to request object for use in route handlers
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // More detailed error logging
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed.', 
      error: error.message 
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * @deprecated Use requireAdminClerk middleware instead.
 * 
 * This middleware checked DB role and env email/password, which is outdated.
 * Admin access is now handled by Clerk's publicMetadata.role via requireAdminClerk middleware.
 * 
 * Kept for backward compatibility but should not be used for new routes.
 * All admin routes should use requireAdminClerk middleware at router level.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please authenticate first.'
    });
  }

  // Check if user is admin with specific credentials
  const adminEmail = process.env.ADMIN_EMAIL || 'admin100@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '1212121212';
  
  if (req.user.email !== adminEmail || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin credentials required.'
    });
  }

  next();
};

// Vendor or Admin middleware
export const vendorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please authenticate first.'
    });
  }

  if (!['vendor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Vendor or Admin role required.'
    });
  }

  next();
};

/**
 * Optional authentication - doesn't fail if user is not signed in.
 * Uses Clerk cookie sessions (not JWT tokens).
 * Clerk handles authentication - removed old auth fields.
 * 
 * This middleware is used for routes that should work even if user isn't authenticated yet,
 * but will attach user info if a valid Clerk session exists.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    // Try getAuth(req) first, then fallback to req.auth
    let clerkAuth = getAuth(req);
    
    // Fallback: Check if req.auth exists
    if (!clerkAuth?.userId && req.auth?.userId) {
      clerkAuth = req.auth;
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ optionalAuth: Using req.auth fallback');
      }
    }
    
    // Debug logging in development to help diagnose session issues
    if (process.env.NODE_ENV === 'development') {
      if (!clerkAuth?.userId) {
        console.log('🔍 optionalAuth: No Clerk session found');
        console.log('   getAuth(req):', getAuth(req));
        console.log('   req.auth:', req.auth);
        console.log('   Request cookies:', Object.keys(req.cookies || {}));
        console.log('   Request headers:', {
          cookie: req.headers.cookie ? 'present' : 'missing',
          origin: req.headers.origin,
          referer: req.headers.referer
        });
      }
    }
    
    if (clerkAuth?.userId) {
      // Extract email and name from Clerk claims
      const email = clerkAuth?.claims?.email || 
                    clerkAuth?.claims?.primary_email_address ||
                    clerkAuth?.claims?.emailAddress ||
                    null;
      
      let name = null;
      if (clerkAuth?.claims?.name) {
        name = clerkAuth.claims.name;
      } else if (clerkAuth?.claims?.firstName && clerkAuth?.claims?.lastName) {
        name = `${clerkAuth.claims.firstName} ${clerkAuth.claims.lastName}`;
      } else if (clerkAuth?.claims?.firstName) {
        name = clerkAuth.claims.firstName;
      } else if (email) {
        name = email.split('@')[0];
      }
      const sanitizedName = (name || 'User').trim();

      // CRITICAL: Check if request came from vendor port (3001) FIRST - this determines if user is a vendor
      const origin = req.headers.origin || req.headers.referer || '';
      const isVendorPort = origin.includes('localhost:3001') || origin.includes(':3001');
      const isVendorRoute = req.path.includes('/vendors/');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 optionalAuth: Route check', { 
          path: req.path, 
          origin, 
          isVendorPort, 
          isVendorRoute 
        });
      }
      
      let publicMetadata = clerkAuth?.claims?.publicMetadata || null;
      
      // Fetch publicMetadata from Clerk if needed
      if (!publicMetadata) {
        try {
          const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
          publicMetadata = clerkUser.publicMetadata || null;
        } catch (e) {
          // Non-blocking
        }
      }
      
      // PRIORITY 1: If request came from vendor port (3001), this is DEFINITELY a vendor
      // Set vendor role in Clerk if not already set
      if (isVendorPort && publicMetadata?.role !== 'vendor') {
        try {
          await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
            publicMetadata: { 
              ...publicMetadata,
              role: 'vendor' 
            }
          });
          
          // Refresh metadata after update
          const updatedUser = await clerkClient.users.getUser(clerkAuth.userId);
          publicMetadata = updatedUser.publicMetadata || { role: 'vendor' };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ optionalAuth: Auto-set vendor role for port 3001 user:', clerkAuth.userId);
          }
        } catch (updateError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ optionalAuth: Failed to update Clerk metadata:', updateError.message);
          }
          // Set role locally even if Clerk update fails
          publicMetadata = { ...publicMetadata, role: 'vendor' };
        }
      }
      
      // If this is a vendor (either from port 3001, vendor route, or has vendor role), handle vendor
      if (isVendorPort || isVendorRoute || publicMetadata?.role === 'vendor') {
        const { default: Vendor } = await import('../models/Vendor.js');
        let vendor = await Vendor.findOne({ clerkId: clerkAuth.userId });
        
        if (!vendor && email) {
          // Create vendor document - NOT a User document
          vendor = await Vendor.create({
            clerkId: clerkAuth.userId,
            name: sanitizedName,
            email: email.toLowerCase().trim(),
            businessName: `${sanitizedName}'s Business`,
            servicesOffered: [],
            experience: 0,
            availability: 'AVAILABLE',
            profileComplete: false,
            earningsSummary: {
              totalEarnings: 0,
              thisMonthEarnings: 0,
              totalBookings: 0
            }
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ optionalAuth: Created new VENDOR (not user):', { vendorId: vendor._id, email: vendor.email });
          }
        }
        
        if (vendor) {
          req.vendor = vendor;
          req.vendorId = vendor._id;
          req.userRole = 'vendor';
          // For backward compatibility, also set req.user (pointing to vendor)
          req.user = vendor;
          req.userId = vendor._id;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ optionalAuth: VENDOR attached to request (not user):', { vendorId: vendor._id, email: vendor.email });
          }
        }
      } else {
        // Only create User document if NOT a vendor (NOT from port 3001, NOT vendor route, NOT vendor role)
        let user = await User.findOne({ clerkId: clerkAuth.userId });
        
        if (!user && email) {
          // Clerk handles authentication, removed old auth fields (isEmailVerified, password, etc.)
          // Check if this should be an admin user
          const adminEmail = process.env.ADMIN_EMAIL || 'admin100@gmail.com';
          const adminEmailsEnv = process.env.ADMIN_EMAILS;
          const adminEmails = adminEmailsEnv ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase()) : [];
          const normalizedEmail = email.toLowerCase().trim();
          
          const isAdmin = publicMetadata?.role === 'admin' || 
                          normalizedEmail === adminEmail.toLowerCase() ||
                          adminEmails.includes(normalizedEmail);
          
          user = await User.create({
            clerkId: clerkAuth.userId,
            name: sanitizedName,
            email: email.toLowerCase().trim(),
            isActive: true,
            role: isAdmin ? 'admin' : 'user',
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ optionalAuth: Created new USER (not vendor):', { userId: user._id, email: user.email, role: user.role });
          }
        }

        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
          req.userRole = user.role;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ optionalAuth: USER attached to request:', { userId: user._id, email: user.email, role: user.role });
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors for optional auth - log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ optionalAuth error (non-blocking):', error.message);
    }
  }
  
  next();
};

// Resource ownership middleware
export const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (req.userId.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Rate limiting for auth endpoints
export const authRateLimit = (req, res, next) => {
  // Simple rate limiting for auth endpoints
  const key = `auth_${req.ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!req.rateLimit) {
    req.rateLimit = {};
  }

  if (!req.rateLimit[key]) {
    req.rateLimit[key] = {
      count: 0,
      resetTime: now + windowMs
    };
  }

  if (now > req.rateLimit[key].resetTime) {
    req.rateLimit[key] = {
      count: 0,
      resetTime: now + windowMs
    };
  }

  if (req.rateLimit[key].count >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.'
    });
  }

  req.rateLimit[key].count++;
  next();
};

/**
 * Validate session and return user info.
 * Now uses Clerk cookie sessions instead of JWT tokens.
 */
export const validateToken = async (req, res) => {
  try {
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'No active session'
      });
    }

    const user = await User.findOne({ clerkId: clerkAuth.userId }).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Session is valid',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session validation failed',
      error: error.message
    });
  }
};

// Vendor only middleware
export const vendorOnly = (req, res, next) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Vendor role required.'
    });
  }
  next();
};

// User only middleware
export const userOnly = (req, res, next) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User role required.'
    });
  }
  next();
};
