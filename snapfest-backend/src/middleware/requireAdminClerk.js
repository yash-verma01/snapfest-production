import { getAuth } from '@clerk/express';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { User } from '../models/index.js';

// Note: dotenv.config() is already called in server.js
// No need to reload environment variables here

// Create clerkClient instances for each portal with correct secret keys
const getUserClerkClient = () => createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY_USER 
});

const getVendorClerkClient = () => createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY_VENDOR 
});

const getAdminClerkClient = () => createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY_ADMIN 
});

// Helper function to get the correct clerkClient based on origin
const getClerkClientForOrigin = (origin) => {
  if (!origin) return getUserClerkClient(); // Default to user
  
  if (origin.includes('localhost:3001') || origin.includes(':3001')) {
    return getVendorClerkClient();
  } else if (origin.includes('localhost:3002') || origin.includes(':3002')) {
    return getAdminClerkClient();
  } else {
    return getUserClerkClient(); // Default to user for port 3000 or unknown
  }
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
    // 1. Check Clerk session exists
    // Try getAuth(req) first, then fallback to req.auth() as function
    let clerkAuth = getAuth(req);
    
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
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      // Always log for admin routes to debug
      console.log('🔍 requireAdminClerk: Admin route accessed');
      console.log('   Path:', req.path);
      console.log('   Original URL:', req.originalUrl);
      console.log('   Origin:', req.headers.origin || req.headers.referer || 'missing');
      console.log('   Host:', req.get('host'));
      console.log('   Portal type:', req._portalType || 'unknown');
      console.log('   Cookie prefix:', req._cookiePrefix || 'unknown');
      console.log('   Cookies present:', Object.keys(req.cookies || {}));
      console.log('   __session_admin cookie:', req.cookies?.__session_admin ? 'present (' + req.cookies.__session_admin.substring(0, 20) + '...)' : 'missing');
      console.log('   __session cookie:', req.cookies?.__session ? 'present (' + req.cookies.__session.substring(0, 20) + '...)' : 'missing');
      console.log('   Cookie header:', req.headers.cookie ? 'present' : 'missing');
      
      if (!clerkAuth?.userId) {
        console.log('❌ requireAdminClerk: No Clerk session found');
        console.log('   getAuth(req).isAuthenticated:', getAuth(req).isAuthenticated);
        console.log('   getAuth(req).userId:', getAuth(req).userId);
        console.log('   req.auth type:', typeof req.auth);
        console.log('   req.auth value:', req.auth);
        if (typeof req.auth === 'function') {
          try {
            console.log('   req.auth() result:', req.auth());
          } catch (e) {
            console.log('   req.auth() error:', e.message);
          }
        }
      } else {
        console.log('✅ requireAdminClerk: Clerk session found');
        console.log('   userId:', clerkAuth.userId);
        console.log('   isAuthenticated:', clerkAuth.isAuthenticated);
      }
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
        // Get the correct clerkClient based on origin
        const origin = req.headers.origin || req.headers.referer || '';
        const clerkClient = getClerkClientForOrigin(origin);
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
          console.log('📋 Fetched publicMetadata and email from Clerk API for userId:', userId, 'origin:', origin);
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
          // Get origin for clerk client selection
          const origin = req.headers.origin || req.headers.referer || '';
          const clerkClient = getClerkClientForOrigin(origin);
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
      const user = await User.findOne({ clerkId: userId });
      
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
        const user = await User.findOne({ clerkId: userId });
        
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
