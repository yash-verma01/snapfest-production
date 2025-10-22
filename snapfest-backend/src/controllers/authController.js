import { User } from '../models/index.js';
import AuthService from '../services/authService.js';
import PasswordService from '../services/passwordService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuditLog } from '../models/index.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'user' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email or phone number'
    });
  }

  // Validate password strength
  const passwordValidation = PasswordService.validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: passwordValidation.message
    });
  }

  // Check for common passwords
  if (PasswordService.isCommonPassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password is too common. Please choose a stronger password.'
    });
  }

  // Hash password in controller (business logic)
  const hashedPassword = await PasswordService.hashPassword(password);

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role
  });

  // Generate token
  const token = AuthService.generateToken(user._id, user.role);

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: user._id,
  //     action: 'REGISTER',
  //     targetId: user._id,
  //     description: 'User registered successfully'
  //   });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage
      },
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }

  // Check password in controller (business logic)
  const isPasswordValid = await PasswordService.comparePassword(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = AuthService.generateToken(user._id, user.role);

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: user._id,
  //     action: 'LOGIN',
  //     targetId: user._id,
  //     description: 'User logged in successfully'
  //   });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        lastLogin: user.lastLogin
      },
      token
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('-password');

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profileImage } = req.body;

  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if phone number is already taken by another user
  if (phone && phone !== user.phone) {
    const existingUser = await User.findOne({ phone, _id: { $ne: req.userId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already taken'
      });
    }
  }

  // Update user
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (profileImage) user.profileImage = profileImage;

  await user.save();

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'UPDATE',
  //     targetId: req.userId,
  //     description: 'User profile updated'
  //   });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage
      }
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check current password in controller (business logic)
  const isCurrentPasswordValid = await PasswordService.comparePassword(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Validate new password strength
  const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: passwordValidation.message
    });
  }

  // Hash new password in controller (business logic)
  const hashedNewPassword = await PasswordService.hashPassword(newPassword);

  // Update password
  user.password = hashedNewPassword;
  await user.save();

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'UPDATE',
  //     targetId: req.userId,
  //     description: 'User password changed'
  //   });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found with this email'
    });
  }

  // Generate reset token
  const resetToken = AuthService.generatePasswordResetToken(user._id);

  // Save reset token to user
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  // Send email with reset token
  try {
    const emailService = await import('../services/emailService.js');
    await emailService.default.sendPasswordResetEmail(user.email, user.name, resetToken);
    console.log('✅ Password reset email sent to:', user.email);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    // Still return success to user, but log the error
  }

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: user._id,
  //     action: 'FORGOT_PASSWORD',
  //     targetId: user._id,
  //     description: 'Password reset requested'
  //   });

  res.status(200).json({
    success: true,
    message: 'Password reset token sent to email',
    // Remove this in production
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // Verify token
  const decoded = AuthService.verifyPasswordResetToken(token);

  const user = await User.findOne({
    _id: decoded.userId,
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Validate new password strength
  const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: passwordValidation.message
    });
  }

  // Hash new password in controller (business logic)
  const hashedNewPassword = await PasswordService.hashPassword(newPassword);

  // Update password
  user.password = hashedNewPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: user._id,
  //     action: 'RESET_PASSWORD',
  //     targetId: user._id,
  //     description: 'Password reset successfully'
  //   });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'LOGOUT',
  //     targetId: req.userId,
  //     description: 'User logged out'
  //   });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Verify token
// @route   GET /api/auth/verify-token
// @access  Private
export const verifyToken = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profileImage: req.user.profileImage
      }
    }
  });
});
