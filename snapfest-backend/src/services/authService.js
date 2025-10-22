import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// JWT Authentication Service
class AuthService {
  // Generate JWT token
  static generateToken(userId, role) {
    const payload = {
      userId,
      role,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Generate refresh token
  static generateRefreshToken(userId) {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
  }

  // Verify refresh token
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Get user from token
  static async getUserFromToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isActive === false) {
        throw new Error('User account is deactivated');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token or user not found');
    }
  }

  // Check if user has required role
  static hasRole(userRole, requiredRole) {
    const roleHierarchy = {
      'user': 1,
      'vendor': 2,
      'admin': 3
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  // Check if user can access resource
  static canAccess(userId, resourceUserId, userRole, requiredRole) {
    // Admin can access everything
    if (userRole === 'admin') {
      return true;
    }

    // User can only access their own resources
    if (userId.toString() === resourceUserId.toString()) {
      return this.hasRole(userRole, requiredRole);
    }

    return false;
  }

  // Generate password reset token
  static generatePasswordResetToken(userId) {
    const payload = {
      userId,
      type: 'password_reset',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
  }

  // Verify password reset token
  static verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid password reset token');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired password reset token');
    }
  }

  // Generate email verification token
  static generateEmailVerificationToken(userId) {
    const payload = {
      userId,
      type: 'email_verification',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });
  }

  // Verify email verification token
  static verifyEmailVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid email verification token');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired email verification token');
    }
  }
}

export default AuthService;
