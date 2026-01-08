import { User } from '../models/index.js';
import { getAuth } from '@clerk/express';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { asyncHandler } from '../middleware/errorHandler.js';

// Create Clerk clients for each role using different secret keys
// Single Clerk client instance (no port-based routing)
const getClerkClient = () => createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY_USER
});

/**
 * User Authentication Controller
 * Uses CLERK_SECRET_KEY_USER
 */
export const userAuth = {
  // @desc    Get current user (validates Clerk session)
  // @route   GET /api/auth/user/me
  // @access  Private (User role)
  getMe: asyncHandler(async (req, res) => {
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please sign in.'
      });
    }

    // Get role parameter from query string (optional but recommended)
    const requestedRole = req.query.role || 'user';
    
    // Use User Clerk client
    const clerkClient = getClerkClient();
    const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
    
    // CRITICAL: Check Clerk publicMetadata for role
    // Prevent vendors/admins from accessing user endpoints
    const publicMetadata = clerkUser.publicMetadata || {};
    const userRole = publicMetadata?.role || 'user';
    
    // Validate role parameter matches Clerk metadata role
    if (requestedRole && requestedRole !== 'user') {
      return res.status(400).json({
        success: false,
        message: `Invalid role parameter. Expected 'user', got '${requestedRole}'. Please use the appropriate endpoint.`
      });
    }
    
    // If user has vendor or admin role in Clerk, reject access to user endpoint
    if (userRole === 'vendor' || userRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: `Access denied. User role required. Your role is: ${userRole}. Please use the appropriate endpoint.`
      });
    }
    
    // Verify role parameter matches Clerk metadata (if provided)
    if (requestedRole && userRole !== requestedRole) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch. Requested role: ${requestedRole}, but your Clerk role is: ${userRole}.`
      });
    }
    
    // Get or create user in local database
    let user = await User.findOne({ clerkId: clerkAuth.userId });
    
    if (!user) {
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                   clerkUser.primaryEmailAddressId ? 
                   clerkUser.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress : null;
      
      const name = clerkUser.firstName && clerkUser.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser.firstName || clerkUser.lastName || email?.split('@')[0] || 'User';
      
      user = await User.create({
        clerkId: clerkAuth.userId,
        name,
        email: email?.toLowerCase().trim() || '',
        role: 'user',
        isActive: true
      });
    } else {
      // Verify user has user role - don't allow role switching
      if (user.role !== 'user') {
        return res.status(403).json({
          success: false,
          message: `Access denied. User role required. Your current role is: ${user.role}. Please use the appropriate endpoint.`
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'User authenticated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          clerkId: user.clerkId
        },
        clerkUser: {
          id: clerkUser.id,
          emailAddresses: clerkUser.emailAddresses?.map(e => e.emailAddress) || [],
          publicMetadata: clerkUser.publicMetadata || {}
        }
      }
    });
  }),

  // @desc    Validate user session
  // @route   GET /api/auth/user/validate
  // @access  Private (User role)
  validate: asyncHandler(async (req, res) => {
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Get role parameter from query string (optional but recommended)
    const requestedRole = req.query.role || 'user';
    
    // Validate role parameter
    if (requestedRole && requestedRole !== 'user') {
      return res.status(400).json({
        success: false,
        message: `Invalid role parameter. Expected 'user', got '${requestedRole}'.`
      });
    }

    const clerkClient = getClerkClient();
    const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
    
    // Check Clerk publicMetadata for role
    const publicMetadata = clerkUser.publicMetadata || {};
    const userRole = publicMetadata?.role || 'user';
    
    // Verify role parameter matches Clerk metadata
    if (requestedRole && userRole !== requestedRole) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch. Requested role: ${requestedRole}, but your Clerk role is: ${userRole}.`
      });
    }
    
    const user = await User.findOne({ clerkId: clerkAuth.userId });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session is valid',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  }),

  // @desc    Get user session info
  // @route   GET /api/auth/user/session
  // @access  Private (User role)
  getSession: asyncHandler(async (req, res) => {
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'No active session'
      });
    }

    // Get role parameter from query string (optional but recommended)
    const requestedRole = req.query.role || 'user';
    
    // Validate role parameter
    if (requestedRole && requestedRole !== 'user') {
      return res.status(400).json({
        success: false,
        message: `Invalid role parameter. Expected 'user', got '${requestedRole}'.`
      });
    }

    const clerkClient = getClerkClient();
    const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
    
    // Check Clerk publicMetadata for role
    const publicMetadata = clerkUser.publicMetadata || {};
    const userRole = publicMetadata?.role || 'user';
    
    // Verify role parameter matches Clerk metadata
    if (requestedRole && userRole !== requestedRole) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch. Requested role: ${requestedRole}, but your Clerk role is: ${userRole}.`
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        session: {
          userId: clerkAuth.userId,
          sessionId: clerkAuth.sessionId,
          isAuthenticated: clerkAuth.isAuthenticated
        },
        clerkUser: {
          id: clerkUser.id,
          emailAddresses: clerkUser.emailAddresses?.map(e => e.emailAddress) || [],
          publicMetadata: clerkUser.publicMetadata || {}
        }
      }
    });
  })
};

/**
 * Vendor Authentication Controller
 * Uses CLERK_SECRET_KEY_VENDOR
 */
export const vendorAuth = {
  // @desc    Get current vendor (validates Clerk session)
  // @route   GET /api/auth/vendor/me
  // @access  Private (Vendor role)
  getMe: asyncHandler(async (req, res) => {
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please sign in.'
      });
    }

    // Get role parameter from query string (optional but recommended)
    const requestedRole = req.query.role || 'vendor';
    
    // Use Vendor Clerk client
    const clerkClient = getClerkClient();
    const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
    
    // CRITICAL: Check Clerk publicMetadata for vendor role FIRST
    // This prevents unauthorized role switching
    const publicMetadata = clerkUser.publicMetadata || {};
    const hasVendorRole = publicMetadata?.role === 'vendor';
    
    // Validate role parameter matches expected vendor role
    if (requestedRole && requestedRole !== 'vendor') {
      return res.status(400).json({
        success: false,
        message: `Invalid role parameter. Expected 'vendor', got '${requestedRole}'. Please use the appropriate endpoint.`
      });
    }
    
    if (!hasVendorRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Vendor role required. Please ensure your Clerk account has role: vendor in public metadata.'
      });
    }
    
    // Verify role parameter matches Clerk metadata (if provided)
    if (requestedRole && publicMetadata?.role !== requestedRole) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch. Requested role: ${requestedRole}, but your Clerk role is: ${publicMetadata?.role || 'none'}.`
      });
    }
    
    // Get or create user in local database
    let user = await User.findOne({ clerkId: clerkAuth.userId });
    
    if (!user) {
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                   clerkUser.primaryEmailAddressId ? 
                   clerkUser.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress : null;
      
      const name = clerkUser.firstName && clerkUser.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser.firstName || clerkUser.lastName || email?.split('@')[0] || 'Vendor';
      
      user = await User.create({
        clerkId: clerkAuth.userId,
        name,
        email: email?.toLowerCase().trim() || '',
        role: 'vendor',
        isActive: true,
        businessName: `${name}'s Business`,
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
    } else {
      // Verify user has vendor role - don't allow role switching
      if (user.role !== 'vendor') {
        return res.status(403).json({
          success: false,
          message: `Access denied. Vendor role required. Your current role is: ${user.role}. Please use the appropriate endpoint.`
        });
      }
      
      // Ensure vendor-specific fields exist
      if (!user.businessName) {
        user.businessName = `${user.name}'s Business`;
        user.servicesOffered = [];
        user.experience = 0;
        user.availability = 'AVAILABLE';
        user.profileComplete = false;
        user.earningsSummary = {
          totalEarnings: 0,
          thisMonthEarnings: 0,
          totalBookings: 0
        };
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Vendor authenticated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          clerkId: user.clerkId,
          businessName: user.businessName,
          servicesOffered: user.servicesOffered,
          experience: user.experience,
          availability: user.availability,
          profileComplete: user.profileComplete,
          earningsSummary: user.earningsSummary
        },
        clerkUser: {
          id: clerkUser.id,
          emailAddresses: clerkUser.emailAddresses?.map(e => e.emailAddress) || [],
          publicMetadata: clerkUser.publicMetadata || {}
        }
      }
    });
  }),

  // @desc    Validate vendor session
  // @route   GET /api/auth/vendor/validate
  // @access  Private (Vendor role)
  validate: asyncHandler(async (req, res) => {
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Get role parameter from query string (optional but recommended)
    const requestedRole = req.query.role || 'vendor';
    
    // Validate role parameter
    if (requestedRole && requestedRole !== 'vendor') {
      return res.status(400).json({
        success: false,
        message: `Invalid role parameter. Expected 'vendor', got '${requestedRole}'.`
      });
    }

    const clerkClient = getClerkClient();
    const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
    
    // Check Clerk publicMetadata for role
    const publicMetadata = clerkUser.publicMetadata || {};
    const vendorRole = publicMetadata?.role || null;
    
    // Verify role parameter matches Clerk metadata
    if (requestedRole && vendorRole !== requestedRole) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch. Requested role: ${requestedRole}, but your Clerk role is: ${vendorRole || 'none'}.`
      });
    }
    
    const user = await User.findOne({ clerkId: clerkAuth.userId });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Vendor not found or inactive'
      });
    }

    if (user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Vendor role required.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session is valid',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          businessName: user.businessName
        }
      }
    });
  }),

  // @desc    Get vendor session info
  // @route   GET /api/auth/vendor/session
  // @access  Private (Vendor role)
  getSession: asyncHandler(async (req, res) => {
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'No active session'
      });
    }

    // Get role parameter from query string (optional but recommended)
    const requestedRole = req.query.role || 'vendor';
    
    // Validate role parameter
    if (requestedRole && requestedRole !== 'vendor') {
      return res.status(400).json({
        success: false,
        message: `Invalid role parameter. Expected 'vendor', got '${requestedRole}'.`
      });
    }

    const clerkClient = getClerkClient();
    const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
    
    // Check Clerk publicMetadata for role
    const publicMetadata = clerkUser.publicMetadata || {};
    const vendorRole = publicMetadata?.role || null;
    
    // Verify role parameter matches Clerk metadata
    if (requestedRole && vendorRole !== requestedRole) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch. Requested role: ${requestedRole}, but your Clerk role is: ${vendorRole || 'none'}.`
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        session: {
          userId: clerkAuth.userId,
          sessionId: clerkAuth.sessionId,
          isAuthenticated: clerkAuth.isAuthenticated
        },
        clerkUser: {
          id: clerkUser.id,
          emailAddresses: clerkUser.emailAddresses?.map(e => e.emailAddress) || [],
          publicMetadata: clerkUser.publicMetadata || {}
        }
      }
    });
  })
};

/**
 * Admin Authentication Controller
 * Uses CLERK_SECRET_KEY_ADMIN
 */
export const adminAuth = {
  // @desc    Get current admin (validates Clerk session)
  // @route   GET /api/auth/admin/me
  // @access  Private (Admin role)
  getMe: asyncHandler(async (req, res) => {
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please sign in.'
      });
    }

    // Get role parameter from query string (optional but recommended)
    const requestedRole = req.query.role || 'admin';
    
    // Use Admin Clerk client
    const clerkClient = getClerkClient();
    const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
    
    // CRITICAL: Check Clerk publicMetadata for admin role
    const publicMetadata = clerkUser.publicMetadata || {};
    const clerkRole = publicMetadata?.role || null;
    
    // Validate role parameter matches expected admin role
    if (requestedRole && requestedRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `Invalid role parameter. Expected 'admin', got '${requestedRole}'. Please use the appropriate endpoint.`
      });
    }
    
    // Get or create user in local database
    let user = await User.findOne({ clerkId: clerkAuth.userId });
    
    // Check if this should be an admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin100@gmail.com';
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    const adminEmails = adminEmailsEnv ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase()) : [];
    
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                 clerkUser.primaryEmailAddressId ? 
                 clerkUser.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress : null;
    
    const normalizedEmail = email?.toLowerCase().trim() || '';
    const isAdminEmail = normalizedEmail === adminEmail.toLowerCase() || 
                        adminEmails.includes(normalizedEmail) ||
                        clerkRole === 'admin';
    
    // Verify role parameter matches Clerk metadata (if provided)
    if (requestedRole && clerkRole !== requestedRole && !isAdminEmail) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch. Requested role: ${requestedRole}, but your Clerk role is: ${clerkRole || 'none'}.`
      });
    }
    
    if (!user) {
      const name = clerkUser.firstName && clerkUser.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser.firstName || clerkUser.lastName || email?.split('@')[0] || 'Admin';
      
      user = await User.create({
        clerkId: clerkAuth.userId,
        name,
        email: normalizedEmail,
        role: isAdminEmail ? 'admin' : 'user',
        isActive: true
      });
    } else if (isAdminEmail && user.role !== 'admin') {
      // Update role to admin if it's an admin email
      user.role = 'admin';
      await user.save();
    }

    // Verify admin role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin authenticated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          clerkId: user.clerkId
        },
        clerkUser: {
          id: clerkUser.id,
          emailAddresses: clerkUser.emailAddresses?.map(e => e.emailAddress) || [],
          publicMetadata: clerkUser.publicMetadata || {}
        }
      }
    });
  }),

  // @desc    Validate admin session
  // @route   GET /api/auth/admin/validate
  // @access  Private (Admin role)
  validate: asyncHandler(async (req, res) => {
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Get role parameter from query string (optional but recommended)
    const requestedRole = req.query.role || 'admin';
    
    // Validate role parameter
    if (requestedRole && requestedRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `Invalid role parameter. Expected 'admin', got '${requestedRole}'.`
      });
    }

    const clerkClient = getClerkClient();
    const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
    
    // Check Clerk publicMetadata for role
    const publicMetadata = clerkUser.publicMetadata || {};
    const clerkRole = publicMetadata?.role || null;
    
    // Check if this should be an admin user (email-based)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin100@gmail.com';
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    const adminEmails = adminEmailsEnv ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase()) : [];
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                 clerkUser.primaryEmailAddressId ? 
                 clerkUser.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress : null;
    const normalizedEmail = email?.toLowerCase().trim() || '';
    const isAdminEmail = normalizedEmail === adminEmail.toLowerCase() || adminEmails.includes(normalizedEmail);
    
    // Verify role parameter matches Clerk metadata (if provided)
    if (requestedRole && clerkRole !== requestedRole && !isAdminEmail) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch. Requested role: ${requestedRole}, but your Clerk role is: ${clerkRole || 'none'}.`
      });
    }
    
    const user = await User.findOne({ clerkId: clerkAuth.userId });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found or inactive'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session is valid',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  }),

  // @desc    Get admin session info
  // @route   GET /api/auth/admin/session
  // @access  Private (Admin role)
  getSession: asyncHandler(async (req, res) => {
    const clerkAuth = getAuth(req);
    
    if (!clerkAuth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'No active session'
      });
    }

    // Get role parameter from query string (optional but recommended)
    const requestedRole = req.query.role || 'admin';
    
    // Validate role parameter
    if (requestedRole && requestedRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `Invalid role parameter. Expected 'admin', got '${requestedRole}'.`
      });
    }

    const clerkClient = getClerkClient();
    const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
    
    // Check Clerk publicMetadata for role
    const publicMetadata = clerkUser.publicMetadata || {};
    const clerkRole = publicMetadata?.role || null;
    
    // Check if this should be an admin user (email-based)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin100@gmail.com';
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    const adminEmails = adminEmailsEnv ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase()) : [];
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                 clerkUser.primaryEmailAddressId ? 
                 clerkUser.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress : null;
    const normalizedEmail = email?.toLowerCase().trim() || '';
    const isAdminEmail = normalizedEmail === adminEmail.toLowerCase() || adminEmails.includes(normalizedEmail);
    
    // Verify role parameter matches Clerk metadata (if provided)
    if (requestedRole && clerkRole !== requestedRole && !isAdminEmail) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch. Requested role: ${requestedRole}, but your Clerk role is: ${clerkRole || 'none'}.`
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        session: {
          userId: clerkAuth.userId,
          sessionId: clerkAuth.sessionId,
          isAuthenticated: clerkAuth.isAuthenticated
        },
        clerkUser: {
          id: clerkUser.id,
          emailAddresses: clerkUser.emailAddresses?.map(e => e.emailAddress) || [],
          publicMetadata: clerkUser.publicMetadata || {}
        }
      }
    });
  })
};

