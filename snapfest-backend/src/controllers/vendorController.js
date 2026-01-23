import { asyncHandler } from '../middleware/errorHandler.js';
import { User, Booking, Payment, OTP, Review, Notification } from '../models/index.js';
import AuthService from '../services/authService.js';
import PasswordService from '../services/passwordService.js';
import notificationService from '../services/notificationService.js';

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
      user: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        profileImage: vendor.profileImage
      },
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
    .populate('packageId', 'title category')
    .sort({ _id: -1 })
    .limit(5);

  // Get pending bookings
  const pendingBookings = await Booking.countDocuments({ 
    assignedVendorId: vendor._id, 
    vendorStatus: { $in: ['ASSIGNED', 'IN_PROGRESS'] } 
  });

  // Get completed bookings this month
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const completedThisMonth = await Booking.countDocuments({
    assignedVendorId: vendor._id,
    vendorStatus: 'COMPLETED',
    completedAt: { $gte: currentMonth }
  });

  // Get total earnings this month
  // Calculate earnings from payments for bookings assigned to this vendor and completed
  const earningsThisMonth = await Payment.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    {
      $unwind: '$booking'
    },
    {
      $match: {
        'booking.assignedVendorId': vendor._id,
        'booking.vendorStatus': 'COMPLETED',
        status: 'SUCCESS',
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
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    {
      $unwind: '$booking'
    },
    {
      $match: {
        'booking.assignedVendorId': vendor._id,
        'booking.vendorStatus': 'COMPLETED',
        status: 'SUCCESS',
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
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    {
      $unwind: '$booking'
    },
    {
      $match: {
        'booking.assignedVendorId': vendor._id,
        'booking.vendorStatus': 'COMPLETED',
        status: 'SUCCESS',
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
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    {
      $unwind: '$booking'
    },
    {
      $match: {
        'booking.assignedVendorId': vendor._id,
        'booking.vendorStatus': 'COMPLETED',
        status: 'SUCCESS',
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
    vendorStatus: 'COMPLETED' 
  });
  const cancelledBookings = await Booking.countDocuments({ 
    vendorId: vendor._id, 
    vendorStatus: 'CANCELLED' 
  });

  // Calculate completion rate
  const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
  const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

  // Get average response time (time from assignment to start)
  const responseTimeData = await Booking.aggregate([
    {
      $match: {
        vendorId: vendor._id,
        vendorStatus: { $in: ['IN_PROGRESS', 'COMPLETED'] }
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
      $sort: { _id: -1 }
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
    assignedQuery.vendorStatus = status;
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
    otherQuery.vendorStatus = status;
  }

  // Get assigned bookings first (prioritized)
  const assignedBookings = await Booking.find(assignedQuery)
    .populate('userId', 'name email phone')
    .populate('packageId', 'title category basePrice')
    .populate('assignedVendorId', 'name email')
    .sort({ _id: -1 })
    .limit(limit);

  // If we have space, get other bookings
  const remainingLimit = limit - assignedBookings.length;
  let otherBookings = [];
  
  if (remainingLimit > 0) {
    otherBookings = await Booking.find(otherQuery)
      .populate('userId', 'name email phone')
      .populate('packageId', 'title category basePrice')
      .sort({ _id: -1 })
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
    .populate('packageId', 'title category basePrice description')
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
  const currentVendorStatus = booking.vendorStatus || 'ASSIGNED'; // Default to ASSIGNED if null
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
    vendorStatus: 'ASSIGNED'
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or not in ASSIGNED status. Please accept the booking first.'
    });
  }

  // Note: OTP verification happens AFTER event completion, not before starting

  booking.vendorStatus = 'IN_PROGRESS';
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
    vendorStatus: 'IN_PROGRESS'
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or not in IN_PROGRESS status'
    });
  }

  booking.vendorStatus = 'COMPLETED';
  booking.completedAt = new Date();
  if (completionNotes) booking.completionNotes = completionNotes;

  // Calculate earnings from successful payments for this booking
  const bookingPayments = await Payment.aggregate([
    {
      $match: {
        bookingId: booking._id,
        status: 'SUCCESS'
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const bookingEarnings = bookingPayments[0]?.totalAmount || 0;

  // Update vendor stats and earnings
  vendor.totalBookings += 1;
  
  // Update total earnings
  if (bookingEarnings > 0) {
    vendor.totalEarnings = (vendor.totalEarnings || 0) + bookingEarnings;
    
    // Update earningsSummary
    if (!vendor.earningsSummary) {
      vendor.earningsSummary = {
        totalEarnings: 0,
        thisMonthEarnings: 0,
        totalBookings: 0
      };
    }
    vendor.earningsSummary.totalEarnings = (vendor.earningsSummary.totalEarnings || 0) + bookingEarnings;
    
    // Update this month earnings if booking is completed this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    if (booking.completedAt >= currentMonth) {
      vendor.earningsSummary.thisMonthEarnings = (vendor.earningsSummary.thisMonthEarnings || 0) + bookingEarnings;
    }
  }
  
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
    vendorStatus: 'COMPLETED'
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

  // Check if payment is complete and update payment status
  // This handles cases where cash payment was made but paymentStatus wasn't updated
  if (booking.amountPaid >= booking.totalAmount && booking.paymentStatus !== 'FULLY_PAID') {
    booking.paymentStatus = 'FULLY_PAID';
    booking.paymentPercentagePaid = 100;
    booking.remainingPercentage = 0;
    booking.remainingAmount = 0;
  }

  await booking.save();

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully. Booking is now verified.',
    data: {
      booking: {
        id: booking._id,
        vendorStatus: booking.vendorStatus,
        paymentStatus: booking.paymentStatus,
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
    vendorStatus: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or cannot be cancelled'
    });
  }

  booking.vendorStatus = 'CANCELLED';
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
    paymentStatus: 'FULLY_PAID',
    otpVerified: false
  })
    .populate('userId', 'name phone')
    .populate('packageId', 'title')
    .sort({ _id: -1 });

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
    paymentStatus: 'FULLY_PAID'
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
    paymentStatus: 'FULLY_PAID'
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
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const { unreadOnly } = req.query;

  let query = { userId };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const notification = await notificationService.markAsRead(id, userId);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: { notification }
  });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const userId = req.userId;

  await notificationService.markAllAsRead(userId);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
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
  const vendor = req.user || await User.findOne({ _id: req.userId, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }

  const { months = 6 } = req.query; // Default to last 6 months
  const monthsAgo = new Date();
  monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));
  
  // Get monthly earnings breakdown
  const monthlyEarnings = await Payment.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    {
      $unwind: '$booking'
    },
    {
      $match: {
        'booking.assignedVendorId': vendor._id,
        'booking.vendorStatus': 'COMPLETED',
        status: 'SUCCESS',
        createdAt: { $gte: monthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalEarnings: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageEarning: { $avg: '$amount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        monthName: {
          $arrayElemAt: [
            ['', 'January', 'February', 'March', 'April', 'May', 'June', 
             'July', 'August', 'September', 'October', 'November', 'December'],
            '$_id.month'
          ]
        },
        totalEarnings: 1,
        transactionCount: 1,
        averageEarning: { $round: ['$averageEarning', 2] }
      }
    }
  ]);

  // Calculate total for the period
  const totalEarnings = monthlyEarnings.reduce((sum, month) => sum + month.totalEarnings, 0);
  const totalTransactions = monthlyEarnings.reduce((sum, month) => sum + month.transactionCount, 0);

  res.status(200).json({
    success: true,
    data: {
      period: `${months} months`,
      totalEarnings,
      totalTransactions,
      averageMonthlyEarning: totalEarnings / Math.max(monthlyEarnings.length, 1),
      monthlyBreakdown: monthlyEarnings
    }
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
    .sort({ _id: -1 })
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

  // Check if booking is in ASSIGNED state (or null for new assignments)
  if (booking.vendorStatus !== null && booking.vendorStatus !== 'ASSIGNED') {
    return res.status(400).json({
      success: false,
      message: `Cannot accept booking. Current status: ${booking.vendorStatus}`
    });
  }

  booking.vendorStatus = 'IN_PROGRESS';
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

  // Note: REJECTED is not a valid vendorStatus, so we'll set it to CANCELLED
  // or you might want to handle rejection differently
  booking.vendorStatus = 'CANCELLED';
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
    .sort({ _id: -1 })
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
  // If req.user already exists (from auth middleware), verify/update Clerk metadata
  if (req.user && req.user.role === 'vendor') {
    const vendor = req.user;
    
    // CRITICAL FIX: Always verify/update Clerk metadata
    const { getAuth } = await import('@clerk/express');
    const { createClerkClient } = await import('@clerk/clerk-sdk-node');
    const getClerkClient = () => createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY_USER
    });
    
    let clerkAuth = getAuth(req) || req.auth;
    let clerkPublicMetadata = {};
    
    if (clerkAuth?.userId) {
      try {
        const clerkClient = getClerkClient();
        let clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
        clerkPublicMetadata = clerkUser.publicMetadata || {};
        
        // Update if role is not 'vendor'
        if (clerkPublicMetadata?.role !== 'vendor') {
          let retries = 3;
          let success = false;
          
          while (retries > 0 && !success) {
            try {
              await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
                publicMetadata: { 
                  ...clerkPublicMetadata,
                  role: 'vendor' 
                }
              });
              
              const updatedUser = await clerkClient.users.getUser(clerkAuth.userId);
              if (updatedUser.publicMetadata?.role === 'vendor') {
                success = true;
                clerkPublicMetadata = updatedUser.publicMetadata;
                console.log(`✅ syncClerkVendor: Updated Clerk metadata role=vendor for existing vendor=${clerkAuth.userId}`);
              } else {
                throw new Error(`Metadata verification failed: expected vendor, got ${updatedUser.publicMetadata?.role || 'none'}`);
              }
            } catch (retryError) {
              retries--;
              if (retries === 0) throw retryError;
              await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
            }
          }
        }
      } catch (updateError) {
        console.error('❌ syncClerkVendor: Failed to update Clerk metadata:', {
          error: updateError.message,
          userId: clerkAuth?.userId,
          stack: updateError.stack
        });
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
          businessName: vendor.businessName,
          businessType: vendor.businessType,
          servicesOffered: vendor.servicesOffered,
          availability: vendor.availability,
          profileComplete: vendor.profileComplete,
          createdAt: vendor.createdAt,
          updatedAt: vendor.updatedAt,
        },
        clerkPublicMetadata: clerkPublicMetadata,
        roleSet: clerkPublicMetadata?.role || null
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
        
        console.log('✅ syncClerkVendor: Using token-based authentication');
      }
    } catch (tokenError) {
      // Token invalid, fall back to cookie-based auth
      console.log('⚠️ syncClerkVendor: Token decode failed, falling back to cookies');
    }
  }
  
  // Method 2: Fallback to cookie-based auth (getAuth from cookies)
  if (!clerkAuth) {
    clerkAuth = getAuth(req);
    
    // Fallback: Check if req.auth exists
    if (!clerkAuth?.userId && req.auth?.userId) {
      clerkAuth = req.auth;
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ syncClerkVendor: Using req.auth fallback');
      }
    }
  }
  
  // CRITICAL: Enhanced debugging for Clerk session extraction
  if (!clerkAuth?.userId) {
    console.error('❌ syncClerkVendor: CRITICAL - No Clerk session found!', {
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
    console.error('❌ syncClerkVendor: Cookie header check', {
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
  
  console.log('✅ syncClerkVendor: Clerk session found', {
    userId: clerkAuth.userId,
    sessionId: clerkAuth.sessionId,
    hasClaims: !!clerkAuth.claims,
    claimKeys: clerkAuth.claims ? Object.keys(clerkAuth.claims) : []
  });
  
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
  
  // CRITICAL: Update Clerk metadata FIRST before creating vendor
  // This ensures the role is persisted in Clerk for future requests
  const clerkSecretKey = process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY_USER;
  
  if (publicMetadata?.role !== 'vendor') {
    console.log('🔍 syncClerkVendor: Attempting to update Clerk metadata for vendor', {
      clerkUserId: clerkAuth.userId,
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
        console.log('🔍 syncClerkVendor: Fetched current Clerk metadata', {
          userId: clerkAuth.userId,
          currentRole: publicMetadata?.role,
          allMetadata: publicMetadata
        });
      } catch (fetchError) {
        console.error('❌ syncClerkVendor: Failed to fetch current Clerk user:', {
          error: fetchError.message,
          errorCode: fetchError.errors?.[0]?.code,
          errorStatus: fetchError.status,
          userId: clerkAuth.userId
        });
        publicMetadata = {};
      }
      
      // Update with retry logic and verification
      let retries = 3;
      let success = false;
      let lastError = null;
      
      while (retries > 0 && !success) {
        try {
          console.log(`🔍 syncClerkVendor: Metadata update attempt ${4 - retries}/3 for userId=${clerkAuth.userId}, role=vendor`);
          
          await clerkClient.users.updateUserMetadata(clerkAuth.userId, {
            publicMetadata: { 
              ...publicMetadata,
              role: 'vendor' 
            }
          });
          
          // CRITICAL: Wait a bit before verification (Clerk API might have eventual consistency)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify update was successful
          const updatedUser = await clerkClient.users.getUser(clerkAuth.userId);
          const updatedRole = updatedUser.publicMetadata?.role;
          
          console.log('🔍 syncClerkVendor: Verification check', {
            expected: 'vendor',
            actual: updatedRole,
            match: updatedRole === 'vendor',
            allMetadata: updatedUser.publicMetadata
          });
          
          if (updatedRole === 'vendor') {
            success = true;
            publicMetadata = updatedUser.publicMetadata;
            console.log(`✅ syncClerkVendor: Successfully set vendor role in Clerk publicMetadata for user:`, clerkAuth.userId);
            console.log('   Final publicMetadata:', JSON.stringify(publicMetadata, null, 2));
          } else {
            throw new Error(`Metadata verification failed: expected vendor, got ${updatedRole || 'none'}`);
          }
        } catch (retryError) {
          lastError = retryError;
          retries--;
          
          console.error(`❌ syncClerkVendor: Retry ${4 - retries} failed:`, {
            error: retryError.message,
            errorCode: retryError.errors?.[0]?.code,
            errorStatus: retryError.status,
            errorStatusCode: retryError.statusCode,
            userId: clerkAuth.userId,
            retriesLeft: retries
          });
          
          if (retries === 0) {
            throw retryError;
          }
          
          // Exponential backoff
          const delay = 1000 * (4 - retries);
          console.log(`⏳ syncClerkVendor: Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (!success) {
        throw lastError || new Error('Metadata update failed after all retries');
      }
    } catch (updateError) {
      // CRITICAL: Log the full error with all details
      console.error('❌ syncClerkVendor: CRITICAL FAILURE - Failed to update Clerk metadata after retries:', {
        error: updateError.message,
        errorCode: updateError.errors?.[0]?.code || 'N/A',
        errorStatus: updateError.status || 'N/A',
        errorStatusCode: updateError.statusCode || 'N/A',
        errorType: updateError.constructor?.name || 'Unknown',
        stack: updateError.stack,
        userId: clerkAuth.userId,
        clerkSecretKeyLength: clerkSecretKey?.length || 0,
        clerkSecretKeyPrefix: clerkSecretKey?.substring(0, 15) || 'NOT SET',
        nodeEnv: process.env.NODE_ENV
      });
      
      // CRITICAL: Return error response so frontend knows metadata update failed
      return res.status(500).json({
        success: false,
        message: 'Failed to update Clerk metadata. Please check backend logs.',
        error: updateError.message,
        code: 'CLERK_METADATA_UPDATE_FAILED',
        debug: {
          userId: clerkAuth.userId,
          errorCode: updateError.errors?.[0]?.code,
          errorStatus: updateError.status
        }
      });
    }
  } else {
    console.log(`✅ syncClerkVendor: Role already set correctly in Clerk metadata (vendor)`);
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

// ==================== LOCATION TRACKING ====================

/**
 * Update vendor's current location
 * @route PUT /api/vendors/location/update
 */
export const updateVendorLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, address } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const user = await User.findById(req.userId);
  
  if (!user || user.role !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can update location'
    });
  }

  // Get address from reverse geocoding if not provided
  let finalAddress = address;
  if (!finalAddress) {
    try {
      const { reverseGeocode } = await import('../services/googlePlacesService.js');
      const geocodeResult = await reverseGeocode(latitude, longitude);
      if (geocodeResult.success) {
        finalAddress = geocodeResult.address;
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }
  }

  // Initialize currentLocation if doesn't exist
  if (!user.currentLocation) {
    user.currentLocation = {
      latitude: null,
      longitude: null,
      address: '',
      lastUpdated: null,
      isTrackingEnabled: false
    };
  }

  // Update current location
  user.currentLocation = {
    latitude,
    longitude,
    address: finalAddress || user.currentLocation?.address || '',
    lastUpdated: new Date(),
    isTrackingEnabled: user.currentLocation?.isTrackingEnabled || false
  };

  // Add to location history (keep last 100 entries)
  if (!user.locationHistory) {
    user.locationHistory = [];
  }
  
  user.locationHistory.push({
    latitude,
    longitude,
    address: finalAddress || '',
    timestamp: new Date()
  });

  // Keep only last 100 location points
  if (user.locationHistory.length > 100) {
    user.locationHistory = user.locationHistory.slice(-100);
  }

  await user.save();

  // Emit socket event to notify admins of location update
  try {
    const { getIO } = await import('../socket/socketServer.js');
    const io = getIO();
    
    const locationData = {
      vendorId: user._id.toString(),
      vendorName: user.name,
      businessName: user.businessName,
      location: {
        latitude,
        longitude,
        address: finalAddress || user.currentLocation?.address || '',
        lastUpdated: user.currentLocation.lastUpdated,
        isTrackingEnabled: user.currentLocation.isTrackingEnabled
      }
    };
    
    // Emit to all admins (broadcast)
    io.to('admin').emit('vendor_location_update', locationData);
    
    // Also emit to specific vendor location room (for subscribed admins)
    io.to(`vendor_location:${user._id}`).emit('vendor_location_update', locationData);
    
    console.log(`📍 Location update emitted for vendor ${user._id}`);
  } catch (socketError) {
    console.error('Socket emit error (location still saved):', socketError);
    // Don't fail the request if socket fails
  }

  res.json({
    success: true,
    message: 'Location updated successfully',
    data: {
      location: user.currentLocation
    }
  });
});

/**
 * Get vendor's current location
 * @route GET /api/vendors/location/current
 */
export const getVendorLocation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  
  if (!user || user.role !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can access location'
    });
  }

  res.json({
    success: true,
    data: {
      location: user.currentLocation || null,
      isTrackingEnabled: user.currentLocation?.isTrackingEnabled || false
    }
  });
});

/**
 * Toggle location tracking on/off
 * @route PUT /api/vendors/location/tracking
 */
export const toggleLocationTracking = asyncHandler(async (req, res) => {
  const { enabled } = req.body;

  const user = await User.findById(req.userId);
  
  if (!user || user.role !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can toggle location tracking'
    });
  }

  if (!user.currentLocation) {
    user.currentLocation = {
      latitude: null,
      longitude: null,
      address: '',
      lastUpdated: null,
      isTrackingEnabled: enabled || false
    };
  } else {
    user.currentLocation.isTrackingEnabled = enabled || false;
  }

  await user.save();

  res.json({
    success: true,
    message: `Location tracking ${enabled ? 'enabled' : 'disabled'}`,
    data: {
      isTrackingEnabled: user.currentLocation.isTrackingEnabled
    }
  });
});