import { getAuth } from '@clerk/express';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { User } from '../models/index.js';

// Note: dotenv.config() is already called in server.js
// No need to reload environment variables here

// Single Clerk application configuration (matches server.js)
// Use CLERK_SECRET_KEY (primary) or fallback to CLERK_SECRET_KEY_USER for backward compatibility
const getClerkClient = () => {
  const secretKey = process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY_USER;
  if (!secretKey) {
    throw new Error('Clerk secret key not configured. Set CLERK_SECRET_KEY or CLERK_SECRET_KEY_USER in environment variables.');
  }
  return createClerkClient({ secretKey });
};

/**
 * Admin access middleware using Clerk publicMetadata.role
 * 
 * Grants admin access if:
 * 1. User has Clerk session with publicMetadata.role === 'admin', OR
 * 2. User email is in ADMIN_EMAILS env (fallback - optional)
 * 
 * This middleware relies on Clerk's publicMetadata which is set in Clerk Dashboard.
 * To make a user admin: Clerk Dashboard → Users → [User] → Public metadata → { "role": "admin" }
 * 
 * NOTE: publicMetadata is readable client-side. Only use for role flags, not secrets.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const requireAdminClerk = async (req, res, next) => {
  try {
    let clerkAuth = null;
    
    // Method 1: Check Authorization header (token-based - works cross-origin)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Decode Clerk JWT token to get userId
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.decode(token);
        
        if (decoded && decoded.sub) {
          const userId = decoded.sub;
          
          // Use single Clerk client (no port-based routing)
          const clerkClient = getClerkClient();
          const clerkUser = await clerkClient.users.getUser(userId);
          
          clerkAuth = {
            userId: userId,
            sessionClaims: {
              email: clerkUser.emailAddresses?.[0]?.emailAddress,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              publicMetadata: clerkUser.publicMetadata || {}
            },
            claims: {
              email: clerkUser.emailAddresses?.[0]?.emailAddress,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              publicMetadata: clerkUser.publicMetadata || {}
            }
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ requireAdminClerk: Using token-based authentication');
          }
        }
      } catch (tokenError) {
        // Token invalid, fall back to cookie-based auth
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ requireAdminClerk: Token decode failed, falling back to cookies');
        }
      }
    }
    
    // Method 2: Fallback to cookie-based auth (getAuth from cookies)
    if (!clerkAuth) {
      clerkAuth = getAuth(req);
      
      // Fallback: If getAuth returns unauthenticated, try calling req.auth as function
      if (!clerkAuth?.userId && req.auth && typeof req.auth === 'function') {
        try {
          const authFromFunc = req.auth();
          if (authFromFunc?.userId) {
            clerkAuth = authFromFunc;
            if (process.env.NODE_ENV === 'development') {
              console.log('⚠️ requireAdminClerk: Using req.auth() fallback');
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
      
      // Also check if req.auth has properties directly (Proxy behavior)
      if (!clerkAuth?.userId && req.auth && req.auth.userId) {
        clerkAuth = req.auth;
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ requireAdminClerk: Using req.auth properties directly');
        }
      }
    }
    
    // Debug logging (always log in production too for admin routes - critical for debugging)
    console.log('🔍 requireAdminClerk: Admin route accessed', {
      authMethod: authHeader ? 'token' : 'cookie',
      path: req.path,
      originalUrl: req.originalUrl,
      origin: req.headers.origin || req.headers.referer || 'missing',
      host: req.get('host'),
      cookieCount: Object.keys(req.cookies || {}).length,
      hasCookieHeader: !!req.headers.cookie,
      hasAuthorizationHeader: !!authHeader,
      hasClerkAuth: !!clerkAuth?.userId,
      clerkUserId: clerkAuth?.userId || null,
      nodeEnv: process.env.NODE_ENV
    });
    
    if (!clerkAuth?.userId) {
      console.error('❌ requireAdminClerk: No Clerk session found', {
        getAuthIsAuthenticated: getAuth(req).isAuthenticated,
        getAuthUserId: getAuth(req).userId,
        reqAuthType: typeof req.auth,
        hasReqAuth: !!req.auth
      });
    } else {
      console.log('✅ requireAdminClerk: Clerk session found', {
        userId: clerkAuth.userId,
        isAuthenticated: clerkAuth.isAuthenticated
      });
    }
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please sign in to access admin routes.'
      });
    }

    const userId = clerkAuth.userId;

    // 2. Extract email from session (for fallback check)
    // Note: claims might be in sessionClaims, not directly in clerkAuth
    const sessionClaims = clerkAuth?.sessionClaims || clerkAuth?.claims || {};
    let email = sessionClaims?.email || 
                  sessionClaims?.primary_email_address ||
                  sessionClaims?.emailAddress ||
                  null;

    // 3. Try to get publicMetadata from session claims first (preferred - no API call)
    // Session claims may include publicMetadata if Clerk middleware includes it
    let publicMetadata = sessionClaims?.publicMetadata || clerkAuth?.claims?.publicMetadata || null;
    
    // If not in claims, fetch from Clerk API (fallback)
    // Also fetch email if not in session claims
    if (!publicMetadata || !email) {
      try {
        // Use single Clerk client (no port-based routing)
        const clerkClient = getClerkClient();
        const clerkUser = await clerkClient.users.getUser(userId);
        
        // Fetch publicMetadata if not in claims
        if (!publicMetadata) {
        publicMetadata = clerkUser.publicMetadata || null;
        }
        
        // Fetch email if not in claims
        if (!email) {
          email = clerkUser.emailAddresses?.find(email => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
                  clerkUser.emailAddresses?.[0]?.emailAddress ||
                  clerkUser.emailAddress ||
                  null;
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📋 Fetched publicMetadata and email from Clerk API for userId:', userId);
        }
      } catch (apiError) {
        console.warn('⚠️ Failed to fetch user from Clerk API:', apiError.message);
        // Continue to fallback check below - don't block if API fails
      }
    }

    // 4. Primary check: publicMetadata.role === 'admin' OR database role === 'admin'
    const isAdminFromMetadata = publicMetadata?.role === 'admin';
    
    // CRITICAL FIX: Also check database role if metadata is missing
    // This handles cases where metadata update failed but user was created as admin
    let isAdminFromDB = false;
    if (!isAdminFromMetadata) {
      const user = await User.findOne({ clerkId: userId });
      isAdminFromDB = user?.role === 'admin';
      
      if (isAdminFromDB) {
        console.log('⚠️ requireAdminClerk: Metadata missing but user has admin role in DB. Attempting to sync metadata...');
        
        // Try to update Clerk metadata if user is admin in DB but not in Clerk
        try {
          // Use single Clerk client (no port-based routing)
          const clerkClient = getClerkClient();
          await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: { 
              ...(publicMetadata || {}),
              role: 'admin' 
            }
          });
          console.log('✅ requireAdminClerk: Synced admin role to Clerk metadata');
          // Update local variable
          publicMetadata = { ...(publicMetadata || {}), role: 'admin' };
        } catch (syncError) {
          console.error('❌ requireAdminClerk: Failed to sync admin role to Clerk metadata:', syncError.message);
          // Continue - allow access based on DB role
        }
      }
    }
    
    if (isAdminFromMetadata || isAdminFromDB) {
      // Find user in database (already created via Clerk with role='admin')
      let user = await User.findOne({ clerkId: userId });
      
      // CRITICAL FIX: Create admin user if doesn't exist in database
      // This prevents 404 errors when accessing admin routes before sync completes
      // BUT: Check admin limit BEFORE creating new admin users
      if (!user) {
        try {
          // CRITICAL FIX: Check admin limit BEFORE creating admin user
          // This prevents bypassing the limit by accessing admin routes directly
          const adminCount = await User.countDocuments({ role: 'admin' });
          const maxAdmins = 2;
          
          if (adminCount >= maxAdmins) {
            // Admin limit reached - check if this user is already an admin (shouldn't happen here, but safety check)
            const existingAdmin = await User.findOne({ clerkId: userId, role: 'admin' });
            
            if (!existingAdmin) {
              // User doesn't exist and limit is reached - block admin creation
              console.error('❌ requireAdminClerk: Admin limit reached - cannot create admin user', {
                adminCount,
                maxAdmins,
                userId: userId,
                reason: 'ADMIN_LIMIT_REACHED'
              });
              
              return res.status(403).json({
                success: false,
                message: 'You are not authorized for this. Maximum admin limit (2) has been reached.',
                code: 'ADMIN_LIMIT_REACHED'
              });
            }
            
            // User exists as admin - use it
            user = existingAdmin;
          } else {
            // Admin limit not reached - proceed with user creation
            // Fetch user details from Clerk if email/name not available
            let finalEmail = email;
            let finalName = null;
            
            if (!finalEmail || !finalName) {
              const clerkClient = getClerkClient();
              const clerkUser = await clerkClient.users.getUser(userId);
              
              if (!finalEmail) {
                finalEmail = clerkUser.emailAddresses?.find(email => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
                            clerkUser.emailAddresses?.[0]?.emailAddress ||
                            clerkUser.emailAddress ||
                            null;
              }
              
              if (!finalName) {
                finalName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 
                           finalEmail?.split('@')[0] || 
                           'Admin';
              }
            }
            
            // CRITICAL FIX: Do NOT create admin users with generated emails
            // Admins MUST have a valid email from Clerk - this prevents duplicate/invalid admins
            if (!finalEmail || finalEmail === 'unknown' || finalEmail.trim() === '' || finalEmail.includes('@snapfest.local')) {
              console.error('❌ requireAdminClerk: Cannot create admin user - invalid or missing email', {
                userId: userId,
                email: finalEmail,
                reason: !finalEmail ? 'No email' : finalEmail.includes('@snapfest.local') ? 'Generated email' : 'Invalid email'
              });
              
              // Don't create admin user - return error instead
              return res.status(400).json({
                success: false,
                error: 'Invalid admin account',
                message: 'Admin accounts must have a valid email address. Please ensure your Clerk account has an email address.'
              });
            }
            
            // Check if user exists with this email (might have been created by sync endpoint)
            const existingUserByEmail = await User.findOne({ email: finalEmail.toLowerCase().trim() });
            if (existingUserByEmail && existingUserByEmail.clerkId !== userId) {
              // Email conflict - don't create duplicate
              console.error('❌ requireAdminClerk: Email conflict - user already exists with this email', {
                userId: userId,
                email: finalEmail,
                existingUserId: existingUserByEmail._id,
                existingClerkId: existingUserByEmail.clerkId
              });
              
              return res.status(400).json({
                success: false,
                error: 'Email conflict',
                message: 'An account with this email already exists. Please use a different email address.'
              });
            }
            
            // Use findOneAndUpdate with upsert for atomic operation (handles race conditions)
            user = await User.findOneAndUpdate(
              { clerkId: userId }, // Query
              {
                $setOnInsert: { // Only set these fields on insert (not on update)
                  clerkId: userId,
                  name: finalName || 'Admin',
                  email: finalEmail.toLowerCase().trim(),
                  role: 'admin',
                  isActive: true
                }
              },
              {
                upsert: true, // Create if doesn't exist
                new: true, // Return updated document
                runValidators: true // Run schema validators
              }
            );
          }
          
          console.log('✅ requireAdminClerk: Created/found admin user in database', {
            userId: user._id,
            clerkId: userId,
            email: user.email,
            name: user.name,
            wasCreated: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime()) < 5000
          });
        } catch (createError) {
          // Handle duplicate key errors specifically
          if (createError.code === 11000 || createError.name === 'MongoServerError') {
            // Duplicate key error - user might have been created by another request
            // Try to find the user again
            user = await User.findOne({ clerkId: userId });
            if (user) {
              console.log('✅ requireAdminClerk: User found after duplicate key error (race condition handled)');
            } else {
              console.error('❌ requireAdminClerk: Duplicate key error but user not found:', {
                error: createError.message,
                userId: userId,
                email: email
              });
            }
          } else {
            console.error('❌ requireAdminClerk: Failed to create admin user:', {
              error: createError.message,
              stack: createError.stack,
              userId: userId,
              email: email,
              errorCode: createError.code,
              errorName: createError.name
            });
          }
        }
      }
      
      // CRITICAL: Final check - if user is still null, try to find again (might have been created by another request)
      if (!user) {
        user = await User.findOne({ clerkId: userId });
        if (user) {
          console.log('✅ requireAdminClerk: User found on final check (created by another process)');
        }
      }
      
      // Now user is guaranteed to exist (either found or created)
      if (user) {
        // Update email if it's missing or "unknown" and we have a valid email from Clerk
        if (email && (user.email === 'unknown' || !user.email || user.email === '')) {
          user.email = email.toLowerCase().trim();
          await user.save();
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Updated admin email from "unknown" to:', email);
          }
        }
        
        // Set req.userId and req.user for use in route handlers
        req.userId = user._id;  // MongoDB _id
        req.user = user;
        req.userRole = user.role;
      } else {
        // If user creation failed and user doesn't exist, return error
        console.error('❌ requireAdminClerk: Cannot proceed - user not found and creation failed');
        return res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to initialize admin user. Please try again.'
        });
      }
      
      // Grant access - set req.admin for audit/logging purposes
      req.admin = {
        email: email || user?.email || 'unknown',
        userId: userId,
        method: isAdminFromMetadata ? 'clerk-metadata' : 'clerk-db-fallback'
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Admin access granted via ${isAdminFromMetadata ? 'publicMetadata.role' : 'database role'} for userId:`, userId);
      }
      
      // Optional: Update admin audit log (non-blocking)
      await updateAdminAuditLog(userId, email || user?.email);
      
      return next();
    }

    // 5. Fallback check: ADMIN_EMAILS env var (optional)
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    if (adminEmailsEnv && email) {
      const adminEmails = adminEmailsEnv
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0);
      
      const normalizedEmail = email.toLowerCase().trim();
      
      if (adminEmails.includes(normalizedEmail)) {
        // Find user in database (already created via Clerk with role='admin')
        let user = await User.findOne({ clerkId: userId });
        
        // CRITICAL FIX: Create admin user if doesn't exist (same as above)
        // BUT: Check admin limit BEFORE creating new admin users
        if (!user) {
          try {
            // CRITICAL FIX: Check admin limit BEFORE creating admin user
            const adminCount = await User.countDocuments({ role: 'admin' });
            const maxAdmins = 2;
            
            if (adminCount >= maxAdmins) {
              // Admin limit reached - check if this user is already an admin
              const existingAdmin = await User.findOne({ clerkId: userId, role: 'admin' });
              
              if (!existingAdmin) {
                // User doesn't exist and limit is reached - block admin creation
                console.error('❌ requireAdminClerk: Admin limit reached - cannot create admin user (ADMIN_EMAILS fallback)', {
                  adminCount,
                  maxAdmins,
                  userId: userId,
                  reason: 'ADMIN_LIMIT_REACHED'
                });
                
                return res.status(403).json({
                  success: false,
                  message: 'You are not authorized for this. Maximum admin limit (2) has been reached.',
                  code: 'ADMIN_LIMIT_REACHED'
                });
              }
              
              // User exists as admin - use it
              user = existingAdmin;
            } else {
              // Admin limit not reached - proceed with user creation
              // Fetch user details from Clerk if email/name not available
              let finalEmail = email;
              let finalName = null;
              
              if (!finalEmail || !finalName) {
                const clerkClient = getClerkClient();
                const clerkUser = await clerkClient.users.getUser(userId);
                
                if (!finalEmail) {
                  finalEmail = clerkUser.emailAddresses?.find(email => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
                              clerkUser.emailAddresses?.[0]?.emailAddress ||
                              clerkUser.emailAddress ||
                              null;
                }
                
                if (!finalName) {
                  finalName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 
                             finalEmail?.split('@')[0] || 
                             'Admin';
                }
              }
              
              // CRITICAL FIX: Do NOT create admin users with generated emails
              // Admins MUST have a valid email from Clerk - this prevents duplicate/invalid admins
              if (!finalEmail || finalEmail === 'unknown' || finalEmail.trim() === '' || finalEmail.includes('@snapfest.local')) {
                console.error('❌ requireAdminClerk: Cannot create admin user - invalid or missing email', {
                  userId: userId,
                  email: finalEmail,
                  reason: !finalEmail ? 'No email' : finalEmail.includes('@snapfest.local') ? 'Generated email' : 'Invalid email'
                });
                
                // Don't create admin user - return error instead
                return res.status(400).json({
                  success: false,
                  error: 'Invalid admin account',
                  message: 'Admin accounts must have a valid email address. Please ensure your Clerk account has an email address.'
                });
              }
              
              // Check if user exists with this email (might have been created by sync endpoint)
              const existingUserByEmail = await User.findOne({ email: finalEmail.toLowerCase().trim() });
              if (existingUserByEmail && existingUserByEmail.clerkId !== userId) {
                // Email conflict - don't create duplicate
                console.error('❌ requireAdminClerk: Email conflict - user already exists with this email', {
                  userId: userId,
                  email: finalEmail,
                  existingUserId: existingUserByEmail._id,
                  existingClerkId: existingUserByEmail.clerkId
                });
                
                return res.status(400).json({
                  success: false,
                  error: 'Email conflict',
                  message: 'An account with this email already exists. Please use a different email address.'
                });
              }
              
              // Use findOneAndUpdate with upsert for atomic operation (handles race conditions)
              user = await User.findOneAndUpdate(
                { clerkId: userId }, // Query
                {
                  $setOnInsert: { // Only set these fields on insert (not on update)
                    clerkId: userId,
                    name: finalName || 'Admin',
                    email: finalEmail.toLowerCase().trim(),
                    role: 'admin',
                    isActive: true
                  }
                },
                {
                  upsert: true, // Create if doesn't exist
                  new: true, // Return updated document
                  runValidators: true // Run schema validators
                }
              );
            }
            
            console.log('✅ requireAdminClerk: Created/found admin user via email fallback', {
              userId: user._id,
              clerkId: userId,
              email: user.email,
              name: user.name,
              wasCreated: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime()) < 5000
            });
          } catch (createError) {
            // Handle duplicate key errors specifically
            if (createError.code === 11000 || createError.name === 'MongoServerError') {
              // Duplicate key error - user might have been created by another request
              // Try to find the user again
              user = await User.findOne({ clerkId: userId });
              if (user) {
                console.log('✅ requireAdminClerk: User found after duplicate key error (email fallback - race condition handled)');
              } else {
                console.error('❌ requireAdminClerk: Duplicate key error but user not found (email fallback):', {
                  error: createError.message,
                  userId: userId,
                  email: email
                });
              }
            } else {
              console.error('❌ requireAdminClerk: Failed to create admin user via email fallback:', {
                error: createError.message,
                stack: createError.stack,
                userId: userId,
                email: email,
                errorCode: createError.code,
                errorName: createError.name
              });
            }
          }
        }
        
        // CRITICAL: Final check - if user is still null, try to find again (might have been created by another request)
        if (!user) {
          user = await User.findOne({ clerkId: userId });
          if (user) {
            console.log('✅ requireAdminClerk: User found on final check (email fallback - created by another process)');
          }
        }
        
        if (user) {
          // Update email if it's missing or "unknown" and we have a valid email from Clerk
          // Also update if email is the generated clerkId-based email
          if (email && (user.email === 'unknown' || !user.email || user.email === '' || user.email.includes('@snapfest.local'))) {
            user.email = email.toLowerCase().trim();
            await user.save();
            
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Updated admin email from "unknown" to:', email);
            }
          }
          
          // Set req.userId and req.user for use in route handlers
          req.userId = user._id;  // MongoDB _id
          req.user = user;
          req.userRole = user.role;
        } else {
          // If user creation failed and user doesn't exist, return error
          console.error('❌ requireAdminClerk: Cannot proceed - user not found and creation failed (email fallback)');
          return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to initialize admin user. Please try again.'
          });
        }
        
        // Grant access via email fallback
        req.admin = {
          email: email,
          userId: userId,
          method: 'clerk-email-fallback'
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Admin access granted via ADMIN_EMAILS fallback for:', email);
        }
        
        // Optional: Update admin audit log (non-blocking)
        await updateAdminAuditLog(userId, email);
        
        return next();
      }
    }

    // 6. Access denied - authenticated but not admin
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Admin access denied for userId:', userId, 'email:', email);
      console.log('   publicMetadata:', publicMetadata);
    }
    
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      message: 'You do not have permission to access this resource. Admin role required.'
    });

  } catch (error) {
    console.error('❌ Error in requireAdminClerk middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify admin access.'
    });
  }
};

/**
 * Optional: Update admin audit log (non-blocking)
 * Creates or updates an Admin document in MongoDB for audit purposes.
 * Does NOT store passwords - only audit fields.
 * 
 * @param {string} userId - Clerk user ID
 * @param {string} email - User email address
 */
async function updateAdminAuditLog(userId, email) {
  try {
    // Dynamic import to avoid circular dependencies and keep it optional
    const { User } = await import('../models/index.js');
    
    // Update admin user's lastLogin (admin users are stored in User collection with role='admin')
    await User.findOneAndUpdate(
      { clerkId: userId, role: 'admin' },
      { 
        $set: { 
          email: email || 'unknown',
          lastLogin: new Date() 
        }
      },
      { upsert: false }
    );
  } catch (auditError) {
    // Non-blocking - don't fail request if audit write fails
    // This ensures DB outages don't block admin operations
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Failed to update admin audit log (non-blocking):', auditError.message);
    }
  }
}
