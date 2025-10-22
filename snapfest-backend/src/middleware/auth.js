import AuthService from '../services/authService.js';
import { User } from '../models/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = AuthService.verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Add user to request object
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
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

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = AuthService.verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
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

// Validate token and return user info
export const validateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const user = await AuthService.getUserFromToken(token);
    
    return res.status(200).json({
      success: true,
      message: 'Token is valid',
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
      message: 'Invalid token',
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
