import { Venue, AuditLog } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getAllVenues = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const { search, minCapacity, maxPricePerDay } = req.query;

  const query = { isActive: { $ne: false } };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }
  if (minCapacity) {
    query.capacity = { ...(query.capacity || {}), $gte: parseInt(minCapacity) };
  }
  if (maxPricePerDay) {
    query.pricePerDay = { ...(query.pricePerDay || {}), $lte: parseInt(maxPricePerDay) };
  }

  const [items, total] = await Promise.all([
    Venue.find(query).sort({ _id: -1 }).skip(skip).limit(limit),
    Venue.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const getVenueById = asyncHandler(async (req, res) => {
  const item = await Venue.findById(req.params.id);
  if (!item || item.isActive === false) {
    return res.status(404).json({ success: false, message: 'Venue not found' });
  }
  res.status(200).json({ success: true, data: { item } });
});

// ==================== ADMIN ROUTES ====================

// Get all venues (Admin)
export const getAllVenuesAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Build query
  let query = {};
  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const venues = await Venue.find(query)
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Venue.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      venues,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// Get venue by ID (Admin)
export const getVenueByIdAdmin = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);

  if (!venue) {
    return res.status(404).json({
      success: false,
      message: 'Venue not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { venue }
  });
});

// Create venue (Admin)
export const createVenue = asyncHandler(async (req, res) => {
  const {
    name,
    location,
    capacity,
    pricePerDay,
    amenities,
    images,
    primaryImage,
    rating,
    isAvailable,
    isPremium,
    description,
    services,
    type,
    address,
    isActive = true
  } = req.body;

  const venue = await Venue.create({
    name,
    location,
    capacity,
    pricePerDay,
    amenities,
    images: images || [],
    primaryImage: primaryImage || '',
    rating: rating || 0,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    isPremium: isPremium !== undefined ? isPremium : false,
    description: description || '',
    services: services || [],
    type: type || 'OTHER',
    address: address || {
      street: '',
      city: '',
      state: '',
      pincode: '',
      fullAddress: ''
    },
    isActive,
    createdBy: req.userId
  });

  // Create audit log - DISABLED
  // // DISABLED: await AuditLog.create({
  //   //   actorId: req.userId,
  //   //   action: 'CREATE_VENUE',
  //   //   targetId: venue._id,
  //   //   description: `Created venue: ${name}`
  //   // });

  res.status(201).json({
    success: true,
    message: 'Venue created successfully',
    data: { venue }
  });
});

// Update venue (Admin)
export const updateVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);

  if (!venue) {
    return res.status(404).json({
      success: false,
      message: 'Venue not found'
    });
  }

  const {
    name,
    location,
    capacity,
    pricePerDay,
    amenities,
    images,
    primaryImage,
    rating,
    isAvailable,
    isPremium,
    description,
    services,
    type,
    address,
    isActive
  } = req.body;

  // Update fields
  if (name !== undefined) venue.name = name;
  if (location !== undefined) venue.location = location;
  if (capacity !== undefined) venue.capacity = capacity;
  if (pricePerDay !== undefined) venue.pricePerDay = pricePerDay;
  if (amenities !== undefined) venue.amenities = amenities;
  if (images !== undefined) venue.images = images;
  if (primaryImage !== undefined) venue.primaryImage = primaryImage;
  if (rating !== undefined) venue.rating = rating;
  if (isAvailable !== undefined) venue.isAvailable = isAvailable;
  if (isPremium !== undefined) venue.isPremium = isPremium;
  if (description !== undefined) venue.description = description;
  if (services !== undefined) venue.services = services;
  if (type !== undefined) venue.type = type;
  if (address !== undefined) venue.address = address;
  if (isActive !== undefined) venue.isActive = isActive;

  venue.updatedAt = new Date();
  await venue.save();

  // Create audit log - DISABLED
  // // DISABLED: await AuditLog.create({
  //   //   actorId: req.userId,
  //   //   action: 'UPDATE_VENUE',
  //   //   targetId: venue._id,
  //   //   description: `Updated venue: ${venue.name}`
  //   // });

  res.status(200).json({
    success: true,
    message: 'Venue updated successfully',
    data: { venue }
  });
});

// Delete venue (Admin)
export const deleteVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);

  if (!venue) {
    return res.status(404).json({
      success: false,
      message: 'Venue not found'
    });
  }

  await Venue.findByIdAndDelete(req.params.id);

  // Create audit log - DISABLED
  // // DISABLED: await AuditLog.create({
  //   //   actorId: req.userId,
  //   //   action: 'DELETE_VENUE',
  //   //   targetId: req.params.id,
  //   //   description: `Deleted venue: ${venue.name}`
  //   // });

  res.status(200).json({
    success: true,
    message: 'Venue deleted successfully'
  });
});

// Toggle venue status (Admin)
export const toggleVenueStatus = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);

  if (!venue) {
    return res.status(404).json({
      success: false,
      message: 'Venue not found'
    });
  }

  venue.isActive = !venue.isActive;
  venue.updatedAt = new Date();
  await venue.save();

  // Create audit log - DISABLED
  // // DISABLED: await AuditLog.create({
  //   //   actorId: req.userId,
  //   //   action: 'TOGGLE_VENUE_STATUS',
  //   //   targetId: venue._id,
  //   //   description: `${venue.isActive ? 'Activated' : 'Deactivated'} venue: ${venue.name}`
  //   // });

  res.status(200).json({
    success: true,
    message: `Venue ${venue.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      venue: {
        id: venue._id,
        name: venue.name,
        location: venue.location,
        isActive: venue.isActive
      }
    }
  });
});

// Get venue statistics (Admin)
export const getVenueStats = asyncHandler(async (req, res) => {
  const totalVenues = await Venue.countDocuments();
  const activeVenues = await Venue.countDocuments({ isActive: true });
  const inactiveVenues = await Venue.countDocuments({ isActive: false });

  // Capacity statistics
  const capacityStats = await Venue.aggregate([
    {
      $group: {
        _id: null,
        averageCapacity: { $avg: '$capacity' },
        minCapacity: { $min: '$capacity' },
        maxCapacity: { $max: '$capacity' }
      }
    }
  ]);

  // Price statistics
  const priceStats = await Venue.aggregate([
    {
      $group: {
        _id: null,
        averagePrice: { $avg: '$pricePerDay' },
        minPrice: { $min: '$pricePerDay' },
        maxPrice: { $max: '$pricePerDay' }
      }
    }
  ]);

  // Rating statistics
  const ratingStats = await Venue.aggregate([
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        minRating: { $min: '$rating' },
        maxRating: { $max: '$rating' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalVenues,
      activeVenues,
      inactiveVenues,
      capacityStats: capacityStats[0] || { averageCapacity: 0, minCapacity: 0, maxCapacity: 0 },
      priceStats: priceStats[0] || { averagePrice: 0, minPrice: 0, maxPrice: 0 },
      ratingStats: ratingStats[0] || { averageRating: 0, minRating: 0, maxRating: 0 }
    }
  });
});

// Search venues (Admin)
export const searchVenues = asyncHandler(async (req, res) => {
  const { q, location, minCapacity, maxCapacity, minPrice, maxPrice } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  // Build search query
  let query = {
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
      { amenities: { $regex: q, $options: 'i' } }
    ]
  };

  if (location) query.location = { $regex: location, $options: 'i' };
  if (minCapacity || maxCapacity) {
    query.capacity = {};
    if (minCapacity) query.capacity.$gte = parseInt(minCapacity);
    if (maxCapacity) query.capacity.$lte = parseInt(maxCapacity);
  }
  if (minPrice || maxPrice) {
    query.pricePerDay = {};
    if (minPrice) query.pricePerDay.$gte = parseInt(minPrice);
    if (maxPrice) query.pricePerDay.$lte = parseInt(maxPrice);
  }

  const venues = await Venue.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ _id: -1 });

  const total = await Venue.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      venues,
      query: q,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});




