import { User, Booking, Payment, Cart, AuditLog, Review, OTP } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
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
    status: { $in: ['PENDING_PARTIAL_PAYMENT', 'PARTIALLY_PAID', 'ASSIGNED', 'IN_PROGRESS'] }
  });
  const completedBookings = await Booking.countDocuments({ 
    userId, 
    status: 'COMPLETED' 
  });

  // Get recent bookings
  const recentBookings = await Booking.find({ userId })
    .populate('packageId', 'title category basePrice')
    .sort({ createdAt: -1 })
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
    .sort({ createdAt: -1 });

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
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } }
    ];
  }

  // Filter by role
  if (role) {
    query.role = role;
  }

  const users = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

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
    .sort({ createdAt: -1 })
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
  const allUserBookings = await Booking.find({ userId }).select('status eventDate createdAt');
  console.log('📅 User Controller: All user bookings:', allUserBookings.length);
  console.log('📅 User Controller: Booking statuses:', allUserBookings.map(b => ({ status: b.status, eventDate: b.eventDate, createdAt: b.createdAt })));

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
      .sort({ createdAt: -1 });

    console.log('👤 User Controller: Found user bookings:', userBookings.length);

    // Get all payments for these bookings
    const bookingIds = userBookings.map(booking => booking._id);
    
    let paymentQuery = { bookingId: { $in: bookingIds } };
    if (req.query.status) {
      paymentQuery.status = req.query.status;
    }

    const allPayments = await Payment.find(paymentQuery)
      .sort({ createdAt: -1 });

    console.log('👤 User Controller: Found payments:', allPayments.length);

    // Group payments by booking and create detailed payment info
    const paymentDetails = userBookings.map(booking => {
      const bookingPayments = allPayments.filter(payment => 
        payment.bookingId.toString() === booking._id.toString()
      );

      // Calculate payment totals
      const totalPaid = bookingPayments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const pendingAmount = bookingPayments
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const failedAmount = bookingPayments
        .filter(p => p.status === 'FAILED')
        .reduce((sum, p) => sum + p.amount, 0);

      const remainingAmount = booking.totalAmount - totalPaid;
      const paymentProgress = booking.totalAmount > 0 ? (totalPaid / booking.totalAmount) * 100 : 0;

      return {
        booking: {
          _id: booking._id,
          packageId: booking.packageId,
          eventDate: booking.eventDate,
          location: booking.location,
          guests: booking.guests,
          status: booking.status,
          totalAmount: booking.totalAmount,
          amountPaid: booking.amountPaid,
          partialAmount: booking.partialAmount,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        },
        payments: bookingPayments,
        paymentSummary: {
          totalPaid,
          pendingAmount,
          failedAmount,
          remainingAmount,
          paymentProgress: Math.round(paymentProgress),
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
    .sort({ createdAt: -1 })
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
  const { bookingId, rating, comment } = req.body;
  const userId = req.userId;

  // Check if booking exists and belongs to user
  const booking = await Booking.findOne({ _id: bookingId, userId });
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or does not belong to you'
    });
  }

  // Check if booking is completed
  if (booking.status !== 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'Can only review completed bookings'
    });
  }

  // Check if review already exists
  const existingReview = await Review.findOne({ bookingId, userId });
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'Review already exists for this booking'
    });
  }

  // Create review
  const review = await Review.create({
    userId,
    bookingId,
    rating,
    comment
  });

  // Populate review data
  await review.populate('bookingId', 'packageId eventDate');

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'CREATE',
  //     targetId: review._id,
  //     description: 'User created review'
  //   });

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: { review }
  });
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
    .sort({ createdAt: -1 })
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
    .sort({ createdAt: -1 })
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
    const emailService = await import('../services/emailService.js');
    await emailService.default.sendPasswordResetEmail(user.email, user.name, resetToken);
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
    .sort({ createdAt: -1 })
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

  // Update booking status
  booking.status = status;
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
  }).sort({ createdAt: -1 });

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
    const emailService = await import('../services/emailService.js');
    await emailService.default.sendVerificationEmail(user.email, user.name, verificationToken);
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

// @desc    Sync Clerk user to local DB (idempotent)
// @route   POST /api/users/sync
// @access  Private (Clerk cookie session) - uses optionalAuth to handle session edge cases
export const syncClerkUser = asyncHandler(async (req, res) => {
  // This endpoint uses optionalAuth middleware, which means req.user might not exist yet
  // We need to handle both cases: when user is already synced (req.user exists) 
  // and when user needs to be created from Clerk session
  
  // Get role from query parameter (set by frontend when selecting role)
  const requestedRole = req.query.role || null;
  
  // If req.user already exists (from optionalAuth middleware), update role if needed
  if (req.user && req.userId) {
    const user = await User.findById(req.userId);
    if (user) {
      // Update role if requested and different from current role
      if (requestedRole && ['user', 'vendor', 'admin'].includes(requestedRole) && user.role !== requestedRole) {
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
          }
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
  
  // Try getAuth(req) first, then fallback to req.auth
  let clerkAuth = getAuth(req);
  
  // Fallback: Check if req.auth exists
  if (!clerkAuth?.userId && req.auth?.userId) {
    clerkAuth = req.auth;
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ syncClerkUser: Using req.auth fallback');
    }
  }
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    if (!clerkAuth?.userId) {
      console.log('🔍 syncClerkUser: No Clerk session found');
      console.log('   getAuth(req):', getAuth(req));
      console.log('   req.auth:', req.auth);
      console.log('   Request cookies:', Object.keys(req.cookies || {}));
    }
  }
  
  if (!clerkAuth?.userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. Please sign in.' 
    });
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
    // CRITICAL: Set role in Clerk publicMetadata if not already set or different
    // This ensures the role is persisted in Clerk for future requests
    if (targetRole && publicMetadata?.role !== targetRole) {
      try {
        const clerkClient = getClerkClient();
        
        // Update Clerk metadata with the selected role
        await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
          publicMetadata: { 
            ...publicMetadata,
            role: targetRole 
          }
        });
        
        // Refresh metadata after update to confirm it was saved
        const updatedUser = await clerkClient.users.getUser(clerkAuth.userId);
        publicMetadata = updatedUser.publicMetadata || { role: targetRole };
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ syncClerkUser: Set ${targetRole} role in Clerk publicMetadata for user:`, clerkAuth.userId);
          console.log('   Updated publicMetadata:', publicMetadata);
        }
      } catch (updateError) {
        // Log the full error for debugging
        console.error('❌ syncClerkUser: Failed to update Clerk metadata:', {
          error: updateError.message,
          stack: updateError.stack,
          userId: clerkAuth.userId,
          targetRole: targetRole,
          currentMetadata: publicMetadata
        });
        
        // Set role locally even if Clerk update fails (fallback)
        publicMetadata = { ...publicMetadata, role: targetRole };
      }
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
    
    // Check if user should be admin based on metadata or email
    const isAdmin = publicMetadata?.role === 'admin' ||
                   normalizedEmail === adminEmail.toLowerCase() ||
                   adminEmails.includes(normalizedEmail);
    
    // Check if user is vendor (based on metadata only, not ports)
    if (publicMetadata?.role === 'vendor') {
      
      // If vendor role is set, create/find vendor user
      if (publicMetadata?.role === 'vendor') {
        // Find or create user with vendor role
        let vendor = await User.findOne({ clerkId: clerkAuth.userId, role: 'vendor' });
        
        if (!vendor) {
          // Check if user exists with different role - update to vendor
          const existingUser = await User.findOne({ clerkId: clerkAuth.userId });
          if (existingUser) {
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
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ syncClerkUser: Created/updated vendor user:', { vendorId: vendor._id, email: vendor.email });
          }
        }
        
        // Return vendor data, not user data
        return res.status(200).json({
          success: true,
          message: 'Vendor synced (via user sync endpoint from port 3001)',
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
    }
    
    // Auto-set role based on port if not already set (for non-vendor ports)
    // If vendor role detected, redirect to vendor sync endpoint
    if (publicMetadata?.role === 'vendor') {
      return res.status(200).json({
        success: true,
        message: 'User is a vendor. Please use /api/vendors/sync endpoint.',
        data: {
          user: {
            clerkId: clerkAuth.userId,
            email: finalEmail.toLowerCase().trim(),
            role: 'vendor'
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
        await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
          publicMetadata: { 
            ...publicMetadata,
            role: targetRole 
          }
        });
        
        // Refresh metadata after update
        const updatedUser = await clerkClient.users.getUser(clerkAuth.userId);
        publicMetadata = updatedUser.publicMetadata || { role: targetRole };
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ syncClerkUser: Updated ${targetRole} role in Clerk publicMetadata for existing user:`, clerkAuth.userId);
        }
      } catch (updateError) {
        console.error('❌ syncClerkUser: Failed to update Clerk metadata for existing user:', {
          error: updateError.message,
          userId: clerkAuth.userId,
          targetRole: targetRole
        });
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

