import { User, Booking, Payment, Cart, AuditLog, Review, OTP } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeSearchQuery, createSafeRegex } from '../utils/securityUtils.js';
import PasswordService from '../services/passwordService.js';
import AuthService from '../services/authService.js';
import { profileResponse, successResponse, errorResponse } from '../utils/responseFormat.js';
import crypto from 'crypto';

// ==================== USER-FOCUSED CONTROLLERS ====================

// @desc    Register user
// @route   POST /api/users/register
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

  // Send welcome email
  try {
    const getEmailService = (await import('../services/emailService.js')).default;
    await getEmailService().sendWelcomeEmail(user.email, user.name);
    console.log('✅ Welcome email sent to:', user.email);
  } catch (emailError) {
    console.error('❌ Failed to send welcome email:', emailError);
    // Don't fail registration if email fails
  }

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
        profileImage: user.profileImage,
        address: user.address,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      },
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/users/login
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
        address: user.address,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        lastLogin: user.lastLogin
      },
      token
    }
  });
});

// @desc    Logout user
// @route   POST /api/users/logout
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

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  // Clerk handles authentication - removed old auth fields (isEmailVerified, password, etc.)
  const user = await User.findById(req.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  console.log('🔍 Backend getProfile - user.address:', user.address);
  console.log('🔍 Backend getProfile - full user object:', {
    id: user._id,
    name: user.name,
    email: user.email,
    address: user.address
  });

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        clerkId: user.clerkId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        address: user.address,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profileImage, address } = req.body;
  console.log('🔍 Received profile update data:', { name, phone, profileImage, address });

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
  if (address) {
    console.log('🔍 Received address:', address);
    console.log('🔍 Current user.address before update:', user.address);
    
    // Initialize address object if it doesn't exist
    if (!user.address) {
      user.address = {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      };
    }
    
    // Explicitly set each address field to ensure proper saving
    user.address.street = address.street || '';
    user.address.city = address.city || '';
    user.address.state = address.state || '';
    user.address.pincode = address.pincode || '';
    user.address.country = address.country || 'India';
    
    console.log('🔍 Address after setting:', user.address);
    // Mark the address subdocument as modified
    user.markModified('address');
  }

  await user.save();
  console.log('🔍 User saved with address:', user.address);

  // Update Clerk user's firstName and lastName if name was updated
  if (name) {
    try {
      const { getAuth } = await import('@clerk/express');
      const { createClerkClient } = await import('@clerk/clerk-sdk-node');
      
      const getClerkClient = () => createClerkClient({ 
        secretKey: process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY_USER
      });
      
      const clerkAuth = getAuth(req);
      if (clerkAuth?.userId) {
        const clerkClient = getClerkClient();
        
        // Split name into firstName and lastName
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Update Clerk user
        await clerkClient.users.updateUser(clerkAuth.userId, {
          firstName: firstName,
          lastName: lastName
        });
        
        console.log('✅ Updated Clerk user name:', { firstName, lastName });
      }
    } catch (clerkError) {
      console.error('❌ Failed to update Clerk user name:', clerkError);
      // Don't fail the request if Clerk update fails - database is already updated
    }
  }

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'UPDATE',
  //     targetId: req.userId,
  //     description: 'User profile updated'
  //   });

  console.log('🔍 Backend: Final user object before response:', {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    address: user.address
  });

  res.status(200).json(profileResponse(
    'Profile updated successfully',
    {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      address: user.address
    }
  ));
});

// @desc    Change password
// @route   PUT /api/users/change-password
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

// @desc    Get user dashboard
// @route   GET /api/users/dashboard
// @access  Private
export const getUserDashboard = asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Get user stats
  const totalBookings = await Booking.countDocuments({ userId });
  const activeBookings = await Booking.countDocuments({ 
    userId, 
    vendorStatus: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
  });
  const completedBookings = await Booking.countDocuments({ 
    userId, 
    vendorStatus: 'COMPLETED' 
  });

  // Get recent bookings
  const recentBookings = await Booking.find({ userId })
    .populate('packageId', 'title category basePrice')
    .sort({ _id: -1 })
    .limit(5);

  // Get total spent
  const totalSpent = await Payment.aggregate([
    { $match: { userId, status: 'COMPLETED' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Get cart items count
  const cartItemsCount = await Cart.countDocuments({ userId });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalBookings,
        activeBookings,
        completedBookings,
        totalSpent: totalSpent[0]?.total || 0,
        cartItemsCount
      },
      recentBookings
    }
  });
});

// ==================== ADMIN CONTROLLERS ====================

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ _id: -1 });

  const total = await User.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
});

// @desc    Update user by ID
// @route   PUT /api/users/:id
// @access  Private
export const updateUserById = asyncHandler(async (req, res) => {
  const { name, phone, profileImage, isActive } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if phone number is already taken by another user
  if (phone && phone !== user.phone) {
    const existingUser = await User.findOne({ phone, _id: { $ne: req.params.id } });
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
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'UPDATE',
  //     targetId: user._id,
  //     description: `User ${user.name} updated by ${req.user.name}`
  //   });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isActive: user.isActive
      }
    }
  });
});

// @desc    Delete user by ID
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'DELETE',
  //     targetId: user._id,
  //     description: `User ${user.name} deleted by ${req.user.name}`
  //   });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Private/Admin
export const searchUsers = asyncHandler(async (req, res) => {
  const { q, role } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = {};

  // Search by name, email, or phone
  if (q) {
    // Sanitize search query to prevent NoSQL injection
    const sanitizedQuery = sanitizeSearchQuery(q);
    if (sanitizedQuery) {
      const safeRegex = createSafeRegex(sanitizedQuery);
      if (safeRegex) {
        query.$or = [
          { name: safeRegex },
          { email: safeRegex },
          { phone: safeRegex }
        ];
      }
    }
  }

  // Filter by role
  if (role) {
    query.role = role;
  }

  const users = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ _id: -1 });

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
export const getAdminUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const usersByRole = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const recentUsers = await User.find()
    .select('-password')
    .sort({ _id: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole,
      recentUsers
    }
  });
});

// ==================== ADDITIONAL USER ENDPOINTS ====================

// @desc    Get user's upcoming bookings
// @route   GET /api/users/bookings/upcoming
// @access  Private
export const getUpcomingBookings = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  console.log('📅 User Controller: Getting upcoming bookings for user:', userId);

  // First, let's see ALL bookings for this user
  const allUserBookings = await Booking.find({ userId }).select('vendorStatus eventDate createdAt');
  console.log('📅 User Controller: All user bookings:', allUserBookings.length);
  console.log('📅 User Controller: Booking vendor statuses:', allUserBookings.map(b => ({ vendorStatus: b.vendorStatus, eventDate: b.eventDate, createdAt: b.createdAt })));

  const currentDate = new Date();
  console.log('📅 User Controller: Current date:', currentDate);
  console.log('📅 User Controller: Looking for bookings with eventDate >=', currentDate);

  const upcomingBookings = await Booking.find({
    userId,
    eventDate: { $gte: new Date() },
    status: { $in: ['PENDING_PARTIAL_PAYMENT', 'PARTIALLY_PAID', 'ASSIGNED', 'IN_PROGRESS'] }
  })
    .populate('packageId', 'title category basePrice images')
    .populate('vendorId', 'businessName contactPhone')
    .sort({ eventDate: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments({
    userId,
    eventDate: { $gte: new Date() },
    status: { $in: ['PENDING_PARTIAL_PAYMENT', 'PARTIALLY_PAID', 'ASSIGNED', 'IN_PROGRESS'] }
  });

  console.log('📅 User Controller: Found upcoming bookings:', upcomingBookings.length);

  res.status(200).json({
    success: true,
    data: {
      bookings: upcomingBookings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get user's booking history
// @route   GET /api/users/bookings/history
// @access  Private
export const getBookingHistory = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  console.log('📅 User Controller: Getting booking history for user:', userId);

  const historyBookings = await Booking.find({
    userId,
    status: { $in: ['COMPLETED', 'CANCELLED'] }
  })
    .populate('packageId', 'title category basePrice images')
    .populate('vendorId', 'businessName contactPhone')
    .sort({ eventDate: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments({
    userId,
    status: { $in: ['COMPLETED', 'CANCELLED'] }
  });

  console.log('📅 User Controller: Found history bookings:', historyBookings.length);

  res.status(200).json({
    success: true,
    data: {
      bookings: historyBookings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get user's payment history with detailed breakdown
// @route   GET /api/users/payments
// @access  Private
export const getUserPayments = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  console.log('👤 User Controller: Getting payments for user:', userId);

  try {
    // Get all bookings for this user with package details
    const userBookings = await Booking.find({ userId })
      .populate('packageId', 'title category basePrice images primaryImage')
      .sort({ _id: -1 });

    console.log('👤 User Controller: Found user bookings:', userBookings.length);

    // Get all payments for these bookings
    const bookingIds = userBookings.map(booking => booking._id);
    
    let paymentQuery = { bookingId: { $in: bookingIds } };
    if (req.query.status) {
      paymentQuery.status = req.query.status;
    }

    const allPayments = await Payment.find(paymentQuery)
      .sort({ _id: -1 });

    console.log('👤 User Controller: Found payments:', allPayments.length);

    // Group payments by booking and create detailed payment info
    const paymentDetails = userBookings.map(booking => {
      const bookingPayments = allPayments.filter(payment => 
        payment.bookingId.toString() === booking._id.toString()
      );

      // Calculate payment totals from Payment records (for history/display)
      const totalPaidFromPayments = bookingPayments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const pendingAmount = bookingPayments
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const failedAmount = bookingPayments
        .filter(p => p.status === 'FAILED')
        .reduce((sum, p) => sum + p.amount, 0);

      // Use booking.amountPaid as source of truth (includes cash payments)
      // This ensures cash payments are properly reflected even if Payment records don't exist
      const totalPaid = booking.amountPaid || 0;
      const remainingAmount = booking.totalAmount - totalPaid;
      const paymentProgress = booking.totalAmount > 0 ? (totalPaid / booking.totalAmount) * 100 : 0;

      // Determine payment status - use booking.amountPaid as primary source
      // This handles cases where cash payments were made but Payment records weren't created
      let paymentStatus = booking.paymentStatus || 'PENDING_PAYMENT';
      if (totalPaid >= booking.totalAmount) {
        paymentStatus = 'FULLY_PAID';
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIALLY_PAID';
      } else if (failedAmount > 0) {
        paymentStatus = 'FAILED_PAYMENT';
      }

      return {
        booking: {
          _id: booking._id,
          packageId: booking.packageId,
          eventDate: booking.eventDate,
          location: booking.location,
          vendorStatus: booking.vendorStatus,
          totalAmount: booking.totalAmount,
          amountPaid: booking.amountPaid,
          remainingAmount: booking.remainingAmount,
          paymentStatus: booking.paymentStatus,
          paymentPercentagePaid: booking.paymentPercentagePaid,
          remainingPercentage: booking.remainingPercentage,
          onlinePaymentDone: booking.onlinePaymentDone,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        },
        payments: bookingPayments,
        paymentSummary: {
          totalPaid, // Uses booking.amountPaid (includes cash payments)
          totalPaidFromPayments, // Amount from Payment records only (for reference)
          pendingAmount,
          failedAmount,
          remainingAmount,
          paymentProgress: Math.round(paymentProgress),
          paymentStatus, // Uses booking.amountPaid for calculation
          isFullyPaid: totalPaid >= booking.totalAmount,
          isPartiallyPaid: totalPaid > 0 && totalPaid < booking.totalAmount,
          hasPendingPayments: pendingAmount > 0,
          hasFailedPayments: failedAmount > 0
        }
      };
    });

    // Apply pagination to the detailed results
    const paginatedResults = paymentDetails.slice(skip, skip + limit);
    const total = paymentDetails.length;

    console.log('👤 User Controller: Returning payment details for', paginatedResults.length, 'bookings');

    res.status(200).json({
      success: true,
      data: {
        paymentDetails: paginatedResults,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('👤 User Controller: Error getting payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment details',
      error: error.message
    });
  }
});

// @desc    Get user's reviews
// @route   GET /api/users/reviews
// @access  Private
export const getUserReviews = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ userId })
    .populate('bookingId', 'packageId eventDate')
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ userId });

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Create user review
// @route   POST /api/users/reviews
// @access  Private
export const createUserReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment, feedback } = req.body;
  const userId = req.userId;

  // Use feedback if provided, otherwise use comment (for backward compatibility)
  const reviewText = feedback || comment;

  if (!rating) {
    return res.status(400).json({
      success: false,
      message: 'Rating is required. Please select a rating from 1 to 5 stars.',
      errors: [{
        field: 'rating',
        message: 'Rating is required. Please select a rating from 1 to 5 stars.'
      }]
    });
  }

  if (!reviewText || reviewText.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Feedback is required. Please share your experience with at least 10 characters.',
      errors: [{
        field: 'feedback',
        message: 'Feedback is required. Please share your experience with at least 10 characters.'
      }]
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5 stars. Please select a valid rating.',
      errors: [{
        field: 'rating',
        message: 'Rating must be between 1 and 5 stars. Please select a valid rating.'
      }]
    });
  }

  if (reviewText.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Your feedback must be at least 10 characters long. Please provide more details about your experience.',
      errors: [{
        field: 'feedback',
        message: 'Your feedback must be at least 10 characters long. Please provide more details about your experience.'
      }]
    });
  }

  if (reviewText.trim().length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Your feedback is too long. Please keep it under 1000 characters.',
      errors: [{
        field: 'feedback',
        message: 'Your feedback is too long. Please keep it under 1000 characters.'
      }]
    });
  }

  // If bookingId is provided, validate it's a booking review
  if (bookingId) {
    // Check if booking exists and belongs to user
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or does not belong to you. Please select a valid booking.',
        errors: [{
          field: 'bookingId',
          message: 'Booking not found or does not belong to you. Please select a valid booking.'
        }]
      });
    }

    // Check if booking is completed
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed bookings. Please wait until your booking is completed.',
        errors: [{
          field: 'bookingId',
          message: 'You can only review completed bookings. Please wait until your booking is completed.'
        }]
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this booking. Each booking can only be reviewed once.',
        errors: [{
          field: 'bookingId',
          message: 'You have already submitted a review for this booking. Each booking can only be reviewed once.'
        }]
      });
    }

    // Create booking review
    const review = await Review.create({
      userId,
      bookingId,
      rating,
      feedback: reviewText,
      type: 'BOOKING_REVIEW',
      isApproved: true // Booking reviews are auto-approved and visible immediately
    });

    // Populate review data
    await review.populate('bookingId', 'packageId eventDate');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } else {
    // No bookingId - this is a general review from profile
    // Create review (visible in Reviews section immediately)
    const review = await Review.create({
      userId,
      rating,
      feedback: reviewText,
      type: 'BOOKING_REVIEW', // Use BOOKING_REVIEW type for general reviews too
      isApproved: true // Reviews are visible immediately in Reviews section
    });

    // Also create a testimonial entry for admin approval
    // This allows admin to approve it for the Testimonials section (homepage)
    const testimonial = await Review.create({
      userId,
      rating,
      feedback: reviewText,
      type: 'TESTIMONIAL',
      isApproved: false // Needs admin approval to show in Testimonials section
    });

    // Populate user data
    await review.populate('userId', 'name');
    await testimonial.populate('userId', 'name');

    res.status(201).json({
      success: true,
      message: 'Review created successfully. It will be visible in the Reviews section. If approved by admin, it will also appear in the Testimonials section.',
      data: { 
        review,
        testimonial: {
          id: testimonial._id,
          status: 'pending_approval'
        }
      }
    });
  }
});

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // For now, we'll use audit logs as notifications
  // In a real app, you'd have a separate notifications collection
  const notifications = await AuditLog.find({
    targetId: userId,
    action: { $in: ['BOOKING_CREATED', 'BOOKING_UPDATED', 'PAYMENT_RECEIVED', 'BOOKING_ASSIGNED'] }
  })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments({
    targetId: userId,
    action: { $in: ['BOOKING_CREATED', 'BOOKING_UPDATED', 'PAYMENT_RECEIVED', 'BOOKING_ASSIGNED'] }
  });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get user activity log
// @route   GET /api/users/activity
// @access  Private
export const getUserActivity = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const activities = await AuditLog.find({
    $or: [
      { actorId: userId },
      { targetId: userId }
    ]
  })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments({
    $or: [
      { actorId: userId },
      { targetId: userId }
    ]
  });

  res.status(200).json({
    success: true,
    data: {
      activities,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Forgot password
// @route   POST /api/users/forgot-password
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

  // Generate reset token (in a real app, you'd use crypto.randomBytes)
  const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const resetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Update user with reset token
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = resetExpire;
  await user.save();

  try {
    // Use the email service
    const getEmailService = (await import('../services/emailService.js')).default;
    await getEmailService().sendPasswordResetEmail(user.email, user.name, resetToken);
    console.log('✅ Password reset email sent to:', user.email);

    // Create audit log
    // DISABLED: await AuditLog.create({
  //       actorId: user._id,
  //       action: 'PASSWORD_RESET_REQUEST',
  //       targetId: user._id,
  //       description: 'Password reset requested'
  //     });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
      data: {
        email: user.email,
        expiresAt: resetExpire
      }
    });
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email. Please try again.'
    });
  }
});

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: new Date() }
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

  // Hash new password
  const hashedPassword = await PasswordService.hashPassword(newPassword);

  // Update password and clear reset token
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: user._id,
  //     action: 'PASSWORD_RESET',
  //     targetId: user._id,
  //     description: 'Password reset successfully'
  //   });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Get user search history
// @route   GET /api/users/search-history
// @access  Private
export const getSearchHistory = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // For now, we'll use audit logs for search history
  // In a real app, you'd have a separate search history collection
  const searchHistory = await AuditLog.find({
    actorId: userId,
    action: 'SEARCH'
  })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments({
    actorId: userId,
    action: 'SEARCH'
  });

  res.status(200).json({
    success: true,
    data: {
      searchHistory,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Save user search preferences
// @route   POST /api/users/save-search
// @access  Private
export const saveSearch = asyncHandler(async (req, res) => {
  const { searchQuery, filters } = req.body;
  const userId = req.userId;

  // Create audit log for search
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'SEARCH',
  //     targetId: userId,
  //     description: `User searched for: ${searchQuery}`,
  //     metadata: { filters }
  //   });

  res.status(200).json({
    success: true,
    message: 'Search saved successfully'
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Get booking statistics
  const totalBookings = await Booking.countDocuments({ userId });
  const activeBookings = await Booking.countDocuments({
    userId,
    status: { $in: ['PENDING_PARTIAL_PAYMENT', 'PARTIALLY_PAID', 'ASSIGNED', 'IN_PROGRESS'] }
  });
  const completedBookings = await Booking.countDocuments({
    userId,
    status: 'COMPLETED'
  });

  // Get payment statistics
  const totalSpent = await Payment.aggregate([
    { $match: { userId, status: 'COMPLETED' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Get review statistics
  const totalReviews = await Review.countDocuments({ userId });
  const averageRating = await Review.aggregate([
    { $match: { userId } },
    { $group: { _id: null, average: { $avg: '$rating' } } }
  ]);

  // Get cart statistics
  const cartItemsCount = await Cart.countDocuments({ userId });

  res.status(200).json({
    success: true,
    data: {
      bookings: {
        total: totalBookings,
        active: activeBookings,
        completed: completedBookings
      },
      payments: {
        totalSpent: totalSpent[0]?.total || 0
      },
      reviews: {
        total: totalReviews,
        averageRating: averageRating[0]?.average || 0
      },
      cart: {
        itemsCount: cartItemsCount
      }
    }
  });
});

// @desc    Update booking status (for user)
// @route   PUT /api/users/bookings/:id/status
// @access  Private
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const userId = req.userId;

  const booking = await Booking.findOne({ _id: id, userId });
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or does not belong to you'
    });
  }

  // Update booking vendor status
  booking.vendorStatus = status;
  await booking.save();

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'UPDATE',
  //     targetId: booking._id,
  //     description: `Booking status updated to ${status}`
  //   });

  res.status(200).json({
    success: true,
    message: 'Booking status updated successfully',
    data: { booking }
  });
});

// @desc    Get booking details with all information
// @route   GET /api/users/bookings/:id/details
// @access  Private
export const getBookingDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const booking = await Booking.findOne({ _id: id, userId })
    .populate('packageId', 'title category basePrice images primaryImage description features')
    .populate('userId', 'name email phone')
    .populate('assignedVendorId', 'name email phone businessName');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or does not belong to you'
    });
  }

  // Get all payments for this booking
  const payments = await Payment.find({ bookingId: booking._id })
    .sort({ _id: -1 });

  const remainingAmount = booking.totalAmount - booking.amountPaid;

  res.status(200).json({
    success: true,
    data: {
      booking,
      payments,
      paymentSummary: {
        totalAmount: booking.totalAmount,
        amountPaid: booking.amountPaid,
        remainingAmount,
        paymentStatus: booking.paymentStatus,
        paymentPercentagePaid: booking.paymentPercentagePaid,
        onlinePaymentDone: booking.onlinePaymentDone
      }
    }
  });
});

// @desc    Get booking invoice
// @route   GET /api/users/bookings/:id/invoice
// @access  Private
export const getBookingInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const booking = await Booking.findOne({ _id: id, userId })
    .populate('packageId', 'title category basePrice')
    .populate('vendorId', 'businessName contactPhone')
    .populate('userId', 'name email phone');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or does not belong to you'
    });
  }

  // Get payments for this booking
  const payments = await Payment.find({ bookingId: id });

  res.status(200).json({
    success: true,
    data: {
      booking,
      payments,
      invoice: {
        bookingId: booking._id,
        customerName: booking.userId.name,
        customerEmail: booking.userId.email,
        customerPhone: booking.userId.phone,
        packageName: booking.packageId.title,
        eventDate: booking.eventDate,
        totalAmount: booking.totalAmount,
        amountPaid: booking.amountPaid,
        balance: booking.totalAmount - booking.amountPaid,
        status: booking.status,
        createdAt: booking.createdAt
      }
    }
  });
});

// @desc    Add testimonial
// @route   POST /api/users/testimonial
// @access  Private
export const addTestimonial = asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;

  if (!rating || !feedback) {
    return res.status(400).json({
      success: false,
      message: 'Rating and feedback are required'
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  // Create testimonial
  const testimonial = await Review.create({
    userId: req.userId,
    rating,
    feedback,
    type: 'TESTIMONIAL',
    isApproved: false // Admin needs to approve
  });

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'CREATE',
  //     targetId: testimonial._id,
  //     description: 'User added testimonial'
  //   });

  res.status(201).json({
    success: true,
    message: 'Testimonial submitted successfully. It will be reviewed before being published.',
    data: {
      testimonial: {
        id: testimonial._id,
        rating: testimonial.rating,
        feedback: testimonial.feedback,
        type: testimonial.type,
        isApproved: testimonial.isApproved,
        createdAt: testimonial.createdAt
      }
    }
  });
});

// @desc    Get user testimonials
// @route   GET /api/users/testimonials
// @access  Private
export const getUserTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Review.find({ 
    userId: req.userId, 
    type: 'TESTIMONIAL' 
  }).sort({ _id: -1 });

  res.status(200).json({
    success: true,
    data: {
      testimonials
    }
  });
});

// @desc    Send email verification
// @route   POST /api/users/send-email-verification
// @access  Private
export const sendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate verification token
  const crypto = await import('crypto');
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpire = verificationExpire;
  await user.save();

  try {
    // Use the email service
    const getEmailService = (await import('../services/emailService.js')).default;
    await getEmailService().sendVerificationEmail(user.email, user.name, verificationToken);
    console.log('✅ Verification email sent to:', user.email);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        email: user.email,
        expiresAt: verificationExpire
      }
    });
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again.'
    });
  }
});

// @desc    Verify email
// @route   POST /api/users/verify-email
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required'
    });
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpire: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token'
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    }
  });
});

// @desc    Check if admin registration is allowed
// @route   GET /api/users/check-admin-limit
// @access  Public
export const checkAdminLimit = asyncHandler(async (req, res) => {
  const adminCount = await User.countDocuments({ role: 'admin' });
  const maxAdmins = 2;
  
  // CRITICAL: Log the actual admin count for debugging
  console.log('🔍 checkAdminLimit: Database query result', {
    adminCount,
    maxAdmins,
    query: { role: 'admin' }
  });
  
  // List all admins for debugging
  const allAdmins = await User.find({ role: 'admin' }).select('name email clerkId');
  console.log('👥 checkAdminLimit: All admins in database', {
    count: allAdmins.length,
    admins: allAdmins.map(a => ({ name: a.name, email: a.email, clerkId: a.clerkId }))
  });
  
  // CRITICAL FIX: Check if current user is already an admin
  let isCurrentUserAdmin = false;
  let currentClerkUserId = null;
  
  try {
    const { getAuth } = await import('@clerk/express');
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.decode(token);
      if (decoded && decoded.sub) {
        currentClerkUserId = decoded.sub;
      }
    }
    
    if (!currentClerkUserId) {
      const clerkAuth = getAuth(req) || req.auth;
      if (clerkAuth?.userId) {
        currentClerkUserId = clerkAuth.userId;
      }
    }
    
    if (currentClerkUserId) {
      const existingAdmin = await User.findOne({ 
        clerkId: currentClerkUserId, 
        role: 'admin' 
      });
      isCurrentUserAdmin = !!existingAdmin;
      console.log('🔍 checkAdminLimit: Current user check', {
        currentClerkUserId,
        isCurrentUserAdmin,
        foundAdmin: !!existingAdmin
      });
    }
  } catch (e) {
    // Non-blocking
    console.warn('⚠️ checkAdminLimit: Could not check if user is admin:', e.message);
  }
  
  // Allow if under limit OR if current user is already an admin
  const isAllowed = adminCount < maxAdmins || isCurrentUserAdmin;
  
  console.log('✅ checkAdminLimit: Final result', {
    adminCount,
    maxAdmins,
    isAllowed,
    isCurrentUserAdmin,
    reason: isAllowed ? (adminCount < maxAdmins ? 'Under limit' : 'Existing admin') : 'Limit reached'
  });
  
  res.status(200).json({
    success: true,
    data: {
      adminCount,
      maxAdmins,
      isAllowed,
      isCurrentUserAdmin,
      // DEBUG: Include admin list in response to help debug
      admins: allAdmins.map(a => ({ 
        name: a.name, 
        email: a.email, 
        clerkId: a.clerkId,
        createdAt: a.createdAt
      })),
      message: isAllowed 
        ? (isCurrentUserAdmin 
            ? 'You are an existing admin. Admin access allowed.' 
            : 'Admin registration is available')
        : 'Admin registration limit reached. Maximum 2 admins allowed.'
    }
  });
});

// @desc    Cleanup duplicate admins with generated emails (one-time cleanup)
// @route   POST /api/users/cleanup-duplicate-admins
// @access  Public (but requires secret key)
export const cleanupDuplicateAdmins = asyncHandler(async (req, res) => {
  // Require secret key for security
  const secretKey = req.headers['x-cleanup-secret'] || req.query.secret;
  const expectedSecret = process.env.CLEANUP_SECRET_KEY || 'cleanup-duplicate-admins-2025';
  
  if (secretKey !== expectedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Secret key required.'
    });
  }

  try {
    // Find all admins with generated emails (snapfest.local domain)
    const duplicateAdmins = await User.find({ 
      role: 'admin',
      email: { $regex: /@snapfest\.local$/i }
    });

    if (duplicateAdmins.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No duplicate admins found',
        data: {
          removed: 0,
          remaining: await User.countDocuments({ role: 'admin' })
        }
      });
    }

    const removedIds = [];
    for (const admin of duplicateAdmins) {
      // Change role to user instead of deleting (safer)
      admin.role = 'user';
      await admin.save();
      removedIds.push({
        id: admin._id.toString(),
        email: admin.email,
        clerkId: admin.clerkId
      });
    }

    const remainingCount = await User.countDocuments({ role: 'admin' });
    const validAdmins = await User.find({ role: 'admin' }).select('name email clerkId');

    return res.status(200).json({
      success: true,
      message: `Removed ${duplicateAdmins.length} duplicate admin(s)`,
      data: {
        removed: duplicateAdmins.length,
        removedAdmins: removedIds,
        remaining: remainingCount,
        validAdmins: validAdmins.map(a => ({
          name: a.name,
          email: a.email,
          clerkId: a.clerkId
        }))
      }
    });
  } catch (error) {
    console.error('❌ cleanupDuplicateAdmins: Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cleanup duplicate admins',
      error: error.message
    });
  }
});

// @desc    Remove ALL users from database (DESTRUCTIVE - use with caution)
// @route   POST /api/users/cleanup-all-users
// @access  Public (but requires secret key)
export const cleanupAllUsers = asyncHandler(async (req, res) => {
  // Require secret key for security
  const secretKey = req.headers['x-cleanup-secret'] || req.query.secret;
  const expectedSecret = process.env.CLEANUP_SECRET_KEY || 'cleanup-duplicate-admins-2025';
  
  if (secretKey !== expectedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Secret key required.'
    });
  }

  try {
    // Get counts before deletion
    const totalBefore = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const vendorCount = await User.countDocuments({ role: 'vendor' });
    const userCount = await User.countDocuments({ role: 'user' });
    const otherCount = totalBefore - adminCount - vendorCount - userCount;

    // Delete all users
    const deleteResult = await User.deleteMany({});
    
    const deletedCount = deleteResult.deletedCount;
    const remainingCount = await User.countDocuments();

    return res.status(200).json({
      success: true,
      message: `Removed ${deletedCount} user(s) from database`,
      data: {
        deleted: deletedCount,
        remaining: remainingCount,
        breakdown: {
          admins: adminCount,
          vendors: vendorCount,
          users: userCount,
          other: otherCount,
          total: totalBefore
        }
      }
    });
  } catch (error) {
    console.error('❌ cleanupAllUsers: Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cleanup users',
      error: error.message
    });
  }
});

// @desc    Sync Clerk user to local DB (idempotent)
// @route   POST /api/users/sync
// @access  Private (Clerk cookie session) - uses optionalAuth to handle session edge cases
export const syncClerkUser = asyncHandler(async (req, res) => {
  // This endpoint uses optionalAuth middleware, which means req.user might not exist yet
  // We need to handle both cases: when user is already synced (req.user exists) 
  // and when user needs to be created from Clerk session
  
  // Get role from query parameter (set by frontend when selecting role)
  const requestedRole = req.query.role || null;
  
  // DIAGNOSTIC LOGGING - Always log for debugging
  const clerkSecretKey = process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY_USER;
  console.log('🔍 syncClerkUser: Starting sync', {
    requestedRole,
    hasReqUser: !!req.user,
    reqUserId: req.userId,
    queryParams: req.query,
    clerkSecretKeySet: !!clerkSecretKey,
    clerkSecretKeyLength: clerkSecretKey?.length || 0,
    clerkSecretKeyPrefix: clerkSecretKey?.substring(0, 15) || 'NOT SET',
    nodeEnv: process.env.NODE_ENV
  });
  
  // CRITICAL FIX: Extract Clerk user ID FIRST and check if user already exists
  // This allows existing admins to sync/login even if limit is reached
  let currentClerkUserId = null;
  let existingUserInDB = null;
  let isExistingAdmin = false;
  
  // Try to get Clerk user ID from multiple sources
  if (req.userId && req.user) {
    // User already exists in database - get clerkId from user
    existingUserInDB = await User.findById(req.userId);
    if (existingUserInDB && existingUserInDB.clerkId) {
      currentClerkUserId = existingUserInDB.clerkId;
      // Check if user is already an admin
      isExistingAdmin = existingUserInDB.role === 'admin';
    }
  }
  
  // If not found, try to extract from Clerk session
  if (!currentClerkUserId) {
    try {
      const { getAuth } = await import('@clerk/express');
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.decode(token);
        if (decoded && decoded.sub) {
          currentClerkUserId = decoded.sub;
        }
      }
      
      if (!currentClerkUserId) {
        const clerkAuth = getAuth(req) || req.auth;
        if (clerkAuth?.userId) {
          currentClerkUserId = clerkAuth.userId;
        }
      }
      
      // CRITICAL FIX: If we have Clerk user ID, check if user exists in DB
      // This determines if this is SIGNIN (user exists) vs SIGNUP (user doesn't exist)
      if (currentClerkUserId && !existingUserInDB) {
        existingUserInDB = await User.findOne({ clerkId: currentClerkUserId });
        if (existingUserInDB) {
          isExistingAdmin = existingUserInDB.role === 'admin';
        }
      }
    } catch (e) {
      // Non-blocking - will check limit without user ID
      console.warn('⚠️ syncClerkUser: Could not extract Clerk user ID:', e.message);
    }
  }
  
  // CRITICAL FIX: Check admin limit ONLY if user is trying to become admin
  // BUT: Skip limit check entirely if user is already an admin (this is SIGNIN, not SIGNUP)
  // This ensures existing admins can always sign in, regardless of admin count
  if (requestedRole === 'admin') {
    // CRITICAL FIX: If user is already an admin, skip limit check entirely
    // This is SIGNIN - existing admins should always be allowed to sign in
    if (isExistingAdmin) {
      console.log('✅ syncClerkUser: User is existing admin - skipping admin limit check (SIGNIN)', {
        currentClerkUserId,
        userId: existingUserInDB?._id,
        reason: 'EXISTING_ADMIN_SIGNIN'
      });
      // Skip admin limit check - proceed with sync
    } else {
      // User is NOT an existing admin - this might be SIGNUP or ROLE_UPGRADE
      // Check admin limit before allowing
      const adminCount = await User.countDocuments({ role: 'admin' });
      const maxAdmins = 2;
      
      console.log('🔍 syncClerkUser: Admin limit check (early) - user is NOT existing admin', {
        adminCount,
        maxAdmins,
        requestedRole,
        currentClerkUserId,
        hasReqUser: !!req.user,
        reqUserId: req.userId,
        isExistingAdmin,
        reason: 'POTENTIAL_SIGNUP_OR_UPGRADE'
      });
      
      // CRITICAL FIX: Only check limit if adminCount >= maxAdmins
      // If adminCount < maxAdmins, there's room for more admins - always allow
      if (adminCount >= maxAdmins) {
        // Admin limit reached - block new admin creation/upgrade
        console.log('❌ syncClerkUser: Admin limit reached - blocking new admin creation/upgrade', {
          adminCount,
          maxAdmins,
          currentClerkUserId,
          isExistingAdmin,
          reason: 'SIGNUP_OR_UPGRADE_BLOCKED'
        });
        return res.status(403).json({
          success: false,
          message: 'You are not authorized for this. Maximum admin limit (2) has been reached.',
          code: 'ADMIN_LIMIT_REACHED'
        });
      }
    }
  }
  
  // If req.user already exists (from optionalAuth middleware), update role AND Clerk metadata
  if (req.user && req.userId) {
    const user = await User.findById(req.userId);
    if (user) {
      // CRITICAL FIX: Get Clerk auth for metadata update
      const { getAuth } = await import('@clerk/express');
      const { createClerkClient } = await import('@clerk/clerk-sdk-node');
      
      // Check if Clerk secret key is available
      if (!clerkSecretKey) {
        console.error('❌ CRITICAL: Clerk secret key not set! Cannot update metadata.');
        console.error('   Set CLERK_SECRET_KEY or CLERK_SECRET_KEY_USER in environment variables');
        // Continue without metadata update - at least update database
      }
      
      const getClerkClient = () => {
        if (!clerkSecretKey) {
          throw new Error('Clerk secret key not configured');
        }
        return createClerkClient({ secretKey: clerkSecretKey });
      };
      
      let clerkAuth = getAuth(req) || req.auth;
      
      console.log('🔍 syncClerkUser: Clerk auth check', {
        hasGetAuth: !!getAuth(req),
        hasReqAuth: !!req.auth,
        clerkUserId: clerkAuth?.userId,
        clerkSessionId: clerkAuth?.sessionId,
        clerkClaims: clerkAuth?.claims ? Object.keys(clerkAuth.claims) : []
      });
      
      let clerkPublicMetadata = {};
      
      // CRITICAL: Update Clerk metadata FIRST if role is provided
      if (requestedRole && ['user', 'vendor', 'admin'].includes(requestedRole) && clerkAuth?.userId) {
        try {
          const clerkClient = getClerkClient();
          
          // Fetch current Clerk metadata
          let clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
          clerkPublicMetadata = clerkUser.publicMetadata || {};
          
          // Only update if role is different
          if (clerkPublicMetadata?.role !== requestedRole) {
            // Update with retry logic and verification
            let retries = 3;
            let success = false;
            
            while (retries > 0 && !success) {
              try {
                await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
                  publicMetadata: { 
                    ...clerkPublicMetadata,
                    role: requestedRole 
                  }
                });
                
                // Verify update was successful
                const updatedUser = await clerkClient.users.getUser(clerkAuth.userId);
                if (updatedUser.publicMetadata?.role === requestedRole) {
                  success = true;
                  clerkPublicMetadata = updatedUser.publicMetadata;
                  console.log(`✅ syncClerkUser: Updated Clerk metadata role=${requestedRole} for existing user=${clerkAuth.userId}`);
                } else {
                  throw new Error(`Metadata verification failed: expected ${requestedRole}, got ${updatedUser.publicMetadata?.role || 'none'}`);
                }
              } catch (retryError) {
                retries--;
                if (retries === 0) {
                  throw retryError;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
              }
            }
          } else {
            // Role already set correctly in Clerk
            clerkPublicMetadata = clerkUser.publicMetadata || {};
          }
        } catch (updateError) {
          console.error('❌ syncClerkUser: Failed to update Clerk metadata after retries:', {
            error: updateError.message,
            errorCode: updateError.errors?.[0]?.code,
            errorStatus: updateError.status,
            errorStatusCode: updateError.statusCode,
            userId: clerkAuth?.userId,
            requestedRole: requestedRole,
            clerkSecretKeyLength: clerkSecretKey?.length || 0,
            clerkSecretKeyPrefix: clerkSecretKey?.substring(0, 15) || 'NOT SET',
            stack: updateError.stack
          });
          
          // CRITICAL: Don't fail the request - continue with database update
          // Admin endpoints can fallback to database role if metadata is missing
          // Log error but allow user creation/update to proceed
          console.warn('⚠️ syncClerkUser: Continuing despite metadata update failure. Database role will be used as fallback.');
        }
      } else {
        console.log('⚠️ syncClerkUser: Skipping metadata update', {
          hasRequestedRole: !!requestedRole,
          validRole: requestedRole && ['user', 'vendor', 'admin'].includes(requestedRole),
          hasClerkUserId: !!clerkAuth?.userId,
          clerkUserId: clerkAuth?.userId,
          reason: !requestedRole ? 'no role provided' : !['user', 'vendor', 'admin'].includes(requestedRole) ? 'invalid role' : !clerkAuth?.userId ? 'no clerk userId' : 'unknown'
        });
        
        if (clerkAuth?.userId) {
          // Fetch Clerk metadata even if no role update needed
          try {
            const clerkClient = getClerkClient();
            const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
            clerkPublicMetadata = clerkUser.publicMetadata || {};
            console.log('🔍 syncClerkUser: Fetched Clerk metadata (no update needed)', {
              metadata: clerkPublicMetadata
            });
          } catch (e) {
            console.error('❌ syncClerkUser: Failed to fetch Clerk metadata:', e.message);
            // Non-blocking
          }
        }
      }
      
      // Update database role if requested and different
      if (requestedRole && ['user', 'vendor', 'admin'].includes(requestedRole) && user.role !== requestedRole) {
        // Check admin limit if trying to become admin
        if (requestedRole === 'admin') {
          const adminCount = await User.countDocuments({ role: 'admin' });
          const maxAdmins = 2;
          
          // CRITICAL FIX: Check if current user is already an admin BEFORE blocking
          if (adminCount >= maxAdmins) {
            const existingAdmin = await User.findOne({ 
              clerkId: user.clerkId, 
              role: 'admin' 
            });
            
            // Only block if user is NOT already an admin
            if (!existingAdmin) {
              console.log('❌ syncClerkUser: Admin limit reached when updating role, user is not existing admin', {
                adminCount,
                maxAdmins,
                clerkId: user.clerkId,
                currentRole: user.role
              });
              return res.status(403).json({
                success: false,
                message: 'You are not authorized for this. Maximum admin limit (2) has been reached.',
                code: 'ADMIN_LIMIT_REACHED'
              });
            }
            // If user is already admin, allow the update
            console.log('✅ syncClerkUser: Admin limit reached but user is existing admin, allowing role update', {
              adminCount,
              maxAdmins,
              clerkId: user.clerkId
            });
          }
        }
        
        user.role = requestedRole;
        
        // Initialize vendor-specific fields if role changed to vendor
        if (requestedRole === 'vendor' && !user.businessName) {
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
        }
        
        await user.save();
      }
      
      return res.status(200).json({
        success: true,
        message: 'User synced',
        data: {
          user: {
            id: user._id,
            clerkId: user.clerkId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profileImage: user.profileImage,
            address: user.address,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          clerkPublicMetadata: clerkPublicMetadata,
          roleSet: clerkPublicMetadata?.role || null
        }
      });
    }
  }
  
  // If req.user doesn't exist, get Clerk session and create/find user
  const { getAuth } = await import('@clerk/express');
  const { createClerkClient } = await import('@clerk/clerk-sdk-node');
  
  // Single Clerk client instance (no port-based routing)
  const getClerkClient = () => createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY_USER
  });
  
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
        const clerkClient = getClerkClient();
        const clerkUser = await clerkClient.users.getUser(userId);
        
        clerkAuth = {
          userId: userId,
          claims: {
            email: clerkUser.emailAddresses?.[0]?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
            publicMetadata: clerkUser.publicMetadata || {}
          }
        };
        
        console.log('✅ syncClerkUser: Using token-based authentication');
      }
    } catch (tokenError) {
      // Token invalid, fall back to cookie-based auth
      console.log('⚠️ syncClerkUser: Token decode failed, falling back to cookies');
    }
  }
  
  // Method 2: Fallback to cookie-based auth (getAuth from cookies)
  if (!clerkAuth) {
    clerkAuth = getAuth(req);
    
    // Fallback: Check if req.auth exists
    if (!clerkAuth?.userId && req.auth?.userId) {
      clerkAuth = req.auth;
      console.log('⚠️ syncClerkUser: Using req.auth fallback');
    }
  }
  
  // CRITICAL: Enhanced debugging for Clerk session extraction
  if (!clerkAuth?.userId) {
    console.error('❌ syncClerkUser: CRITICAL - No Clerk session found!', {
      hasGetAuth: !!getAuth(req),
      getAuthUserId: getAuth(req)?.userId || null,
      hasReqAuth: !!req.auth,
      reqAuthUserId: req.auth?.userId || null,
      requestCookies: Object.keys(req.cookies || {}),
      cookieNames: Object.keys(req.cookies || {}),
      hasAuthorizationHeader: !!req.headers.authorization,
      authMethod: authHeader ? 'token' : 'cookie',
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent']?.substring(0, 50),
      nodeEnv: process.env.NODE_ENV
    });
    
    // Check if cookies are being sent
    const cookieHeader = req.headers.cookie;
    console.error('❌ syncClerkUser: Cookie header check', {
      hasCookieHeader: !!cookieHeader,
      cookieHeaderLength: cookieHeader?.length || 0,
      cookieHeaderPreview: cookieHeader?.substring(0, 100) || 'N/A',
      containsClerk: cookieHeader?.includes('__clerk') || false,
      containsSession: cookieHeader?.includes('session') || false
    });
    
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. Please sign in.',
      code: 'CLERK_SESSION_NOT_FOUND',
      debug: {
        hasGetAuth: !!getAuth(req),
        hasReqAuth: !!req.auth,
        cookieCount: Object.keys(req.cookies || {}).length,
        hasAuthorizationHeader: !!authHeader
      }
    });
  }
  
  console.log('✅ syncClerkUser: Clerk session found', {
    userId: clerkAuth.userId,
    sessionId: clerkAuth.sessionId,
    hasClaims: !!clerkAuth.claims,
    claimKeys: clerkAuth.claims ? Object.keys(clerkAuth.claims) : []
  });
  
  // CRITICAL FIX: Re-check admin limit if we couldn't check earlier due to missing Clerk user ID
  // This handles the case where currentClerkUserId was null in the early check
  if (requestedRole === 'admin' && clerkAuth?.userId && !currentClerkUserId) {
    const adminCount = await User.countDocuments({ role: 'admin' });
    const maxAdmins = 2;
    
    console.log('🔍 syncClerkUser: Late admin limit check', {
      adminCount,
      maxAdmins,
      clerkUserId: clerkAuth.userId,
      requestedRole
    });
    
    // CRITICAL FIX: Only check limit if adminCount >= maxAdmins
    // If adminCount < maxAdmins, there's room for more admins - always allow
    if (adminCount >= maxAdmins) {
      const existingAdmin = await User.findOne({ 
        clerkId: clerkAuth.userId, 
        role: 'admin' 
      });
      
      // Only block if user is NOT already an admin
      if (!existingAdmin) {
        console.log('❌ syncClerkUser: Admin limit reached (late check) and user is not an existing admin', {
          adminCount,
          maxAdmins,
          clerkUserId: clerkAuth.userId
        });
        return res.status(403).json({
          success: false,
          message: 'You are not authorized for this. Maximum admin limit (2) has been reached.',
          code: 'ADMIN_LIMIT_REACHED'
        });
      } else {
        console.log('✅ syncClerkUser: Admin limit reached (late check) but user is existing admin, allowing sync', {
          adminCount,
          maxAdmins,
          clerkUserId: clerkAuth.userId
        });
      }
    }
  }
  
  // Extract email and name from Clerk session
  let email = clerkAuth?.claims?.email || 
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
  
  // If email not in claims, fetch from Clerk API
  let finalEmail = email;
  let finalName = sanitizedName;
  
  // Check if request came from specific ports for role auto-detection
  // Get origin from multiple sources for better reliability
  const origin = req.headers.origin || 
                 req.headers.referer || 
                 req.headers['x-forwarded-host'] ||
                 (req.protocol + '://' + req.get('host')) ||
                 '';
  
  // Also check request URL and host for port number as fallback
  const urlHost = req.get('host') || '';
  const requestUrl = req.url || req.originalUrl || '';
  
  // Get target role from query parameter (set by frontend when selecting role)
  let targetRole = 'user'; // default
  if (requestedRole && ['user', 'vendor', 'admin'].includes(requestedRole)) {
    targetRole = requestedRole;
  }
  
  if (!finalEmail) {
    try {
      const clerkClient = getClerkClient();
      const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
      finalEmail = clerkUser.emailAddresses?.find(email => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
                   clerkUser.emailAddresses?.[0]?.emailAddress ||
                   clerkUser.emailAddress ||
                   null;
      
      finalName = clerkUser.firstName && clerkUser.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser.firstName || clerkUser.lastName || finalName;
    } catch (apiError) {
      console.error('❌ Failed to fetch user from Clerk API:', apiError.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed: email not found. Please ensure your Clerk account has an email address.' 
      });
    }
  }
  
  if (!finalEmail) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed: email not found.' 
    });
  }
  
  // Find or create user
  let user = await User.findOne({ clerkId: clerkAuth.userId });
  
  // Get or fetch publicMetadata (needed for both new and existing users)
  let publicMetadata = clerkAuth?.claims?.publicMetadata || null;
  
  // Fetch publicMetadata from Clerk if not in claims
  if (!publicMetadata) {
    try {
      const clerkClient = getClerkClient();
      const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
      publicMetadata = clerkUser.publicMetadata || {};
    } catch (e) {
      // Non-blocking - default to empty object
      publicMetadata = {};
    }
  }
  
  // Ensure publicMetadata is an object
  if (!publicMetadata || typeof publicMetadata !== 'object') {
    publicMetadata = {};
  }
  
  if (!user) {
    // CRITICAL: Set role in Clerk publicMetadata FIRST before creating user
    // This ensures the role is persisted in Clerk for future requests
    if (targetRole && ['user', 'vendor', 'admin'].includes(targetRole)) {
      console.log('🔍 syncClerkUser: Attempting to update Clerk metadata for NEW user', {
        clerkUserId: clerkAuth.userId,
        targetRole: targetRole,
        currentMetadataRole: publicMetadata?.role,
        clerkSecretKeySet: !!clerkSecretKey,
        clerkSecretKeyLength: clerkSecretKey?.length || 0
      });
      
      try {
        const clerkClient = getClerkClient();
        
        // Fetch current user to get existing metadata
        let currentClerkUser;
        try {
          currentClerkUser = await clerkClient.users.getUser(clerkAuth.userId);
          publicMetadata = currentClerkUser.publicMetadata || {};
          console.log('🔍 syncClerkUser: Fetched current Clerk metadata', {
            userId: clerkAuth.userId,
            currentRole: publicMetadata?.role,
            allMetadata: publicMetadata
          });
        } catch (fetchError) {
          console.error('❌ syncClerkUser: Failed to fetch current Clerk user:', {
            error: fetchError.message,
            errorCode: fetchError.errors?.[0]?.code,
            errorStatus: fetchError.status,
            userId: clerkAuth.userId
          });
          // Continue with empty metadata
          publicMetadata = {};
        }
        
        // Only update if role is different or not set
        if (publicMetadata?.role !== targetRole) {
          console.log('🔍 syncClerkUser: Role mismatch detected, updating Clerk metadata...', {
            current: publicMetadata?.role || 'none',
            target: targetRole,
            userId: clerkAuth.userId
          });
          
          // Update Clerk metadata with retry logic and verification
          let retries = 3;
          let success = false;
          let lastError = null;
          
          while (retries > 0 && !success) {
            try {
              console.log(`🔍 syncClerkUser: Metadata update attempt ${4 - retries}/3 for userId=${clerkAuth.userId}, role=${targetRole}`);
              
              await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
                publicMetadata: { 
                  ...publicMetadata,
                  role: targetRole 
                }
              });
              
              // CRITICAL: Wait a bit before verification (Clerk API might have eventual consistency)
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Verify update was successful
              const updatedUser = await clerkClient.users.getUser(clerkAuth.userId);
              const updatedRole = updatedUser.publicMetadata?.role;
              
              console.log('🔍 syncClerkUser: Verification check', {
                expected: targetRole,
                actual: updatedRole,
                match: updatedRole === targetRole,
                allMetadata: updatedUser.publicMetadata
              });
              
              if (updatedRole === targetRole) {
                success = true;
                publicMetadata = updatedUser.publicMetadata;
                console.log(`✅ syncClerkUser: Successfully set ${targetRole} role in Clerk publicMetadata for new user:`, clerkAuth.userId);
                console.log('   Final publicMetadata:', JSON.stringify(publicMetadata, null, 2));
              } else {
                throw new Error(`Metadata verification failed: expected ${targetRole}, got ${updatedRole || 'none'}`);
              }
            } catch (retryError) {
              lastError = retryError;
              retries--;
              
              console.error(`❌ syncClerkUser: Retry ${4 - retries} failed:`, {
                error: retryError.message,
                errorCode: retryError.errors?.[0]?.code,
                errorStatus: retryError.status,
                errorStatusCode: retryError.statusCode,
                userId: clerkAuth.userId,
                targetRole: targetRole,
                retriesLeft: retries
              });
              
              if (retries === 0) {
                throw retryError;
              }
              
              // Exponential backoff
              const delay = 1000 * (4 - retries);
              console.log(`⏳ syncClerkUser: Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          if (!success) {
            throw lastError || new Error('Metadata update failed after all retries');
          }
        } else {
          console.log(`✅ syncClerkUser: Role already set correctly in Clerk metadata (${targetRole})`);
        }
      } catch (updateError) {
        // CRITICAL: Log the full error with all details
        console.error('❌ syncClerkUser: CRITICAL FAILURE - Failed to update Clerk metadata after retries:', {
          error: updateError.message,
          errorCode: updateError.errors?.[0]?.code || 'N/A',
          errorStatus: updateError.status || 'N/A',
          errorStatusCode: updateError.statusCode || 'N/A',
          errorType: updateError.constructor?.name || 'Unknown',
          stack: updateError.stack,
          userId: clerkAuth.userId,
          targetRole: targetRole,
          currentMetadata: publicMetadata,
          clerkSecretKeyLength: clerkSecretKey?.length || 0,
          clerkSecretKeyPrefix: clerkSecretKey?.substring(0, 15) || 'NOT SET',
          nodeEnv: process.env.NODE_ENV
        });
        
        // CRITICAL: Return error response so frontend knows metadata update failed
        // This is important because metadata not being set causes admin/vendor dashboard issues
        return res.status(500).json({
          success: false,
          message: 'Failed to update Clerk metadata. Please check backend logs.',
          error: updateError.message,
          code: 'CLERK_METADATA_UPDATE_FAILED',
          debug: {
            userId: clerkAuth.userId,
            targetRole: targetRole,
            errorCode: updateError.errors?.[0]?.code,
            errorStatus: updateError.status
          }
        });
      }
    } else {
      console.log('⚠️ syncClerkUser: Skipping metadata update', {
        hasTargetRole: !!targetRole,
        validRole: targetRole && ['user', 'vendor', 'admin'].includes(targetRole),
        targetRole: targetRole
      });
    }
    
    // Ensure role is set locally if Clerk update failed
    if (targetRole && !publicMetadata?.role) {
      publicMetadata = { ...publicMetadata, role: targetRole };
    }
    
    // Determine role: admin from port 3002, user from port 3000, or from metadata
    const adminEmail = process.env.ADMIN_EMAIL || 'admin100@gmail.com';
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    const adminEmails = adminEmailsEnv ? adminEmailsEnv.split(',').map(e => e.trim().toLowerCase()) : [];
    const normalizedEmail = finalEmail.toLowerCase().trim();
    
    // CRITICAL FIX: Check targetRole FIRST (from query parameter), then metadata/email
    // This ensures role from frontend takes priority over metadata that might not be set yet
    // Check if user should be admin based on targetRole OR metadata or email
    // BUT FIRST check admin limit - if limit reached, force to user role
    let isAdmin = targetRole === 'admin' ||
                   publicMetadata?.role === 'admin' ||
                   normalizedEmail === adminEmail.toLowerCase() ||
                   adminEmails.includes(normalizedEmail);
    
    // If trying to become admin, check limit first
    if (isAdmin) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      const maxAdmins = 2;
      
      // If limit reached, check if this user is already an admin
      if (adminCount >= maxAdmins) {
        const existingAdmin = await User.findOne({ clerkId: clerkAuth.userId, role: 'admin' });
        if (!existingAdmin) {
          // Not an existing admin, so reject admin role
          isAdmin = false;
          // Force role to user if they were trying to become admin
          if (targetRole === 'admin') {
            targetRole = 'user';
          }
          if (publicMetadata?.role === 'admin') {
            publicMetadata.role = 'user';
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ syncClerkUser: Admin role rejected - Maximum admin limit (2) reached`);
          }
        }
        // If user is already admin, allow them to continue (isAdmin stays true)
      }
    }
    
    // CRITICAL FIX: Check targetRole FIRST for vendor (from query parameter), then metadata
    // This ensures role from frontend takes priority over metadata that might not be set yet
    const isVendor = targetRole === 'vendor' || publicMetadata?.role === 'vendor';
    
    // Check if user is vendor (based on targetRole OR metadata)
    if (isVendor) {
      
      // If vendor role is set (via targetRole or metadata), create/find vendor user
      // Find or create user with vendor role
      let vendor = await User.findOne({ clerkId: clerkAuth.userId, role: 'vendor' });
        
      if (!vendor) {
        // Check if user exists with different role - update to vendor
        const existingUser = await User.findOne({ clerkId: clerkAuth.userId });
        if (existingUser) {
          const oldRole = existingUser.role;
          existingUser.role = 'vendor';
          if (!existingUser.businessName) {
            existingUser.businessName = `${finalName || finalEmail.split('@')[0]}'s Business`;
            existingUser.servicesOffered = [];
            existingUser.experience = 0;
            existingUser.availability = 'AVAILABLE';
            existingUser.profileComplete = false;
            existingUser.earningsSummary = {
              totalEarnings: 0,
              thisMonthEarnings: 0,
              totalBookings: 0
            };
          }
          vendor = await existingUser.save();
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ syncClerkUser: Updated existing user from '${oldRole}' to 'vendor'`);
          }
        } else {
          vendor = await User.create({
            clerkId: clerkAuth.userId,
            name: finalName || finalEmail.split('@')[0],
            email: finalEmail.toLowerCase().trim(),
            role: 'vendor',
            isActive: true,
            businessName: `${finalName || finalEmail.split('@')[0]}'s Business`,
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
            console.log('✅ syncClerkUser: Created new vendor user:', { vendorId: vendor._id, email: vendor.email });
          }
        }
      }
      
      // Ensure Clerk metadata is set to vendor if not already set
      if (publicMetadata?.role !== 'vendor') {
        try {
          const clerkClient = getClerkClient();
          await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
            publicMetadata: { 
              ...publicMetadata,
              role: 'vendor' 
            }
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ syncClerkUser: Set vendor role in Clerk publicMetadata');
          }
        } catch (updateError) {
          console.error('❌ syncClerkUser: Failed to update Clerk metadata for vendor:', updateError.message);
        }
      }
      
      // Return vendor data, not user data
      return res.status(200).json({
        success: true,
        message: 'Vendor synced',
        data: {
          vendor: {
            id: vendor._id,
            clerkId: vendor.clerkId,
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            businessName: vendor.businessName,
            availability: vendor.availability,
            profileComplete: vendor.profileComplete,
            earningsSummary: vendor.earningsSummary,
            createdAt: vendor.createdAt,
            updatedAt: vendor.updatedAt,
          }
        }
      });
    }
    
    // CRITICAL FIX: Add admin-specific handling (similar to vendor)
    // Check if user is admin (based on targetRole OR metadata OR email)
    if (isAdmin) {
      // CRITICAL FIX: Check if user is already an admin FIRST
      // If user is already an admin, skip limit check entirely (this is SIGNIN)
      const existingAdmin = await User.findOne({ clerkId: clerkAuth.userId, role: 'admin' });
      
      if (existingAdmin) {
        // User is already an admin - this is SIGNIN, skip limit check
        console.log('✅ syncClerkUser: User is existing admin - skipping admin limit check (SIGNIN)', {
          clerkUserId: clerkAuth.userId,
          adminId: existingAdmin._id,
          reason: 'EXISTING_ADMIN_SIGNIN'
        });
        // Skip admin limit check - proceed with sync
      } else {
        // User is NOT an existing admin - this might be SIGNUP or ROLE_UPGRADE
        // Check admin limit before allowing
        const adminCount = await User.countDocuments({ role: 'admin' });
        const maxAdmins = 2;
        
        console.log('🔍 syncClerkUser: Admin user creation check (late) - user is NOT existing admin', {
          adminCount,
          maxAdmins,
          clerkUserId: clerkAuth.userId,
          isAdmin,
          targetRole,
          reason: 'POTENTIAL_SIGNUP_OR_UPGRADE'
        });
        
        // CRITICAL FIX: Only check limit if adminCount >= maxAdmins
        // If adminCount < maxAdmins, there's room for more admins - always allow
        if (adminCount >= maxAdmins) {
          // Admin limit reached - block new admin creation
          console.log('❌ syncClerkUser: Admin limit reached - blocking new admin creation', {
            adminCount,
            maxAdmins,
            clerkUserId: clerkAuth.userId,
            reason: 'SIGNUP_BLOCKED'
          });
          return res.status(403).json({
            success: false,
            message: 'You are not authorized for this. Maximum admin limit (2) has been reached.',
            code: 'ADMIN_LIMIT_REACHED'
          });
        }
      }
      
      // Find or create user with admin role
      let adminUser = await User.findOne({ clerkId: clerkAuth.userId, role: 'admin' });
      
      if (!adminUser) {
        // Check if user exists with different role - update to admin
        const existingUser = await User.findOne({ clerkId: clerkAuth.userId });
        if (existingUser) {
          // CRITICAL FIX: Check admin limit BEFORE upgrading existing user to admin
          // This prevents users from bypassing the limit by signing up as regular users first
          const currentAdminCount = await User.countDocuments({ role: 'admin' });
          const maxAdmins = 2;
          
          if (currentAdminCount >= maxAdmins) {
            // Admin limit reached - cannot upgrade user to admin
            console.log('❌ syncClerkUser: Admin limit reached - cannot upgrade existing user to admin', {
              adminCount: currentAdminCount,
              maxAdmins,
              clerkUserId: clerkAuth.userId,
              currentRole: existingUser.role,
              reason: 'ROLE_UPGRADE_BLOCKED'
            });
            return res.status(403).json({
              success: false,
              message: 'You are not authorized for this. Maximum admin limit (2) has been reached.',
              code: 'ADMIN_LIMIT_REACHED'
            });
          }
          
          // Limit not reached - allow role upgrade
          const oldRole = existingUser.role;
          existingUser.role = 'admin';
          adminUser = await existingUser.save();
          
          console.log(`✅ syncClerkUser: Updated existing user from '${oldRole}' to 'admin'`, {
            adminCount: currentAdminCount + 1,
            maxAdmins
          });
        } else {
          // User doesn't exist - this is a new admin signup
          // CRITICAL FIX: Double-check admin limit before creating new admin user
          // This is a safety check in case the earlier check was bypassed
          const currentAdminCount = await User.countDocuments({ role: 'admin' });
          const maxAdmins = 2;
          
          if (currentAdminCount >= maxAdmins) {
            console.log('❌ syncClerkUser: Admin limit reached - blocking new admin creation (safety check)', {
              adminCount: currentAdminCount,
              maxAdmins,
              clerkUserId: clerkAuth.userId,
              reason: 'NEW_ADMIN_CREATION_BLOCKED'
            });
            return res.status(403).json({
              success: false,
              message: 'You are not authorized for this. Maximum admin limit (2) has been reached.',
              code: 'ADMIN_LIMIT_REACHED'
            });
          }
          
          // CRITICAL FIX: Do NOT create admin users with generated emails
          // Admins MUST have a valid email from Clerk - this prevents duplicate/invalid admins
          if (!finalEmail || finalEmail.includes('@snapfest.local') || finalEmail === 'unknown' || finalEmail.trim() === '') {
            console.error('❌ syncClerkUser: Cannot create admin user - invalid or missing email', {
              userId: clerkAuth.userId,
              email: finalEmail,
              reason: !finalEmail ? 'No email' : finalEmail.includes('@snapfest.local') ? 'Generated email' : 'Invalid email'
            });
            
            return res.status(400).json({
              success: false,
              error: 'Invalid admin account',
              message: 'Admin accounts must have a valid email address. Please ensure your Clerk account has an email address.'
            });
          }
          
          adminUser = await User.create({
            clerkId: clerkAuth.userId,
            name: finalName || finalEmail.split('@')[0],
            email: finalEmail.toLowerCase().trim(),
            role: 'admin',
            isActive: true,
          });
          
          console.log('✅ syncClerkUser: Created new admin user', {
            adminId: adminUser._id,
            email: adminUser.email,
            adminCount: currentAdminCount + 1,
            maxAdmins
          });
        }
      }
      
      // Ensure Clerk metadata is set to admin if not already set
      if (publicMetadata?.role !== 'admin') {
        try {
          const clerkClient = getClerkClient();
          await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
            publicMetadata: { 
              ...publicMetadata,
              role: 'admin' 
            }
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ syncClerkUser: Set admin role in Clerk publicMetadata');
          }
        } catch (updateError) {
          console.error('❌ syncClerkUser: Failed to update Clerk metadata for admin:', updateError.message);
        }
      }
      
      // Return admin data
      return res.status(200).json({
        success: true,
        message: 'Admin synced',
        data: {
          user: {
            id: adminUser._id,
            clerkId: adminUser.clerkId,
            name: adminUser.name,
            email: adminUser.email,
            phone: adminUser.phone,
            role: adminUser.role,
            profileImage: adminUser.profileImage,
            address: adminUser.address,
            isActive: adminUser.isActive,
            lastLogin: adminUser.lastLogin,
            createdAt: adminUser.createdAt,
            updatedAt: adminUser.updatedAt,
          }
        }
      });
    }
    
    // Set role based on priority: requestedRole > isAdmin > targetRole > user
    // requestedRole is already set as targetRole above if provided
    const userRole = isAdmin ? 'admin' : targetRole;
    
    // Create user document with role-specific initialization
    const userData = {
      clerkId: clerkAuth.userId,
      name: finalName || finalEmail.split('@')[0],
      email: finalEmail.toLowerCase().trim(),
      isActive: true,
      role: userRole,
    };
    
    // Initialize vendor-specific fields if role is vendor
    if (userRole === 'vendor') {
      userData.businessName = `${finalName || finalEmail.split('@')[0]}'s Business`;
      userData.servicesOffered = [];
      userData.experience = 0;
      userData.availability = 'AVAILABLE';
      userData.profileComplete = false;
      userData.earningsSummary = {
        totalEarnings: 0,
        thisMonthEarnings: 0,
        totalBookings: 0
      };
    }
    
    user = await User.create(userData);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Created new user via sync:', { userId: user._id, email: user.email, role: user.role, clerkId: user.clerkId });
    }
  } else {
    // For existing users, also update Clerk metadata if role is provided
    if (targetRole && publicMetadata?.role !== targetRole) {
      try {
        const clerkClient = getClerkClient();
        
        // Update with retry logic and verification
        let retries = 3;
        let success = false;
        
        while (retries > 0 && !success) {
          try {
            await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
              publicMetadata: { 
                ...publicMetadata,
                role: targetRole 
              }
            });
            
            // Verify update was successful
            const updatedUser = await clerkClient.users.getUser(clerkAuth.userId);
            if (updatedUser.publicMetadata?.role === targetRole) {
              success = true;
              publicMetadata = updatedUser.publicMetadata;
              console.log(`✅ syncClerkUser: Updated ${targetRole} role in Clerk publicMetadata for existing user:`, clerkAuth.userId);
            } else {
              throw new Error(`Metadata verification failed: expected ${targetRole}, got ${updatedUser.publicMetadata?.role || 'none'}`);
            }
          } catch (retryError) {
            retries--;
            if (retries === 0) throw retryError;
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
          }
        }
      } catch (updateError) {
        console.error('❌ syncClerkUser: Failed to update Clerk metadata for existing user after retries:', {
          error: updateError.message,
          userId: clerkAuth.userId,
          targetRole: targetRole,
          stack: updateError.stack
        });
      }
    }
    
    // CRITICAL FIX: Update database role if it doesn't match targetRole
    // This fixes cases where user was created with wrong role before sync endpoint ran
    if (targetRole && ['user', 'vendor', 'admin'].includes(targetRole) && user.role !== targetRole) {
      const oldRole = user.role;
      user.role = targetRole;
      
      // Initialize vendor-specific fields if role changed to vendor
      if (targetRole === 'vendor' && !user.businessName) {
        user.businessName = `${user.name || finalName || finalEmail.split('@')[0]}'s Business`;
        user.servicesOffered = [];
        user.experience = 0;
        user.availability = 'AVAILABLE';
        user.profileComplete = false;
        user.earningsSummary = {
          totalEarnings: 0,
          thisMonthEarnings: 0,
          totalBookings: 0
        };
      }
      
      // Remove vendor-specific fields if role changed from vendor to something else
      if (oldRole === 'vendor' && targetRole !== 'vendor') {
        user.businessName = undefined;
        user.servicesOffered = undefined;
        user.experience = undefined;
        user.availability = undefined;
        user.profileComplete = undefined;
        user.earningsSummary = undefined;
      }
      
      await user.save();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ syncClerkUser: Updated database role from '${oldRole}' to '${targetRole}' for user:`, clerkAuth.userId);
      }
    }
    
    // Update user if email/name changed
    const needsUpdate = user.email !== finalEmail.toLowerCase().trim() || 
                         user.name !== finalName;
    
    if (needsUpdate) {
      user.email = finalEmail.toLowerCase().trim();
      user.name = finalName;
      await user.save();
    }
  }
  
  // Fetch updated Clerk metadata to include in response
  let clerkPublicMetadata = publicMetadata || {};
  try {
    const clerkClient = getClerkClient();
    const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
    clerkPublicMetadata = clerkUser.publicMetadata || {};
  } catch (e) {
    // Non-blocking - use existing metadata
  }
  
  return res.status(200).json({
    success: true,
    message: 'User synced',
    data: {
      user: {
        id: user._id,
        clerkId: user.clerkId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        address: user.address,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      clerkPublicMetadata: clerkPublicMetadata,
      roleSet: clerkPublicMetadata?.role || null
    }
  });
});

// @desc    Submit support request
// @route   POST /api/users/support
// @access  Private
export const submitSupportRequest = asyncHandler(async (req, res) => {
  const { bookingId, subject, message } = req.body;
  const userId = req.userId;

  // Validate required fields
  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Subject and message are required'
    });
  }

  // Get user details
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get admin email from environment
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@snapfest.com';

  // Get booking details if bookingId is provided
  let bookingDetails = null;
  if (bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate('packageId', 'title');
    if (booking && booking.userId.toString() === userId.toString()) {
      bookingDetails = {
        id: booking._id,
        packageTitle: booking.packageId?.title,
        eventDate: booking.eventDate,
        location: booking.location
      };
    }
  }

  // Send email to admin
  try {
    const emailService = (await import('../services/emailService.js')).default;
    const getEmailService = emailService;
    const emailServiceInstance = getEmailService();

    const emailSubject = `Support Request: ${subject}`;
    const emailContent = `
      <h2>New Support Request from ${user.name}</h2>
      <p><strong>User Email:</strong> ${user.email}</p>
      <p><strong>User Phone:</strong> ${user.phone || 'Not provided'}</p>
      ${bookingDetails ? `
        <h3>Related Booking:</h3>
        <p><strong>Booking ID:</strong> ${bookingDetails.id}</p>
        <p><strong>Package:</strong> ${bookingDetails.packageTitle}</p>
        <p><strong>Event Date:</strong> ${new Date(bookingDetails.eventDate).toLocaleDateString()}</p>
        <p><strong>Location:</strong> ${bookingDetails.location}</p>
      ` : ''}
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><small>This is an automated email from SnapFest support system.</small></p>
    `;

    await emailServiceInstance.sendEmail(adminEmail, emailSubject, emailContent);

    res.status(200).json({
      success: true,
      message: 'Support request submitted successfully. We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error sending support email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit support request. Please try again later.'
    });
  }
});

