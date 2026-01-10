import { Booking, Package, BeatBloom, User, AuditLog } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import notificationService from '../services/notificationService.js';

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
export const getUserBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  console.log('📅 Booking Controller: Getting bookings for user:', req.userId);

  let query = { userId: req.userId };

  // Filter by vendor status
  if (req.query.status) {
    query.vendorStatus = req.query.status;
  }

  // Filter by date range
  if (req.query.startDate && req.query.endDate) {
    query.eventDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  console.log('📅 Booking Controller: Query:', query);

  const bookings = await Booking.find(query)
    .populate('userId', 'name email phone')
    .populate('packageId', 'title category basePrice')
    .populate('beatBloomId', 'title category price')
    .populate('assignedVendorId', 'name email phone')
    .skip(skip)
    .limit(limit)
    .sort({ _id: -1 });

  const total = await Booking.countDocuments(query);

  console.log('📅 Booking Controller: Found bookings:', bookings.length);

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
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('packageId', 'title category basePrice description')
    .populate('beatBloomId', 'title category price description')
    .populate('assignedVendorId', 'name email phone');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check access permissions
  if (req.user.role === 'user' && booking.userId._id.toString() !== req.userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (req.user.role === 'vendor' && booking.assignedVendorId?._id.toString() !== req.userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.status(200).json({
    success: true,
    data: { booking }
  });
});

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = asyncHandler(async (req, res) => {
  const { packageId, beatBloomId, eventDate, location, customization, paymentPercentage } = req.body;

  console.log('📅 Booking Controller: Creating booking');
  console.log('📅 Booking Controller: Package ID:', packageId);
  console.log('📅 Booking Controller: BeatBloom ID:', beatBloomId);
  console.log('📅 Booking Controller: User ID:', req.userId);
  console.log('📅 Booking Controller: Event Date:', eventDate);
  console.log('📅 Booking Controller: Location:', location);
  console.log('📅 Booking Controller: Payment Percentage:', paymentPercentage);

  // Validate that either packageId or beatBloomId is provided
  if (!packageId && !beatBloomId) {
    return res.status(400).json({
      success: false,
      message: 'Either packageId or beatBloomId is required'
    });
  }

  if (packageId && beatBloomId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot provide both packageId and beatBloomId'
    });
  }

  let itemData;
  let totalAmount;
  let bookingType;
  let itemTitle;

  if (packageId) {
    // Handle package booking (existing functionality)
    bookingType = 'package';
    itemData = await Package.findById(packageId);
    console.log('📅 Booking Controller: Package data:', itemData);
    
    if (!itemData) {
      console.log('📅 Booking Controller: Package not found');
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    totalAmount = itemData.basePrice;
    itemTitle = itemData.title;
  } else {
    // Handle BeatBloom booking (new functionality)
    bookingType = 'beatbloom';
    itemData = await BeatBloom.findById(beatBloomId);
    console.log('📅 Booking Controller: BeatBloom data:', itemData);
    
    if (!itemData) {
      console.log('📅 Booking Controller: BeatBloom service not found');
      return res.status(404).json({
        success: false,
        message: 'BeatBloom service not found'
      });
    }
    totalAmount = itemData.price;
    itemTitle = itemData.title;
  }

  // Validate payment percentage (20-100%)
  const validPaymentPercentage = Math.max(20, Math.min(100, paymentPercentage || 20));
  const initialPayment = Math.round(totalAmount * (validPaymentPercentage / 100));
  const remainingAmount = totalAmount - initialPayment;

  // Prepare booking data
  const bookingData = {
    userId: req.userId,
    eventDate: new Date(eventDate),
    location,
    customization: customization || '',
    totalAmount,
    amountPaid: 0, // Will be updated when payment is made
    remainingAmount: remainingAmount,
    paymentPercentage: validPaymentPercentage,
    paymentPercentagePaid: 0,
    remainingPercentage: 100 - validPaymentPercentage,
    paymentStatus: 'PENDING_PAYMENT',
    vendorStatus: null // Will be set when vendor is assigned
  };

  // Add the appropriate ID based on booking type
  if (packageId) {
    bookingData.packageId = packageId;
  } else {
    bookingData.beatBloomId = beatBloomId;
  }

  const booking = await Booking.create(bookingData);

  // Populate based on booking type
  if (packageId) {
    await booking.populate('packageId', 'title category basePrice');
  } else {
    await booking.populate('beatBloomId', 'title category price');
  }

  console.log('📅 Booking Controller: Booking created successfully:', booking._id);
  console.log('📅 Booking Controller: Booking type:', bookingType);
  console.log('📅 Booking Controller: Booking vendor status:', booking.vendorStatus);
  console.log('📅 Booking Controller: Booking remaining amount:', booking.remainingAmount);

  // Get user details for notification
  const user = await User.findById(req.userId);

  // Notify admins about new booking
  try {
    await notificationService.notifyAdmins(
      'NEW_BOOKING',
      'New Booking Created',
      `New booking created by ${user?.name || user?.email || 'User'} for ${itemTitle}`,
      booking._id,
      'Booking',
      { bookingId: booking._id, userId: req.userId, totalAmount: booking.totalAmount, bookingType }
    );
  } catch (notifError) {
    console.error('Error sending notification:', notifError);
    // Don't fail the booking creation if notification fails
  }

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'CREATE',
  //     targetId: booking._id,
  //     description: `Booking created for ${bookingType}: ${itemTitle}`
  //   });

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking }
  });
});

// @desc    Update booking vendor status
// @route   PUT /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vendor status'
    });
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check permissions
  if (req.user.role === 'user' && booking.userId.toString() !== req.userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (req.user.role === 'vendor' && booking.assignedVendorId?.toString() !== req.userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const oldStatus = booking.vendorStatus;
  booking.vendorStatus = status;
  await booking.save();

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'UPDATE',
  //     targetId: booking._id,
  //     description: `Booking status changed from ${oldStatus} to ${status} by ${req.user.name}`
  //   });

  res.status(200).json({
    success: true,
    message: 'Booking status updated successfully',
    data: { booking }
  });
});

// @desc    Assign vendor to booking
// @route   PUT /api/bookings/:id/assign-vendor
// @access  Private/Admin
export const assignVendorToBooking = asyncHandler(async (req, res) => {
  const { vendorId } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Verify vendor exists
  const vendor = await User.findById(vendorId);
  if (!vendor || vendor.role !== 'vendor') {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }

  booking.assignedVendorId = vendorId;
  booking.vendorStatus = 'ASSIGNED';
  await booking.save();

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'ASSIGN',
  //     targetId: booking._id,
  //     description: `Booking assigned to vendor ${vendor.name}`
  //   });

  res.status(200).json({
    success: true,
    message: 'Vendor assigned successfully',
    data: { booking }
  });
});

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private
export const getBookingStats = asyncHandler(async (req, res) => {
  let query = {};

  // Users can only see their own stats
  if (req.user.role === 'user') {
    query.userId = req.userId;
  }

  // Vendors can see their assigned bookings stats
  if (req.user.role === 'vendor') {
    query.assignedVendorId = req.userId;
  }

  const totalBookings = await Booking.countDocuments(query);
  const bookingsByStatus = await Booking.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalRevenue = await Booking.aggregate([
    { $match: { ...query, status: 'COMPLETED' } },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalBookings,
      bookingsByStatus,
      totalRevenue: totalRevenue[0]?.total || 0
    }
  });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const booking = await Booking.findOne({ _id: id, userId });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking can be cancelled
  if (booking.vendorStatus === 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel completed booking'
    });
  }

  if (booking.vendorStatus === 'CANCELLED') {
    return res.status(400).json({
      success: false,
      message: 'Booking is already cancelled'
    });
  }

  // Update booking vendor status
  booking.vendorStatus = 'CANCELLED';
  await booking.save();

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'UPDATE',
  //     targetId: booking._id,
  //     description: 'Booking cancelled by user'
  //   });

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking }
  });
});
