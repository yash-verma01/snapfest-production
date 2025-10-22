import { Booking, Package, User, AuditLog } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
export const getUserBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = { userId: req.userId };

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by date range
  if (req.query.startDate && req.query.endDate) {
    query.eventDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  const bookings = await Booking.find(query)
    .populate('userId', 'name email phone')
    .populate('packageId', 'title category basePrice')
    .populate('assignedVendorId', 'name email phone')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

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

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('packageId', 'title category basePrice description')
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
  const { packageId, eventDate, location, guests, customization } = req.body;

  console.log('📅 Booking Controller: Creating booking');
  console.log('📅 Booking Controller: Package ID:', packageId);
  console.log('📅 Booking Controller: User ID:', req.userId);
  console.log('📅 Booking Controller: Event Date:', eventDate);
  console.log('📅 Booking Controller: Location:', location);
  console.log('📅 Booking Controller: Guests:', guests);

  // Verify package exists
  const packageData = await Package.findById(packageId);
  console.log('📅 Booking Controller: Package data:', packageData);
  
  if (!packageData) {
    console.log('📅 Booking Controller: Package not found');
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }

  // Calculate total amount
  const baseAmount = packageData.basePrice + (packageData.perGuestPrice * guests);
  const totalAmount = baseAmount; // Add taxes, add-ons later
  const partialAmount = Math.round(totalAmount * 0.2); // 20% advance payment

  const booking = await Booking.create({
    userId: req.userId,
    packageId,
    eventDate: new Date(eventDate),
    location,
    guests,
    customization,
    totalAmount,
    partialAmount,
    status: 'PENDING_PARTIAL_PAYMENT'
  });

  // Populate the booking
  await booking.populate('packageId', 'title category basePrice');

  console.log('📅 Booking Controller: Booking created successfully:', booking._id);
  console.log('📅 Booking Controller: Booking status:', booking.status);
  console.log('📅 Booking Controller: Booking partial amount:', booking.partialAmount);

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: req.userId,
  //     action: 'CREATE',
  //     targetId: booking._id,
  //     description: `Booking created for package ${packageData.title}`
  //   });

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking }
  });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PENDING_PARTIAL_PAYMENT', 'PARTIALLY_PAID', 'ASSIGNED', 'FULLY_PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
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

  const oldStatus = booking.status;
  booking.status = status;
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
  booking.status = 'ASSIGNED';
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
  if (booking.status === 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel completed booking'
    });
  }

  if (booking.status === 'CANCELLED') {
    return res.status(400).json({
      success: false,
      message: 'Booking is already cancelled'
    });
  }

  // Update booking status
  booking.status = 'CANCELLED';
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
