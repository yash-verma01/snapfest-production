import { asyncHandler } from '../middleware/errorHandler.js';
import { User, Package, Booking, Payment, OTP, Review, Event, Venue, BeatBloom, AuditLog } from '../models/index.js';
import OTPService from '../services/otpService.js';

// ==================== DASHBOARD & ANALYTICS ====================
export const getDashboard = asyncHandler(async (req, res) => {
  // Get total counts
  const totalUsers = await User.countDocuments({ role: 'user' });
  // Vendors are now stored in User collection with role='vendor'
  const totalVendors = await User.countDocuments({ role: 'vendor' });
  const totalBookings = await Booking.countDocuments();
  const totalPackages = await Package.countDocuments();

  // Get recent activity
  const recentBookings = await Booking.find()
    .populate('userId', 'name email')
    .populate('vendorId', 'businessName')
    .populate('packageId', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentUsers = await User.find({ role: 'user' })
    .select('name email createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  // Vendors are now stored in User collection with role='vendor'
  const recentVendors = await User.find({ role: 'vendor' })
    .select('name email createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get pending approvals
  // Vendors are now stored in User collection with role='vendor'
  const pendingVendors = await User.countDocuments({ 
    role: 'vendor',
    availability: { $ne: 'AVAILABLE' } 
  });

  const pendingBookings = await Booking.countDocuments({ 
    status: 'PENDING_PARTIAL_PAYMENT' 
  });

  // Get revenue stats for current month
  const currentMonth = new Date();
  currentMonth.setDate(1);
  
  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        status: 'COMPLETED',
        createdAt: { $gte: currentMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalVendors,
        totalBookings,
        totalPackages,
        pendingVendors,
        pendingBookings
      },
      revenue: {
        monthly: monthlyRevenue[0]?.total || 0,
        transactions: monthlyRevenue[0]?.count || 0
      },
      recentActivity: {
        bookings: recentBookings,
        users: recentUsers,
        vendors: recentVendors
      }
    }
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
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

  // User analytics
  const userAnalytics = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  // Booking analytics
  const bookingAnalytics = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Revenue analytics
  const revenueAnalytics = await Payment.aggregate([
    {
      $match: {
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

  // Package popularity
  const packageAnalytics = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$packageId',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'packages',
        localField: '_id',
        foreignField: '_id',
        as: 'package'
      }
    },
    {
      $unwind: '$package'
    },
    {
      $project: {
        packageName: '$package.name',
        count: 1
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      startDate,
      endDate,
      userAnalytics,
      bookingAnalytics,
      revenueAnalytics,
      packageAnalytics
    }
  });
});

export const getSystemStats = asyncHandler(async (req, res) => {
  // System-wide statistics
  const totalUsers = await User.countDocuments({ role: 'user' });
  // CRITICAL: Vendors are stored in Vendor collection, not User collection
  const totalVendors = await User.countDocuments({ role: 'vendor' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  const totalBookings = await Booking.countDocuments();
  const totalPackages = await Package.countDocuments();
  const totalPayments = await Payment.countDocuments();
  const totalReviews = await Review.countDocuments();

  // Active users (logged in within last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeUsers = await User.countDocuments({
    lastLogin: { $gte: thirtyDaysAgo }
  });

  // Revenue statistics
  const totalRevenue = await Payment.aggregate([
    {
      $match: { status: 'COMPLETED' }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Average booking value
  const avgBookingValue = await Booking.aggregate([
    {
      $group: {
        _id: null,
        average: { $avg: '$totalAmount' }
      }
    }
  ]);

  // Vendor performance
  const vendorPerformance = await User.aggregate([
    { $match: { role: 'vendor' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalEarnings: { $sum: '$totalEarnings' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        vendors: totalVendors,
        admins: totalAdmins,
        active: activeUsers
      },
      bookings: {
        total: totalBookings,
        averageValue: avgBookingValue[0]?.average || 0
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        transactions: totalPayments
      },
      content: {
        packages: totalPackages,
        reviews: totalReviews
      },
      performance: {
        averageVendorRating: vendorPerformance[0]?.averageRating || 0,
        totalVendorEarnings: vendorPerformance[0]?.totalEarnings || 0
      }
    }
  });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { action, userId, startDate, endDate } = req.query;

  // Build query
  let query = {};
  if (action) query.action = action;
  if (userId) query.userId = userId;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(query)
    .populate('userId', 'name email role')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// ==================== USER MANAGEMENT ====================

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

export const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent admin from deleting themselves
  if (req.userId && user._id.toString() === req.userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

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

export const getUserStats = asyncHandler(async (req, res) => {
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

// ==================== VENDOR MANAGEMENT ====================
export const getAllVendors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const vendors = await User.find({ role: 'vendor' })
    .select('name email phone isActive profileImage lastLogin businessName businessType servicesOffered experience availability location')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments({ role: 'vendor' });

  res.status(200).json({
    success: true,
    data: {
      vendors,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' })
    .select('name email phone isActive profileImage lastLogin businessName businessType servicesOffered experience availability location bio portfolio pricing');

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { vendor }
  });
});

export const createVendor = asyncHandler(async (req, res) => {
  const { name, email, phone, password, businessName, businessType, experience, services, location } = req.body;

  // Check if vendor already exists
  const existingVendor = await User.findOne({
    role: 'vendor',
    $or: [{ email }, { phone }]
  });

  if (existingVendor) {
    return res.status(400).json({
      success: false,
      message: 'Vendor with this email or phone already exists'
    });
  }

  // Hash password (if provided - for legacy auth)
  let hashedPassword = null;
  if (password) {
    const bcrypt = await import('bcryptjs');
    hashedPassword = await bcrypt.hash(password, 10);
  }

  // Create vendor as User with role='vendor'
  const vendor = await User.create({
    name,
    email,
    phone,
    role: 'vendor',
    ...(hashedPassword && { password: hashedPassword }),
    businessName,
    businessType,
    experience,
    servicesOffered: services || [],
    location,
    isActive: true,
    availability: 'AVAILABLE',
    profileComplete: false,
    earningsSummary: {
      totalEarnings: 0,
      thisMonthEarnings: 0,
      totalBookings: 0
    }
  });

  res.status(201).json({
    success: true,
    message: 'Vendor created successfully',
    data: { vendor: vendor.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) }
  });
});

export const updateVendor = asyncHandler(async (req, res) => {
  const { name, phone, businessName, businessType, experience, services, location, isActive } = req.body;

  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  // Check if phone number is already taken by another vendor
  if (phone && phone !== vendor.phone) {
    const existingVendor = await User.findOne({ 
      role: 'vendor',
      phone, 
      _id: { $ne: req.params.id } 
    });
    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already taken'
      });
    }
  }

  // Update vendor
  if (name) vendor.name = name;
  if (phone) vendor.phone = phone;
  if (businessName) vendor.businessName = businessName;
  if (businessType) vendor.businessType = businessType;
  if (experience) vendor.experience = experience;
  if (services) vendor.servicesOffered = services;
  if (location) vendor.location = location;
  if (isActive !== undefined) vendor.isActive = isActive;

  await vendor.save();

  res.status(200).json({
    success: true,
    message: 'Vendor updated successfully',
    data: { vendor: vendor.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) }
  });
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Vendor deleted successfully'
  });
});

export const searchVendors = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const vendors = await User.find({
    role: 'vendor',
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { businessName: { $regex: q, $options: 'i' } },
      { businessType: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } }
    ]
  })
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments({
    role: 'vendor',
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { businessName: { $regex: q, $options: 'i' } },
      { businessType: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } }
    ]
  });

  res.status(200).json({
    success: true,
    data: {
      vendors,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const assignVendorToBooking = asyncHandler(async (req, res) => {
  const { vendorId } = req.body;
  const bookingId = req.params.id;

  // Find booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Find vendor - verify it's a vendor
  const vendor = await User.findOne({ _id: vendorId, role: 'vendor' });
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  // Update booking with assigned vendor
  booking.assignedVendorId = vendorId;
  booking.status = 'ASSIGNED';
  booking.assignedAt = new Date();
  booking.assignedBy = req.userId;

  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Vendor assigned to booking successfully',
    data: { booking }
  });
});

export const getAllPackages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { category, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Build query
  let query = {};
  if (category) query.category = category;
  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const packages = await Package.find(query)
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Package.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      packages,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const getPackageById = asyncHandler(async (req, res) => {
  const packageData = await Package.findById(req.params.id);

  if (!packageData) {
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }

  // Get package statistics
  const bookingCount = await Booking.countDocuments({ packageId: packageData._id });
  const totalRevenue = await Booking.aggregate([
    { $match: { packageId: packageData._id } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      package: packageData,
      stats: {
        bookingCount,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    }
  });
});

// ==================== MISSING ADMIN ENDPOINTS ====================

// Create new user (Admin only)
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'user', phone, address } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    address,
    isActive: true
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    }
  });
});

// Toggle user status (Admin only)
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    }
  });
});

// Toggle vendor status (Admin only)
export const toggleVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  // Toggle the vendor's isActive status directly (vendor IS a user, not a separate entity)
  const previousStatus = vendor.isActive;
  vendor.isActive = !vendor.isActive;
  await vendor.save();

  console.log(`Vendor toggle: ${vendor.email} - Previous: ${previousStatus}, New: ${vendor.isActive}`);

  res.status(200).json({
    success: true,
    message: `Vendor ${vendor.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      vendor: {
        id: vendor._id,
        businessName: vendor.businessName,
        email: vendor.email,
        isActive: vendor.isActive
      }
    }
  });
});

// Toggle package status (Admin only)
export const togglePackageStatus = asyncHandler(async (req, res) => {
  const packageData = await Package.findById(req.params.id);
  
  if (!packageData) {
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }

  packageData.isActive = !packageData.isActive;
  await packageData.save();

  res.status(200).json({
    success: true,
    message: `Package ${packageData.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      package: {
        id: packageData._id,
        title: packageData.title,
        category: packageData.category,
        isActive: packageData.isActive
      }
    }
  });
});

// Cancel booking (Admin only)
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.status === 'CANCELLED') {
    return res.status(400).json({
      success: false,
      message: 'Booking is already cancelled'
    });
  }

  booking.status = 'CANCELLED';
  booking.cancelledAt = new Date();
  booking.cancellationReason = req.body.reason || 'Cancelled by admin';
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: {
      booking: {
        id: booking._id,
        status: booking.status,
        cancelledAt: booking.cancelledAt,
        cancellationReason: booking.cancellationReason
      }
    }
  });
});

// Get system settings (Admin only)
export const getSettings = asyncHandler(async (req, res) => {
  // For now, return default settings. In a real app, these would come from a Settings model
  const settings = {
    siteName: 'SnapFest',
    siteDescription: 'Premium Event Management Platform',
    contactEmail: 'admin@snapfest.com',
    contactPhone: '+1-800-SNAP-FEST',
    maxBookingAdvanceDays: 365,
    minBookingAdvanceDays: 7,
    defaultCurrency: 'USD',
    taxRate: 0.08,
    platformFee: 0.05,
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: true,
    socialLogin: {
      google: true,
      facebook: false
    }
  };

  res.status(200).json({
    success: true,
    data: { settings }
  });
});

// Update system settings (Admin only)
export const updateSettings = asyncHandler(async (req, res) => {
  const {
    siteName,
    siteDescription,
    contactEmail,
    contactPhone,
    maxBookingAdvanceDays,
    minBookingAdvanceDays,
    defaultCurrency,
    taxRate,
    platformFee,
    maintenanceMode,
    registrationEnabled,
    emailNotifications,
    smsNotifications,
    socialLogin
  } = req.body;

  // In a real app, you would save these to a Settings model
  // For now, we'll just validate and return success
  const updatedSettings = {
    siteName: siteName || 'SnapFest',
    siteDescription: siteDescription || 'Premium Event Management Platform',
    contactEmail: contactEmail || 'admin@snapfest.com',
    contactPhone: contactPhone || '+1-800-SNAP-FEST',
    maxBookingAdvanceDays: maxBookingAdvanceDays || 365,
    minBookingAdvanceDays: minBookingAdvanceDays || 7,
    defaultCurrency: defaultCurrency || 'USD',
    taxRate: taxRate || 0.08,
    platformFee: platformFee || 0.05,
    maintenanceMode: maintenanceMode || false,
    registrationEnabled: registrationEnabled !== false,
    emailNotifications: emailNotifications !== false,
    smsNotifications: smsNotifications !== false,
    socialLogin: socialLogin || { google: true, facebook: false }
  };

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: { settings: updatedSettings }
  });
});

export const createPackage = asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    category, 
    basePrice, 
    images,
    primaryImage,
    includedFeatures, 
    highlights,
    tags,
    customizationOptions,
    rating,
    isPremium,
    isActive = true,
    metaDescription
  } = req.body;

  // Validate required fields
  if (!title || !description || !category || !basePrice) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, category, and basePrice are required'
    });
  }

  // Validate includedFeatures structure if provided
  if (includedFeatures && Array.isArray(includedFeatures)) {
    for (const feature of includedFeatures) {
      if (!feature.name) {
        return res.status(400).json({
          success: false,
          message: 'Each included feature must have a name'
        });
      }
    }
  }

  // Validate customizationOptions structure if provided
  if (customizationOptions && Array.isArray(customizationOptions)) {
    for (const option of customizationOptions) {
      if (!option.name || option.price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each customization option must have a name and price'
        });
      }
    }
  }

  // Validate rating if provided
  if (rating !== undefined && (rating < 0 || rating > 5)) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 0 and 5'
    });
  }

  const packageData = await Package.create({
    title,
    description,
    category,
    basePrice,
    images: images || [],
    primaryImage: primaryImage || '',
    includedFeatures: includedFeatures || [],
    highlights: highlights || [],
    tags: tags || [],
    customizationOptions: customizationOptions || [],
    rating: rating !== undefined ? rating : 0,
    isPremium: isPremium || false,
    isActive,
    metaDescription: metaDescription || ''
  });

  res.status(201).json({
    success: true,
    message: 'Package created successfully',
    data: { package: packageData }
  });
});

export const updatePackage = asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    category, 
    basePrice, 
    images,
    primaryImage,
    includedFeatures, 
    highlights,
    tags,
    customizationOptions,
    rating,
    isPremium,
    isActive,
    metaDescription
  } = req.body;

  const packageData = await Package.findById(req.params.id);

  if (!packageData) {
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }

  // Validate includedFeatures structure if provided
  if (includedFeatures && Array.isArray(includedFeatures)) {
    for (const feature of includedFeatures) {
      if (!feature.name) {
        return res.status(400).json({
          success: false,
          message: 'Each included feature must have a name'
        });
      }
    }
  }

  // Validate customizationOptions structure if provided
  if (customizationOptions && Array.isArray(customizationOptions)) {
    for (const option of customizationOptions) {
      if (!option.name || option.price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each customization option must have a name and price'
        });
      }
    }
  }

  // Validate rating if provided
  if (rating !== undefined && (rating < 0 || rating > 5)) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 0 and 5'
    });
  }

  // Update package fields
  if (title) packageData.title = title;
  if (description) packageData.description = description;
  if (category) packageData.category = category;
  if (basePrice !== undefined) packageData.basePrice = basePrice;
  if (images !== undefined) packageData.images = images;
  if (primaryImage !== undefined) packageData.primaryImage = primaryImage;
  if (includedFeatures !== undefined) packageData.includedFeatures = includedFeatures;
  if (highlights !== undefined) packageData.highlights = highlights;
  if (tags !== undefined) packageData.tags = tags;
  if (customizationOptions !== undefined) packageData.customizationOptions = customizationOptions;
  if (rating !== undefined) packageData.rating = rating;
  if (isPremium !== undefined) packageData.isPremium = isPremium;
  if (isActive !== undefined) packageData.isActive = isActive;
  if (metaDescription !== undefined) packageData.metaDescription = metaDescription;

  await packageData.save();

  res.status(200).json({
    success: true,
    message: 'Package updated successfully',
    data: { package: packageData }
  });
});

export const deletePackage = asyncHandler(async (req, res) => {
  const packageData = await Package.findById(req.params.id);

  if (!packageData) {
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }

  // Check if package has bookings
  const bookingCount = await Booking.countDocuments({ packageId: packageData._id });
  if (bookingCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete package with existing bookings'
    });
  }

  await Package.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Package deleted successfully'
  });
});

export const getPackageStats = asyncHandler(async (req, res) => {
  const totalPackages = await Package.countDocuments();
  const activePackages = await Package.countDocuments({ isActive: true });
  const packagesByCategory = await Package.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get most popular packages
  const popularPackages = await Booking.aggregate([
    {
      $group: {
        _id: '$packageId',
        bookingCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'packages',
        localField: '_id',
        foreignField: '_id',
        as: 'package'
      }
    },
    {
      $unwind: '$package'
    },
    {
      $project: {
        packageName: '$package.name',
        category: '$package.category',
        bookingCount: 1
      }
    },
    { $sort: { bookingCount: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalPackages,
      activePackages,
      inactivePackages: totalPackages - activePackages,
      packagesByCategory,
      popularPackages
    }
  });
});

// ==================== BOOKING MANAGEMENT ====================
export const getAllBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Build query
  let query = {};
  if (status) query.status = status;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const bookings = await Booking.find(query)
    .populate('userId', 'name email phone')
    .populate('assignedVendorId', 'businessName email phone')
    .populate('packageId', 'title category basePrice')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Booking.countDocuments(query);

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

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('userId', 'name email phone address')
    .populate('vendorId', 'businessName email phone address')
    .populate('packageId', 'title category basePrice features images');

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
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  booking.status = status;
  booking.updatedAt = new Date();
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking status updated successfully',
    data: {
      booking: {
        id: booking._id,
        status: booking.status,
        updatedAt: booking.updatedAt
      }
    }
  });
});

export const getBookingStats = asyncHandler(async (req, res) => {
  const totalBookings = await Booking.countDocuments();
  const pendingBookings = await Booking.countDocuments({ status: 'PENDING_PARTIAL_PAYMENT' });
  const confirmedBookings = await Booking.countDocuments({ status: 'IN_PROGRESS' });
  const completedBookings = await Booking.countDocuments({ status: 'COMPLETED' });
  const cancelledBookings = await Booking.countDocuments({ status: 'CANCELLED' });

  // Revenue stats
  const totalRevenue = await Booking.aggregate([
    { $match: { status: 'COMPLETED' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  // Monthly bookings
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const monthlyBookings = await Booking.countDocuments({
    createdAt: { $gte: currentMonth }
  });

  res.status(200).json({
    success: true,
    data: {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyBookings
    }
  });
});

// ==================== PAYMENT MANAGEMENT ====================
export const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, method } = req.query;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};
  if (status) filter.status = status;
  if (method) filter.method = method;

  const payments = await Payment.find(filter)
    .populate('bookingId', 'userId packageId eventDate location guests status')
    .populate('bookingId.userId', 'name email')
    .populate('bookingId.packageId', 'title category basePrice')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate('bookingId', 'userId packageId eventDate location guests status')
    .populate('bookingId.userId', 'name email')
    .populate('bookingId.packageId', 'title category basePrice');

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

export const verifyPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const payment = await Payment.findById(id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  // Update payment status
  payment.status = status;
  if (notes) payment.notes = notes;
  payment.verifiedAt = new Date();
  payment.verifiedBy = req.user.id;

  await payment.save();

  res.status(200).json({
    success: true,
    message: 'Payment verification updated',
    data: { payment }
  });
});

export const processRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  const payment = await Payment.findById(id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  // Create refund record
  const refund = {
    amount: amount || payment.amount,
    reason: reason || 'Admin refund',
    processedBy: req.user.id,
    processedAt: new Date()
  };

  payment.refunds = payment.refunds || [];
  payment.refunds.push(refund);
  payment.status = 'REFUNDED';

  await payment.save();

  res.status(200).json({
    success: true,
    message: 'Refund processed successfully',
    data: { payment, refund }
  });
});

export const getPaymentStats = asyncHandler(async (req, res) => {
  const totalPayments = await Payment.countDocuments();
  const successfulPayments = await Payment.countDocuments({ status: 'SUCCESS' });
  const pendingPayments = await Payment.countDocuments({ status: 'PENDING' });
  const failedPayments = await Payment.countDocuments({ status: 'FAILED' });
  const refundedPayments = await Payment.countDocuments({ status: 'REFUNDED' });

  // Get total revenue
  const revenueResult = await Payment.aggregate([
    { $match: { status: 'SUCCESS' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  // Get monthly revenue
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const monthlyRevenueResult = await Payment.aggregate([
    { 
      $match: { 
        status: 'SUCCESS',
        createdAt: { $gte: currentMonth }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;

  res.status(200).json({
    success: true,
    data: {
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalRevenue,
      monthlyRevenue,
      successRate: totalPayments > 0 ? (successfulPayments / totalPayments * 100).toFixed(2) : 0
    }
  });
});

// ==================== OTP MANAGEMENT ====================
export const getPendingOTPs = asyncHandler(async (req, res) => {
  const pendingOTPs = await OTP.find({ isUsed: false, expiresAt: { $gt: new Date() } })
    .populate('bookingId', 'userId packageId eventDate location guests status')
    .populate('bookingId.userId', 'name email')
    .populate('bookingId.packageId', 'title category')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { otps: pendingOTPs }
  });
});

export const generateOTP = asyncHandler(async (req, res) => {
  const { bookingId, type = 'FULL_PAYMENT' } = req.body;

  // Find booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking is ready for OTP generation
  const validStatuses = ['PARTIALLY_PAID', 'FULLY_PAID', 'ASSIGNED'];
  if (!validStatuses.includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: `Booking is not ready for OTP generation. Current status: ${booking.status}`
    });
  }

  // Check if OTP already exists and is valid
  const existingOTP = await OTP.findOne({
    bookingId,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (existingOTP) {
    return res.status(400).json({
      success: false,
      message: 'Valid OTP already exists for this booking',
      data: {
        otp: {
          code: existingOTP.code,
          expiresAt: existingOTP.expiresAt,
          bookingId
        }
      }
    });
  }

  // Generate OTP
  const otp = await OTPService.createOTP(bookingId, type);

  // Create audit log only if actorId is available - DISABLED
  // // DISABLED: if (req.userId) {
  //   //   // DISABLED: await AuditLog.create({
  //   //   //     actorId: req.userId,
  //   //   //     action: 'GENERATE_OTP',
  //   //   //     targetId: booking._id,
  //   //   //     description: `OTP generated for booking ${bookingId}. OTP: ${otp.code}`
  //   //   //   });
  //   // }

  res.status(200).json({
    success: true,
    message: 'OTP generated successfully',
    data: { 
      otp: {
        code: otp.code,
        expiresAt: otp.expiresAt,
        bookingId,
        type
      }
    }
  });
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const { bookingId, otpCode } = req.body;

  // Find booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Verify OTP
  const otpResult = await OTPService.verifyOTP(bookingId, otpCode);
  
  if (!otpResult.isValid) {
    return res.status(400).json({
      success: false,
      message: otpResult.message
    });
  }

  // Update booking status based on OTP type
  if (otpResult.otp.type === 'PARTIAL_PAYMENT') {
    booking.status = 'PARTIALLY_PAID';
  } else if (otpResult.otp.type === 'FULL_PAYMENT') {
    booking.status = 'FULLY_PAID';
  }

  booking.otpVerified = true;
  booking.otpVerifiedAt = new Date();
  await booking.save();

  // Create audit log only if actorId is available - DISABLED
  // // DISABLED: if (req.userId) {
  //   //   // DISABLED: await AuditLog.create({
  //   //   //     actorId: req.userId,
  //   //   //     action: 'VERIFY_OTP',
  //   //   //     targetId: booking._id,
  //   //   //     description: `OTP verified for booking ${bookingId}. Status updated to ${booking.status}`
  //   //   //   });
  //   // }

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    data: { 
      booking,
      otpType: otpResult.otp.type,
      newStatus: booking.status
    }
  });
});

// ==================== TESTIMONIAL MANAGEMENT ====================

// @desc    Get all testimonials
// @route   GET /api/admin/testimonials
// @access  Private (Admin only)
export const getAllTestimonials = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = 'all' } = req.query;
  const skip = (page - 1) * limit;

  // Build filter
  let filter = { type: 'TESTIMONIAL' };
  if (status === 'pending') {
    filter.isApproved = false;
  } else if (status === 'approved') {
    filter.isApproved = true;
  }

  const testimonials = await Review.find(filter)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      testimonials,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

// @desc    Approve testimonial
// @route   PUT /api/admin/testimonials/:id/approve
// @access  Private (Admin only)
export const approveTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('🔍 Approving testimonial:', id);
  console.log('🔍 req.userId:', req.userId);
  console.log('🔍 req.user:', req.user);

  const testimonial = await Review.findById(id);
  if (!testimonial) {
    return res.status(404).json({
      success: false,
      message: 'Testimonial not found'
    });
  }

  if (testimonial.type !== 'TESTIMONIAL') {
    return res.status(400).json({
      success: false,
      message: 'This is not a testimonial'
    });
  }

  testimonial.isApproved = true;
  await testimonial.save();

  // Create audit log only if actorId is available
  // DISABLED: if (req.userId) {
  //     // DISABLED: await AuditLog.create({
  //   //       actorId: req.userId,
  //   //       action: 'APPROVE',
  //   //       targetId: testimonial._id,
  //   //       description: 'Admin approved testimonial'
  //   //     });
  //   }

  res.status(200).json({
    success: true,
    message: 'Testimonial approved successfully',
    data: {
      testimonial: {
        id: testimonial._id,
        rating: testimonial.rating,
        feedback: testimonial.feedback,
        isApproved: testimonial.isApproved,
        userId: testimonial.userId,
        createdAt: testimonial.createdAt
      }
    }
  });
});

// @desc    Reject testimonial
// @route   PUT /api/admin/testimonials/:id/reject
// @access  Private (Admin only)
export const rejectTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const testimonial = await Review.findById(id);
  if (!testimonial) {
    return res.status(404).json({
      success: false,
      message: 'Testimonial not found'
    });
  }

  if (testimonial.type !== 'TESTIMONIAL') {
    return res.status(400).json({
      success: false,
      message: 'This is not a testimonial'
    });
  }

  // Delete the testimonial
  await Review.findByIdAndDelete(id);

  // Create audit log only if actorId is available
  // DISABLED: if (req.userId) {
  //     // DISABLED: await AuditLog.create({
  //   //       actorId: req.userId,
  //   //       action: 'REJECT',
  //   //       targetId: testimonial._id,
  //   //       description: 'Admin rejected testimonial'
  //   //     });
  //   }

  res.status(200).json({
    success: true,
    message: 'Testimonial rejected and deleted successfully'
  });
});

// @desc    Get testimonial stats
// @route   GET /api/admin/testimonials/stats
// @access  Private (Admin only)
export const getTestimonialStats = asyncHandler(async (req, res) => {
  const totalTestimonials = await Review.countDocuments({ type: 'TESTIMONIAL' });
  const pendingTestimonials = await Review.countDocuments({ 
    type: 'TESTIMONIAL', 
    isApproved: false 
  });
  const approvedTestimonials = await Review.countDocuments({ 
    type: 'TESTIMONIAL', 
    isApproved: true 
  });

  res.status(200).json({
    success: true,
    data: {
      total: totalTestimonials,
      pending: pendingTestimonials,
      approved: approvedTestimonials
    }
  });
});

// ==================== ADMIN EMAIL MANAGEMENT ====================

// @desc    Send welcome email to user
// @route   POST /api/admin/email/welcome
// @access  Private (Admin only)
export const sendWelcomeEmail = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  try {
    // Import admin email service
    const AdminEmailService = (await import('../services/adminEmailService.js')).default;
    
    // Send welcome email
    await AdminEmailService.sendWelcomeEmail(user.email, user.name);

    // Create audit log only if actorId is available
    // DISABLED: if (req.userId) {
  //       // DISABLED: await AuditLog.create({
  //   //         actorId: req.userId,
  //   //         action: 'SEND_EMAIL',
  //   //         targetId: user._id,
  //   //         description: `Admin sent welcome email to ${user.email}`
  //   //       });
  //     }

    res.status(200).json({
      success: true,
      message: 'Welcome email sent successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome email. Please try again.'
    });
  }
});

// @desc    Send account activation email
// @route   POST /api/admin/email/activate
// @access  Private (Admin only)
export const sendActivationEmail = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  try {
    // Import admin email service
    const AdminEmailService = (await import('../services/adminEmailService.js')).default;
    
    // Send activation email
    await AdminEmailService.sendAccountActivationEmail(user.email, user.name);

    // Create audit log only if actorId is available
    // DISABLED: if (req.userId) {
  //       // DISABLED: await AuditLog.create({
  //   //         actorId: req.userId,
  //   //         action: 'SEND_EMAIL',
  //   //         targetId: user._id,
  //   //         description: `Admin sent activation email to ${user.email}`
  //   //       });
  //     }

    res.status(200).json({
      success: true,
      message: 'Activation email sent successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Error sending activation email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send activation email. Please try again.'
    });
  }
});

// @desc    Send account deactivation email
// @route   POST /api/admin/email/deactivate
// @access  Private (Admin only)
export const sendDeactivationEmail = asyncHandler(async (req, res) => {
  const { userId, reason } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  try {
    // Import admin email service
    const AdminEmailService = (await import('../services/adminEmailService.js')).default;
    
    // Send deactivation email
    await AdminEmailService.sendAccountDeactivationEmail(user.email, user.name, reason);

    // Create audit log only if actorId is available
    // DISABLED: if (req.userId) {
  //       // DISABLED: await AuditLog.create({
  //   //         actorId: req.userId,
  //   //         action: 'SEND_EMAIL',
  //   //         targetId: user._id,
  //   //         description: `Admin sent deactivation email to ${user.email}`
  //   //       });
  //     }

    res.status(200).json({
      success: true,
      message: 'Deactivation email sent successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Error sending deactivation email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send deactivation email. Please try again.'
    });
  }
});

// @desc    Send custom email to user
// @route   POST /api/admin/email/custom
// @access  Private (Admin only)
export const sendCustomEmail = asyncHandler(async (req, res) => {
  const { userId, subject, message, adminName } = req.body;

  if (!userId || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'User ID, subject, and message are required'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  try {
    // Import admin email service
    const AdminEmailService = (await import('../services/adminEmailService.js')).default;
    
    // Send custom email
    await AdminEmailService.sendCustomEmail(
      user.email, 
      user.name, 
      subject, 
      message, 
      adminName || 'SnapFest Admin'
    );

    // Create audit log only if actorId is available
    // DISABLED: if (req.userId) {
  //       // DISABLED: await AuditLog.create({
  //   //         actorId: req.userId,
  //   //         action: 'SEND_EMAIL',
  //   //         targetId: user._id,
  //   //         description: `Admin sent custom email to ${user.email}: ${subject}`
  //   //       });
  //     }

    res.status(200).json({
      success: true,
      message: 'Custom email sent successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        email: {
          subject,
          message
        }
      }
    });
  } catch (error) {
    console.error('Error sending custom email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send custom email. Please try again.'
    });
  }
});

// @desc    Send bulk email to multiple users
// @route   POST /api/admin/email/bulk
// @access  Private (Admin only)
export const sendBulkEmail = asyncHandler(async (req, res) => {
  const { userIds, subject, message, adminName } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User IDs array is required'
    });
  }

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Subject and message are required'
    });
  }

  try {
    // Get users data
    const users = await User.find({ _id: { $in: userIds } });
    const userEmails = users.map(user => ({ email: user.email, name: user.name }));

    // Import admin email service
    const AdminEmailService = (await import('../services/adminEmailService.js')).default;
    
    // Send bulk email
    const results = await AdminEmailService.sendBulkEmail(
      userEmails, 
      subject, 
      message, 
      adminName || 'SnapFest Admin'
    );

    // Create audit log only if actorId is available
    // DISABLED: if (req.userId) {
  //       // DISABLED: await AuditLog.create({
  //   //         actorId: req.userId,
  //   //         action: 'SEND_BULK_EMAIL',
  //   //         targetId: null,
  //   //         description: `Admin sent bulk email to ${userIds.length} users: ${subject}`
  //   //       });
  //     }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Bulk email sent successfully. ${successCount} successful, ${failureCount} failed.`,
      data: {
        total: userIds.length,
        successful: successCount,
        failed: failureCount,
        results
      }
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk email. Please try again.'
    });
  }
});

// ==================== BEAT & BLOOM MANAGEMENT ====================

// Get all Beat & Bloom services with pagination
export const getAllBeatBloomsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.category) {
    query.category = req.query.category;
  }
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  const beatBlooms = await BeatBloom.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await BeatBloom.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      beatBlooms,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// Get Beat & Bloom service by ID
export const getBeatBloomByIdAdmin = asyncHandler(async (req, res) => {
  const beatBloom = await BeatBloom.findById(req.params.id);
  
  if (!beatBloom) {
    return res.status(404).json({
      success: false,
      message: 'Beat & Bloom service not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { beatBloom }
  });
});

// Create new Beat & Bloom service
export const createBeatBloom = asyncHandler(async (req, res) => {
  const beatBloom = await BeatBloom.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Beat & Bloom service created successfully',
    data: { beatBloom }
  });
});

// Update Beat & Bloom service
export const updateBeatBloom = asyncHandler(async (req, res) => {
  const beatBloom = await BeatBloom.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!beatBloom) {
    return res.status(404).json({
      success: false,
      message: 'Beat & Bloom service not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Beat & Bloom service updated successfully',
    data: { beatBloom }
  });
});

// Delete Beat & Bloom service
export const deleteBeatBloom = asyncHandler(async (req, res) => {
  const beatBloom = await BeatBloom.findByIdAndDelete(req.params.id);

  if (!beatBloom) {
    return res.status(404).json({
      success: false,
      message: 'Beat & Bloom service not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Beat & Bloom service deleted successfully'
  });
});

// Toggle Beat & Bloom service status
export const toggleBeatBloomStatus = asyncHandler(async (req, res) => {
  const beatBloom = await BeatBloom.findById(req.params.id);

  if (!beatBloom) {
    return res.status(404).json({
      success: false,
      message: 'Beat & Bloom service not found'
    });
  }

  beatBloom.isActive = !beatBloom.isActive;
  await beatBloom.save();

  res.status(200).json({
    success: true,
    message: `Beat & Bloom service ${beatBloom.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { beatBloom }
  });
});

// Get Beat & Bloom statistics
export const getBeatBloomStats = asyncHandler(async (req, res) => {
  const total = await BeatBloom.countDocuments();
  const active = await BeatBloom.countDocuments({ isActive: true });
  const inactive = await BeatBloom.countDocuments({ isActive: false });

  const categoryStats = await BeatBloom.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      active,
      inactive,
      categoryStats
    }
  });
});

// Search Beat & Bloom services
export const searchBeatBlooms = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } }
    ]
  };

  const beatBlooms = await BeatBloom.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await BeatBloom.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      beatBlooms,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});


// ==================== ADMIN PROFILE MANAGEMENT ====================

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
export const getAdminProfile = asyncHandler(async (req, res) => {
  const adminId = req.userId;

  const admin = await User.findById(adminId).select("-password");
  
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin not found"
    });
  }

  res.status(200).json({
    success: true,
    message: "Admin profile retrieved successfully",
    data: admin
  });
});

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/Admin
export const updateAdminProfile = asyncHandler(async (req, res) => {
  const adminId = req.userId;
  const { name, phone, address } = req.body;

  const admin = await User.findById(adminId);
  
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin not found"
    });
  }

  // Update fields
  if (name) admin.name = name;
  if (phone) admin.phone = phone;
  if (address) admin.address = address;

  await admin.save();

  res.status(200).json({
    success: true,
    message: "Admin profile updated successfully",
    data: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      address: admin.address,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin
    }
  });
});
