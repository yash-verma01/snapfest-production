import { asyncHandler } from '../middleware/errorHandler.js';
import { User, Booking, Payment, OTP, Review } from '../models/index.js';
import AuthService from '../services/authService.js';
import PasswordService from '../services/passwordService.js';

// ==================== VENDOR AUTHENTICATION & PROFILE ====================
export const registerVendor = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Check if vendor already exists
  const existingVendor = await User.findOne({ 
    $or: [{ email }, { phone }],
    role: 'vendor'
  });

  if (existingVendor) {
    return res.status(400).json({
      success: false,
      message: 'Vendor with this email or phone already exists'
    });
  }

  // Check if user with same email/phone exists (but different role)
  const existingUser = await User.findOne({ 
    $or: [{ email }, { phone }],
    role: { $ne: 'vendor' }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'A user account with this email or phone already exists. Please use different credentials or contact support.'
    });
  }

  // Hash password
  const hashedPassword = await PasswordService.hashPassword(password);

  // Create user with vendor role and vendor-specific fields
  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: 'vendor',
    isActive: false, // Admin needs to approve
    businessName: `${name}'s Business`, // Default business name
    servicesOffered: [], // Empty initially
    experience: 0, // Default to 0
    availability: 'AVAILABLE', // Use correct field name
    profileComplete: false,
    earningsSummary: {
      totalEarnings: 0,
      thisMonthEarnings: 0,
      totalBookings: 0
    }
  });

  res.status(201).json({
    success: true,
    message: 'Vendor registered successfully. Please complete your profile and await admin approval.',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        businessName: user.businessName,
        servicesOffered: user.servicesOffered,
        experience: user.experience,
        profileComplete: user.profileComplete
      }
    }
  });
});

export const loginVendor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find vendor user
  const user = await User.findOne({ email, role: 'vendor' }).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if vendor is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Vendor account is not active. Contact admin for approval.'
    });
  }

  // Check password
  const isPasswordValid = await PasswordService.comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Initialize vendor-specific fields if not already set
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

  // Generate token
  const token = AuthService.generateToken(user._id, user.role);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Vendor logged in successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        businessName: user.businessName,
        servicesOffered: user.servicesOffered,
        experience: user.experience,
        availability: user.availability,
        profileComplete: user.profileComplete,
        earningsSummary: user.earningsSummary
      }
    }
  });
});

export const getVendorProfile = asyncHandler(async (req, res) => {
  // Use req.user (which is set by auth middleware) - should have role='vendor'
  let vendor = req.user;
  
  // If req.user is not set, fall back to finding by userId
  if (!vendor) {
    vendor = await User.findOne({ _id: req.userId, role: 'vendor' }).select('-password');
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
  }
  
  // Ensure vendor has required fields initialized
  if (!vendor.businessName) {
    vendor.businessName = `${vendor.name}'s Business`;
    vendor.servicesOffered = [];
    vendor.experience = 0;
    vendor.availability = 'AVAILABLE';
    vendor.profileComplete = false;
    vendor.earningsSummary = {
      totalEarnings: 0,
      thisMonthEarnings: 0,
      totalBookings: 0
    };
    await vendor.save();
  }

  res.status(200).json({
    success: true,
    data: {
      vendor: {
        id: vendor._id,
        clerkId: vendor.clerkId,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        profileImage: vendor.profileImage,
        businessName: vendor.businessName,
        businessType: vendor.businessType,
        servicesOffered: vendor.servicesOffered,
        experience: vendor.experience,
        location: vendor.location,
        bio: vendor.bio,
        portfolio: vendor.portfolio,
        pricing: vendor.pricing,
        availability: vendor.availability,
        profileComplete: vendor.profileComplete,
        earningsSummary: vendor.earningsSummary,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt
      }
    }
  });
});

export const updateVendorProfile = asyncHandler(async (req, res) => {
  const { 
    name, 
    phone, 
    businessName, 
    servicesOffered, 
    experience, 
    businessType,
    location,
    bio,
    availability,
    portfolio,
    pricing
  } = req.body;

  // Update user profile
  const user = await User.findById(req.userId);
  if (name) user.name = name;
  if (phone) {
    // Check if phone is already taken
    const existingUser = await User.findOne({ phone, _id: { $ne: req.userId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already taken'
      });
    }
    user.phone = phone;
  }
  await user.save();

  // Update vendor-specific fields (user already loaded above)
  if (businessName) user.businessName = businessName;
  if (servicesOffered) user.servicesOffered = servicesOffered;
  if (experience !== undefined) user.experience = experience;
  if (businessType) user.businessType = businessType;
  if (location) user.location = location;
  if (bio) user.bio = bio;
  if (availability) user.availability = availability;
  if (portfolio) user.portfolio = portfolio;
  if (pricing) user.pricing = pricing;
  
  // Mark profile as complete if essential fields are filled
  user.profileComplete = !!(businessName && servicesOffered && servicesOffered.length > 0);
  
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Vendor profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage
      },
      vendor: {
        id: user._id,
        businessName: user.businessName,
        servicesOffered: user.servicesOffered,
        experience: user.experience
      }
    }
  });
});

export const changeVendorPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId).select('+password');

  // Check current password
  const isCurrentPasswordValid = await PasswordService.comparePassword(currentPassword, user.password);
  
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const hashedNewPassword = await PasswordService.hashPassword(newPassword);
  user.password = hashedNewPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

export const logoutVendor = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Vendor logged out successfully'
  });
});

// ==================== VENDOR DASHBOARD & ANALYTICS ====================
export const getVendorDashboard = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  // Get recent bookings
  const recentBookings = await Booking.find({ assignedVendorId: vendor._id })
    .populate('userId', 'name email phone')
    .populate('packageId', 'name category')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get pending bookings
  const pendingBookings = await Booking.countDocuments({ 
    assignedVendorId: vendor._id, 
    status: { $in: ['ASSIGNED', 'IN_PROGRESS'] } 
  });

  // Get completed bookings this month
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const completedThisMonth = await Booking.countDocuments({
    assignedVendorId: vendor._id,
    status: 'COMPLETED',
    completedAt: { $gte: currentMonth }
  });

  // Get total earnings this month
  const earningsThisMonth = await Payment.aggregate([
    {
      $match: {
        vendorId: vendor._id,
        status: 'COMPLETED',
        createdAt: { $gte: currentMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      vendor: {
        id: vendor._id,
        businessName: vendor.businessName,
        isAvailable: vendor.isAvailable,
        rating: vendor.rating,
        totalBookings: vendor.totalBookings,
        totalEarnings: vendor.totalEarnings
      },
      dashboard: {
        pendingBookings,
        completedThisMonth,
        earningsThisMonth: earningsThisMonth[0]?.total || 0,
        recentBookings
      }
    }
  });
});

export const getVendorStats = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  // Get booking statistics
  const bookingStats = await Booking.aggregate([
    { $match: { vendorId: vendor._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get monthly earnings for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyEarnings = await Payment.aggregate([
    {
      $match: {
        vendorId: vendor._id,
        status: 'COMPLETED',
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Get average rating from reviews
  const reviewStats = await Review.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    {
      $match: {
        'booking.vendorId': vendor._id
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      bookingStats,
      monthlyEarnings,
      reviewStats: reviewStats[0] || { averageRating: 0, totalReviews: 0 }
    }
  });
});

export const getVendorEarnings = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  const { period = 'month' } = req.query;
  
  let startDate;
  const endDate = new Date();
  
  switch (period) {
    case 'week':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
  }

  // Get earnings for the period
  const earnings = await Payment.aggregate([
    {
      $match: {
        vendorId: vendor._id,
        status: 'COMPLETED',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageEarning: { $avg: '$amount' }
      }
    }
  ]);

  // Get daily earnings breakdown
  const dailyEarnings = await Payment.aggregate([
    {
      $match: {
        vendorId: vendor._id,
        status: 'COMPLETED',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      startDate,
      endDate,
      earnings: earnings[0] || { totalEarnings: 0, totalTransactions: 0, averageEarning: 0 },
      dailyEarnings
    }
  });
});

export const getVendorPerformance = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  // Get performance metrics
  const totalBookings = await Booking.countDocuments({ vendorId: vendor._id });
  const completedBookings = await Booking.countDocuments({ 
    vendorId: vendor._id, 
    status: 'COMPLETED' 
  });
  const cancelledBookings = await Booking.countDocuments({ 
    vendorId: vendor._id, 
    status: 'CANCELLED' 
  });

  // Calculate completion rate
  const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
  const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

  // Get average response time (time from assignment to start)
  const responseTimeData = await Booking.aggregate([
    {
      $match: {
        vendorId: vendor._id,
        status: { $in: ['IN_PROGRESS', 'COMPLETED'] }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: {
          $avg: {
            $subtract: ['$startedAt', '$assignedAt']
          }
        }
      }
    }
  ]);

  // Get recent reviews and ratings
  const recentReviews = await Review.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    {
      $match: {
        'booking.vendorId': vendor._id
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $limit: 5
    },
    {
      $project: {
        rating: 1,
        comment: 1,
        createdAt: 1,
        'booking.eventDate': 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      performance: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        completionRate: Math.round(completionRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
        avgResponseTime: responseTimeData[0]?.avgResponseTime || 0
      },
      recentReviews
    }
  });
});

// ==================== BOOKING MANAGEMENT ====================
export const getVendorBookings = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Build query for assigned bookings first
  let assignedQuery = { assignedVendorId: vendor._id };
  if (status) {
    assignedQuery.status = status;
  }

  console.log('🔍 Vendor Bookings Debug:', {
    vendorId: vendor._id,
    userId: req.userId,
    assignedQuery,
    vendor: vendor
  });

  // Build query for other bookings (legacy vendorId field)
  let otherQuery = { vendorId: vendor._id };
  if (status) {
    otherQuery.status = status;
  }

  // Get assigned bookings first (prioritized)
  const assignedBookings = await Booking.find(assignedQuery)
    .populate('userId', 'name email phone')
    .populate('packageId', 'name category price')
    .populate('assignedVendorId', 'name email')
    .sort({ assignedAt: -1, createdAt: -1 })
    .limit(limit);

  // If we have space, get other bookings
  const remainingLimit = limit - assignedBookings.length;
  let otherBookings = [];
  
  if (remainingLimit > 0) {
    otherBookings = await Booking.find(otherQuery)
      .populate('userId', 'name email phone')
      .populate('packageId', 'name category price')
      .sort({ createdAt: -1 })
      .limit(remainingLimit);
  }

  // Combine results with assigned bookings first
  const allBookings = [...assignedBookings, ...otherBookings];

  // Get total counts for pagination
  const assignedTotal = await Booking.countDocuments(assignedQuery);
  const otherTotal = await Booking.countDocuments(otherQuery);
  const total = assignedTotal + otherTotal;

  res.status(200).json({
    success: true,
    data: {
      bookings: allBookings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      assignedCount: assignedTotal,
      otherCount: otherTotal
    }
  });
});

export const getVendorBookingById = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    vendorId: vendor._id
  })
    .populate('userId', 'name email phone')
    .populate('packageId', 'name category price description')
    .populate('addOns', 'name price');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { booking }
  });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body || {};
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    vendorId: vendor._id
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Validate status transition (use vendorStatus for validation)
  const currentVendorStatus = booking.vendorStatus || booking.status;
  const validTransitions = {
    'ASSIGNED': ['IN_PROGRESS', 'CANCELLED'],
    'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [],
    'CANCELLED': []
  };

  if (!validTransitions[currentVendorStatus]?.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot change status from ${currentVendorStatus} to ${status}`
    });
  }

  // Update booking - use vendorStatus for vendor updates
  booking.vendorStatus = status;
  // Also update main status for backward compatibility
  if (status === 'COMPLETED') {
    booking.status = 'COMPLETED';
  } else if (status === 'CANCELLED') {
    booking.status = 'CANCELLED';
  }
  
  if (notes) booking.vendorNotes = notes;

  // Set timestamps based on status
  if (status === 'IN_PROGRESS') {
    booking.startedAt = new Date();
  } else if (status === 'COMPLETED') {
    booking.completedAt = new Date();
  } else if (status === 'CANCELLED') {
    booking.cancelledAt = new Date();
  }

  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking status updated successfully',
    data: { booking }
  });
});

export const startBooking = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    assignedVendorId: req.userId,
    status: 'FULLY_PAID'
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or not ready to start. Payment must be completed and OTP verified.'
    });
  }

  // Check if OTP has been verified
  if (!booking.otpVerified) {
    return res.status(400).json({
      success: false,
      message: 'OTP verification required before starting the event'
    });
  }

  booking.status = 'IN_PROGRESS';
  booking.startedAt = new Date();
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking started successfully',
    data: { booking }
  });
});

export const completeBooking = asyncHandler(async (req, res) => {
  const { completionNotes } = req.body || {};
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    assignedVendorId: vendor._id,
    status: 'IN_PROGRESS'
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or not in IN_PROGRESS status'
    });
  }

  booking.vendorStatus = 'COMPLETED';
  booking.status = 'COMPLETED'; // Also update main status
  booking.completedAt = new Date();
  if (completionNotes) booking.completionNotes = completionNotes;

  // Update vendor stats
  vendor.totalBookings += 1;
  await vendor.save();

  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking completed successfully',
    data: { booking }
  });
});

// @desc    Verify booking OTP (Vendor)
// @route   POST /api/vendors/bookings/:id/verify-otp
// @access  Private/Vendor
export const verifyBookingOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const { id } = req.params;
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  // Find booking
  const booking = await Booking.findOne({
    _id: id,
    assignedVendorId: vendor._id,
    status: 'COMPLETED'
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or not assigned to you'
    });
  }

  // Check if OTP exists
  if (!booking.verificationOTP) {
    return res.status(400).json({
      success: false,
      message: 'No OTP has been generated for this booking. Please ask admin to generate OTP.'
    });
  }

  // Check if OTP is expired
  if (booking.verificationOTPExpiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'OTP has expired. Please ask admin to generate a new OTP.'
    });
  }

  // Check if OTP is already verified
  if (booking.otpVerified) {
    return res.status(400).json({
      success: false,
      message: 'OTP has already been verified for this booking'
    });
  }

  // Verify OTP
  if (booking.verificationOTP !== otp) {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP. Please check and try again.'
    });
  }

  // OTP is valid - mark as verified
  booking.otpVerified = true;
  booking.otpVerifiedAt = new Date();
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully. Booking is now verified.',
    data: {
      booking: {
        id: booking._id,
        status: booking.status,
        otpVerified: booking.otpVerified,
        otpVerifiedAt: booking.otpVerifiedAt
      }
    }
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body || {};
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    vendorId: vendor._id,
    status: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or cannot be cancelled'
    });
  }

  booking.status = 'CANCELLED';
  booking.cancelledAt = new Date();
  if (cancellationReason) booking.cancellationReason = cancellationReason;

  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking }
  });
});

// ==================== OTP VERIFICATION SYSTEM ====================
export const getPendingOTPs = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  // Get bookings that need OTP verification
  const bookings = await Booking.find({
    assignedVendorId: req.userId,
    status: 'FULLY_PAID',
    otpVerified: false
  })
    .populate('userId', 'name phone')
    .populate('packageId', 'title')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { bookings }
  });
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const { bookingId, otpCode } = req.body;
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  // Find the booking
  const booking = await Booking.findOne({
    _id: bookingId,
    assignedVendorId: req.userId,
    status: 'FULLY_PAID'
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or not ready for OTP verification'
    });
  }

  // Find the OTP
  const otp = await OTP.findOne({
    bookingId: booking._id,
    code: otpCode,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP'
    });
  }

  // Verify OTP
  otp.isUsed = true;
  otp.verifiedAt = new Date();
  otp.verifiedBy = req.userId;
  await otp.save();

  // Update booking
  booking.otpVerified = true;
  booking.otpVerifiedAt = new Date();
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    data: { booking }
  });
});

export const getOTPHistory = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const otps = await OTP.find({ verifiedBy: req.userId })
    .populate('bookingId', 'eventDate status')
    .sort({ verifiedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await OTP.countDocuments({ verifiedBy: req.userId });

  res.status(200).json({
    success: true,
    data: {
      otps,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const requestNewOTP = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    vendorId: vendor._id,
    status: 'FULLY_PAID'
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Generate new OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const otp = await OTP.create({
    bookingId: booking._id,
    code: otpCode,
    expiresAt,
    isUsed: false
  });

  res.status(200).json({
    success: true,
    message: 'New OTP generated successfully',
    data: { 
      otp: {
        id: otp._id,
        code: otpCode,
        expiresAt
      }
    }
  });
});

// ==================== PAYMENT MANAGEMENT ====================
export const confirmCashPayment = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Confirm cash payment endpoint - To be implemented',
    data: { payment: 'Coming soon' }
  });
});

export const getPendingPayments = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get pending payments endpoint - To be implemented',
    data: { payments: 'Coming soon' }
  });
});

export const verifyPaymentCompletion = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Verify payment completion endpoint - To be implemented',
    data: { payment: 'Coming soon' }
  });
});

// ==================== AVAILABILITY & SETTINGS ====================
export const getVendorAvailability = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      isAvailable: vendor.isAvailable,
      availabilitySchedule: vendor.availabilitySchedule || [],
      workingHours: vendor.workingHours || {},
      holidays: vendor.holidays || []
    }
  });
});

export const updateVendorAvailability = asyncHandler(async (req, res) => {
  const { isAvailable, availabilitySchedule, workingHours, holidays } = req.body;
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  if (isAvailable !== undefined) vendor.isAvailable = isAvailable;
  if (availabilitySchedule) vendor.availabilitySchedule = availabilitySchedule;
  if (workingHours) vendor.workingHours = workingHours;
  if (holidays) vendor.holidays = holidays;

  await vendor.save();

  res.status(200).json({
    success: true,
    message: 'Vendor availability updated successfully',
    data: {
      isAvailable: vendor.isAvailable,
      availabilitySchedule: vendor.availabilitySchedule,
      workingHours: vendor.workingHours,
      holidays: vendor.holidays
    }
  });
});

export const toggleVendorActive = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  vendor.isAvailable = !vendor.isAvailable;
  await vendor.save();

  res.status(200).json({
    success: true,
    message: `Vendor ${vendor.isAvailable ? 'activated' : 'deactivated'} successfully`,
    data: {
      isAvailable: vendor.isAvailable
    }
  });
});

export const getVendorSettings = asyncHandler(async (req, res) => {
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      notificationSettings: vendor.notificationSettings || {},
      privacySettings: vendor.privacySettings || {},
      businessSettings: vendor.businessSettings || {},
      paymentSettings: vendor.paymentSettings || {}
    }
  });
});

export const updateVendorSettings = asyncHandler(async (req, res) => {
  const { notificationSettings, privacySettings, businessSettings, paymentSettings } = req.body;
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  if (notificationSettings) vendor.notificationSettings = notificationSettings;
  if (privacySettings) vendor.privacySettings = privacySettings;
  if (businessSettings) vendor.businessSettings = businessSettings;
  if (paymentSettings) vendor.paymentSettings = paymentSettings;

  await vendor.save();

  res.status(200).json({
    success: true,
    message: 'Vendor settings updated successfully',
    data: {
      notificationSettings: vendor.notificationSettings,
      privacySettings: vendor.privacySettings,
      businessSettings: vendor.businessSettings,
      paymentSettings: vendor.paymentSettings
    }
  });
});

// ==================== NOTIFICATIONS & COMMUNICATION ====================
export const getVendorNotifications = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get vendor notifications endpoint - To be implemented',
    data: { notifications: 'Coming soon' }
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mark notification read endpoint - To be implemented',
    data: { notification: 'Coming soon' }
  });
});

export const getVendorMessages = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get vendor messages endpoint - To be implemented',
    data: { messages: 'Coming soon' }
  });
});

export const sendMessageToAdmin = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Send message to admin endpoint - To be implemented',
    data: { message: 'Coming soon' }
  });
});

// ==================== EARNINGS & PAYOUTS ====================
export const getMonthlyEarnings = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get monthly earnings endpoint - To be implemented',
    data: { earnings: 'Coming soon' }
  });
});

export const getPayoutHistory = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get payout history endpoint - To be implemented',
    data: { payouts: 'Coming soon' }
  });
});

export const getPendingPayouts = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get pending payouts endpoint - To be implemented',
    data: { payouts: 'Coming soon' }
  });
});

export const requestPayout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Request payout endpoint - To be implemented',
    data: { payout: 'Coming soon' }
  });
});

// ==================== WORKFLOW MANAGEMENT ====================
export const getPreparationTasks = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get preparation tasks endpoint - To be implemented',
    data: { tasks: 'Coming soon' }
  });
});

export const completeTask = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Complete task endpoint - To be implemented',
    data: { task: 'Coming soon' }
  });
});

export const getEventChecklist = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get event checklist endpoint - To be implemented',
    data: { checklist: 'Coming soon' }
  });
});

export const startEventExecution = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Start event execution endpoint - To be implemented',
    data: { event: 'Coming soon' }
  });
});

export const completeEvent = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Complete event endpoint - To be implemented',
    data: { event: 'Coming soon' }
  });
});

export const reportIssues = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Report issues endpoint - To be implemented',
    data: { issue: 'Coming soon' }
  });
});

// ==================== ADDITIONAL VENDOR ENDPOINTS ====================

// @desc    Get OTP by ID
// @route   GET /api/vendors/otps/:id
// @access  Private/Vendor
export const getOTPById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.userId;

  const otp = await OTP.findOne({
    _id: id,
    vendorId
  });

  if (!otp) {
    return res.status(404).json({
      success: false,
      message: 'OTP not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { otp }
  });
});

// @desc    Verify specific OTP
// @route   POST /api/vendors/otps/:id/verify
// @access  Private/Vendor
export const verifySpecificOTP = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { otpCode } = req.body;
  const vendorId = req.userId;

  const otp = await OTP.findOne({
    _id: id,
    vendorId,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otp) {
    return res.status(404).json({
      success: false,
      message: 'OTP not found or expired'
    });
  }

  if (otp.code !== otpCode) {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP code'
    });
  }

  // Mark OTP as used
  otp.isUsed = true;
  otp.verifiedAt = new Date();
  otp.verifiedBy = vendorId;
  await otp.save();

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    data: { otp }
  });
});

// @desc    Process payment
// @route   POST /api/vendors/process-payment
// @access  Private/Vendor
export const processPayment = asyncHandler(async (req, res) => {
  const { bookingId, paymentMethod, amount } = req.body;
  const vendorId = req.userId;

  if (!bookingId || !paymentMethod || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID, payment method, and amount are required'
    });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.assignedVendorId.toString() !== vendorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This booking is not assigned to you'
    });
  }

  // Create payment record
  const payment = await Payment.create({
    bookingId,
    vendorId,
    amount,
    paymentMethod,
    status: 'PENDING',
    processedAt: new Date()
  });

  res.status(200).json({
    success: true,
    message: 'Payment processed successfully',
    data: { payment }
  });
});

// @desc    Get vendor payments
// @route   GET /api/vendors/payments
// @access  Private/Vendor
export const getVendorPayments = asyncHandler(async (req, res) => {
  const vendorId = req.userId;
  const { page = 1, limit = 10, status } = req.query;

  const filter = { vendorId };
  if (status) filter.status = status;

  const payments = await Payment.find(filter)
    .populate('bookingId', 'eventName eventDate')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get payment by ID
// @route   GET /api/vendors/payments/:id
// @access  Private/Vendor
export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.userId;

  const payment = await Payment.findOne({
    _id: id,
    vendorId
  }).populate('bookingId', 'eventName eventDate customerName');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { payment }
  });
});

// @desc    Accept booking
// @route   PUT /api/vendors/bookings/:id/accept
// @access  Private/Vendor
export const acceptBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.userId;

  const booking = await Booking.findById(id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.assignedVendorId.toString() !== vendorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This booking is not assigned to you'
    });
  }

  booking.vendorStatus = 'IN_PROGRESS';
  booking.status = 'IN_PROGRESS'; // Also update main status
  booking.vendorAcceptedAt = new Date();
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking accepted successfully',
    data: { booking }
  });
});

// @desc    Reject booking
// @route   PUT /api/vendors/bookings/:id/reject
// @access  Private/Vendor
export const rejectBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const vendorId = req.userId;

  const booking = await Booking.findById(id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.assignedVendorId.toString() !== vendorId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This booking is not assigned to you'
    });
  }

  booking.status = 'REJECTED';
  booking.vendorRejectedAt = new Date();
  booking.rejectionReason = reason;
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking rejected successfully',
    data: { booking }
  });
});

// @desc    Get assigned bookings for vendor
// @route   GET /api/vendors/bookings/assigned
// @access  Private/Vendor
export const getAssignedBookings = asyncHandler(async (req, res) => {
  const vendorId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const bookings = await Booking.find({ assignedVendorId: vendorId })
    .populate('userId', 'name email phone')
    .populate('packageId', 'title category basePrice')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments({ assignedVendorId: vendorId });

  res.status(200).json({
    success: true,
    data: {
      bookings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get booking by ID
// @route   GET /api/vendors/bookings/:id
// @access  Private/Vendor
export const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.userId;

  const booking = await Booking.findOne({
    _id: id,
    assignedVendorId: vendorId
  }).populate('customerId', 'name email phone');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { booking }
  });
});

// @desc    Sync Clerk vendor to local DB (idempotent)
// @route   POST /api/vendors/sync
// @access  Private (Clerk cookie session) - uses optionalAuth to handle session edge cases
export const syncClerkVendor = asyncHandler(async (req, res) => {
  // If req.user already exists (from auth middleware), return it
  if (req.user && req.user.role === 'vendor') {
    const vendor = req.user;
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
          businessType: vendor.businessType,
          servicesOffered: vendor.servicesOffered,
          availability: vendor.availability,
          profileComplete: vendor.profileComplete,
          createdAt: vendor.createdAt,
          updatedAt: vendor.updatedAt,
        }
      }
    });
  }
  
  // If req.vendor doesn't exist, get Clerk session and create/find vendor
  const { getAuth } = await import('@clerk/express');
  const { createClerkClient } = await import('@clerk/clerk-sdk-node');
  
  // Helper function to get the correct clerkClient based on origin
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
      console.log('⚠️ syncClerkVendor: Using req.auth fallback');
    }
  }
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    if (!clerkAuth?.userId) {
      console.log('🔍 syncClerkVendor: No Clerk session found');
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
  
  // Check if request came from vendor port (3001)
  // Get origin from multiple sources for better reliability
  const origin = req.headers.origin || 
                 req.headers.referer || 
                 req.headers['x-forwarded-host'] ||
                 (req.protocol + '://' + req.get('host')) ||
                 '';
  
  // Also check request URL and host for port number as fallback
  const urlHost = req.get('host') || '';
  const requestUrl = req.url || req.originalUrl || '';
  
  // Get Clerk user metadata
  let publicMetadata = clerkAuth?.claims?.publicMetadata || null;
  if (!publicMetadata) {
    try {
      const clerkClient = getClerkClient();
      const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
      publicMetadata = clerkUser.publicMetadata || null;
    } catch (e) {
      // Non-blocking
    }
  }
  
  // If role is not set in Clerk metadata, update it (for new vendor signups)
  // This handles the case where vendor signs up but Clerk metadata doesn't have role yet
  if (publicMetadata?.role !== 'vendor') {
    try {
      const clerkClient = getClerkClient();
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
        console.log('✅ syncClerkVendor: Set vendor role in Clerk publicMetadata for user:', clerkAuth.userId);
      }
    } catch (updateError) {
      // Log error but don't block - allow vendor creation to proceed
      console.error('❌ syncClerkVendor: Failed to update Clerk metadata:', {
        error: updateError.message,
        userId: clerkAuth.userId
      });
      // Set role locally as fallback
      publicMetadata = { ...publicMetadata, role: 'vendor' };
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
  const sanitizedName = (name || 'Vendor').trim();
  
  // If email not in claims, fetch from Clerk API
  let finalEmail = email;
  let finalName = sanitizedName;
  
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
      console.error('❌ Failed to fetch vendor from Clerk API:', apiError.message);
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
  
  // Find or create vendor in User collection with role='vendor'
  let vendor = await User.findOne({ clerkId: clerkAuth.userId, role: 'vendor' });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 syncClerkVendor: Looking for vendor:', {
      clerkId: clerkAuth.userId,
      vendorFound: !!vendor,
      origin,
      publicMetadataRole: publicMetadata?.role
    });
  }
  
  if (!vendor) {
    // Check if user exists with different role - update role to vendor
    const existingUser = await User.findOne({ clerkId: clerkAuth.userId });
    if (existingUser) {
      // Update existing user to vendor role
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
      
      // Ensure Clerk metadata is also updated
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
            console.log(`✅ syncClerkVendor: Updated Clerk metadata and database role from '${oldRole}' to 'vendor'`);
          }
        } catch (updateError) {
          console.error('❌ syncClerkVendor: Failed to update Clerk metadata:', updateError.message);
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Updated user role to vendor via sync:', { vendorId: vendor._id, email: vendor.email, clerkId: vendor.clerkId });
      }
    } else {
      // Create new vendor user
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 syncClerkVendor: Creating new vendor user...');
        console.log('   Email:', finalEmail);
        console.log('   Name:', finalName);
        console.log('   ClerkId:', clerkAuth.userId);
      }
      
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
      
      // Ensure Clerk metadata is set to vendor (should already be set above, but double-check)
      if (publicMetadata?.role !== 'vendor') {
        try {
          const clerkClient = getClerkClient();
          await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
            publicMetadata: { 
              ...publicMetadata,
              role: 'vendor' 
            }
          });
        } catch (updateError) {
          console.error('❌ syncClerkVendor: Failed to update Clerk metadata for new vendor:', updateError.message);
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Created new vendor via sync:', { vendorId: vendor._id, email: vendor.email, clerkId: vendor.clerkId });
      }
    }
  } else {
    // Update vendor if email/name changed
    const needsUpdate = vendor.email !== finalEmail.toLowerCase().trim() || 
                         vendor.name !== finalName;
    
    if (needsUpdate) {
      vendor.email = finalEmail.toLowerCase().trim();
      vendor.name = finalName;
      await vendor.save();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Updated vendor via sync:', { vendorId: vendor._id, email: vendor.email });
      }
    }
  }
  
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
        profileImage: vendor.profileImage,
        businessName: vendor.businessName,
        businessType: vendor.businessType,
        servicesOffered: vendor.servicesOffered,
        availability: vendor.availability,
        profileComplete: vendor.profileComplete,
        earningsSummary: vendor.earningsSummary,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
      }
    }
  });
});