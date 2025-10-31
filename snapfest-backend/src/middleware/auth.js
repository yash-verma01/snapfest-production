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
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Please sign in.' 
      });
    }

    // Extract user information from Clerk session claims
    // Clerk provides email in various claim formats - try all possibilities
    const email = clerkAuth?.claims?.email || 
                  clerkAuth?.claims?.primary_email_address ||
                  clerkAuth?.claims?.emailAddress ||
                  null;
    
    // Extract name - try multiple formats
    let name = null;
    if (clerkAuth?.claims?.name) {
      name = clerkAuth.claims.name;
    } else if (clerkAuth?.claims?.firstName && clerkAuth?.claims?.lastName) {
      name = `${clerkAuth.claims.firstName} ${clerkAuth.claims.lastName}`;
    } else if (clerkAuth?.claims?.first_name && clerkAuth?.claims?.last_name) {
      name = `${clerkAuth.claims.first_name} ${clerkAuth.claims.last_name}`;
    } else if (clerkAuth?.claims?.firstName) {
      name = clerkAuth.claims.firstName;
    } else if (clerkAuth?.claims?.first_name) {
      name = clerkAuth.claims.first_name;
    } else if (email) {
      name = email.split('@')[0];
    }
    const sanitizedName = (name || 'User').trim();
    
    const emailVerified = clerkAuth?.claims?.email_verified || 
                          clerkAuth?.claims?.emailVerified || 
                          false;

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
    let finalEmail = email;
    let finalName = sanitizedName;
    let finalEmailVerified = emailVerified;
    
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
        
        // Get email verified status
        finalEmailVerified = clerkUser.emailAddresses?.find(email => email.id === clerkUser.primaryEmailAddressId)?.verification?.status === 'verified' ||
                            clerkUser.emailAddresses?.[0]?.verification?.status === 'verified' ||
                            false;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Fetched from Clerk API:', { email: finalEmail, name: finalName, emailVerified: finalEmailVerified });
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


    // Find or create user in local database
    let user = await User.findOne({ clerkId: clerkAuth.userId });
    
    if (!user) {
      // Create new user document if it doesn't exist (idempotent operation)
      // Email and name are required fields, so we've validated them above
      user = await User.create({
        clerkId: clerkAuth.userId,
        name: finalSanitizedName,
        email: finalEmail.toLowerCase().trim(), // Ensure lowercase and trimmed
        isActive: true,
        isEmailVerified: !!finalEmailVerified,
        role: 'user', // Default role for new Clerk users
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Created new user:', { userId: user._id, email: user.email, clerkId: user.clerkId });
      }
    } else {
      // Update user if email/name changed in Clerk (sync metadata)
      const needsUpdate = user.email !== finalEmail.toLowerCase().trim() || 
                         user.name !== finalSanitizedName ||
                         user.isEmailVerified !== !!finalEmailVerified;
      
      if (needsUpdate) {
        user.email = finalEmail.toLowerCase().trim();
        user.name = finalSanitizedName;
        user.isEmailVerified = !!finalEmailVerified;
        await user.save();
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Updated user:', { userId: user._id, email: user.email });
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

// Admin only middleware
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
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const clerkAuth = getAuth(req);
    
    if (clerkAuth?.userId) {
      const email = clerkAuth?.claims?.email || null;
      const name = clerkAuth?.claims?.name || email?.split('@')[0] || 'User';
      const emailVerified = clerkAuth?.claims?.email_verified || false;

      let user = await User.findOne({ clerkId: clerkAuth.userId });
      
      if (!user) {
        user = await User.create({
          clerkId: clerkAuth.userId,
          name,
          email,
          isActive: true,
          isEmailVerified: !!emailVerified,
          role: 'user',
        });
      }

      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
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
