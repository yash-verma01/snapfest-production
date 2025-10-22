import { BeatBloom, AuditLog } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ==================== PUBLIC ROUTES ====================

export const getAllBeatBloom = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const { category, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Build query
  let query = { isActive: { $ne: false } };
  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseInt(minPrice);
    if (maxPrice) query.price.$lte = parseInt(maxPrice);
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const [items, total] = await Promise.all([
    BeatBloom.find(query).sort(sort).skip(skip).limit(limit),
    BeatBloom.countDocuments(query)
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

export const getBeatBloomById = asyncHandler(async (req, res) => {
  const item = await BeatBloom.findById(req.params.id);
  if (!item || item.isActive === false) {
    return res.status(404).json({ success: false, message: 'Beat & Bloom item not found' });
  }
  res.status(200).json({ success: true, data: { item } });
});

export const getBeatBloomsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const items = await BeatBloom.find({ 
    category, 
    isActive: true 
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await BeatBloom.countDocuments({ category, isActive: true });

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

// ==================== ADMIN ROUTES ====================

// Get all Beat & Bloom packages (Admin)
export const getAllBeatBloomsAdmin = asyncHandler(async (req, res) => {
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

  const beatBlooms = await BeatBloom.find(query)
    .skip(skip)
    .limit(limit)
    .sort(sort);

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

// Get Beat & Bloom package by ID (Admin)
export const getBeatBloomByIdAdmin = asyncHandler(async (req, res) => {
  const beatBloom = await BeatBloom.findById(req.params.id);

  if (!beatBloom) {
    return res.status(404).json({
      success: false,
      message: 'Beat & Bloom package not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { beatBloom }
  });
});

// Create Beat & Bloom package (Admin)
export const createBeatBloom = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    description,
    price,
    features,
    images,
    isActive = true
  } = req.body;

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-') // Remove leading/trailing hyphens
    + `-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Add timestamp and random string

  const beatBloom = await BeatBloom.create({
    title,
    slug,
    category,
    description,
    price,
    features,
    images,
    isActive,
    createdBy: req.userId
  });

  // Create audit log only if actorId is available
  // Temporarily disabled for debugging
  // // DISABLED: if (req.userId) {
  //   //   // DISABLED: await AuditLog.create({
  //   //   //     actorId: req.userId,
  //   //   //     action: 'CREATE_BEATBLOOM',
  //   //   //     targetId: beatBloom._id,
  //   //   //     description: `Created Beat & Bloom package: ${title}`
  //   //   //   });
  //   // }

  res.status(201).json({
    success: true,
    message: 'Beat & Bloom package created successfully',
    data: { beatBloom }
  });
});

// Update Beat & Bloom package (Admin)
export const updateBeatBloom = asyncHandler(async (req, res) => {
  const beatBloom = await BeatBloom.findById(req.params.id);

  if (!beatBloom) {
    return res.status(404).json({
      success: false,
      message: 'Beat & Bloom package not found'
    });
  }

  const {
    title,
    category,
    description,
    price,
    features,
    images,
    isActive
  } = req.body;

  // Update fields
  if (title !== undefined) beatBloom.title = title;
  if (category !== undefined) beatBloom.category = category;
  if (description !== undefined) beatBloom.description = description;
  if (price !== undefined) beatBloom.price = price;
  if (features !== undefined) beatBloom.features = features;
  if (images !== undefined) beatBloom.images = images;
  if (isActive !== undefined) beatBloom.isActive = isActive;

  beatBloom.updatedAt = new Date();
  await beatBloom.save();

  // Create audit log only if actorId is available - DISABLED
  // // DISABLED: if (req.userId) {
  //   //   // DISABLED: await AuditLog.create({
  //   //   //     actorId: req.userId,
  //   //   //     action: 'UPDATE_BEATBLOOM',
  //   //   //     targetId: beatBloom._id,
  //   //   //     description: `Updated Beat & Bloom package: ${beatBloom.title}`
  //   //   //   });
  //   // }

  res.status(200).json({
    success: true,
    message: 'Beat & Bloom package updated successfully',
    data: { beatBloom }
  });
});

// Delete Beat & Bloom package (Admin)
export const deleteBeatBloom = asyncHandler(async (req, res) => {
  const beatBloom = await BeatBloom.findById(req.params.id);

  if (!beatBloom) {
    return res.status(404).json({
      success: false,
      message: 'Beat & Bloom package not found'
    });
  }

  await BeatBloom.findByIdAndDelete(req.params.id);

  // Create audit log only if actorId is available - DISABLED
  // // DISABLED: if (req.userId) {
  //   //   // DISABLED: await AuditLog.create({
  //   //   //     actorId: req.userId,
  //   //   //     action: 'DELETE_BEATBLOOM',
  //   //   //     targetId: req.params.id,
  //   //   //     description: `Deleted Beat & Bloom package: ${beatBloom.title}`
  //   //   //   });
  //   // }

  res.status(200).json({
    success: true,
    message: 'Beat & Bloom package deleted successfully'
  });
});

// Toggle Beat & Bloom package status (Admin)
export const toggleBeatBloomStatus = asyncHandler(async (req, res) => {
  const beatBloom = await BeatBloom.findById(req.params.id);

  if (!beatBloom) {
    return res.status(404).json({
      success: false,
      message: 'Beat & Bloom package not found'
    });
  }

  beatBloom.isActive = !beatBloom.isActive;
  beatBloom.updatedAt = new Date();
  await beatBloom.save();

  // Create audit log only if actorId is available - DISABLED
  // // DISABLED: if (req.userId) {
  //   //   // DISABLED: await AuditLog.create({
  //   //   //     actorId: req.userId,
  //   //   //     action: 'TOGGLE_BEATBLOOM_STATUS',
  //   //   //     targetId: beatBloom._id,
  //   //   //     description: `${beatBloom.isActive ? 'Activated' : 'Deactivated'} Beat & Bloom package: ${beatBloom.title}`
  //   //   //   });
  //   // }

  res.status(200).json({
    success: true,
    message: `Beat & Bloom package ${beatBloom.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      beatBloom: {
        id: beatBloom._id,
        title: beatBloom.title,
        category: beatBloom.category,
        isActive: beatBloom.isActive
      }
    }
  });
});

// Get Beat & Bloom statistics (Admin)
export const getBeatBloomStats = asyncHandler(async (req, res) => {
  const totalBeatBlooms = await BeatBloom.countDocuments();
  const activeBeatBlooms = await BeatBloom.countDocuments({ isActive: true });
  const inactiveBeatBlooms = await BeatBloom.countDocuments({ isActive: false });

  // Category breakdown
  const categoryStats = await BeatBloom.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Price statistics
  const priceStats = await BeatBloom.aggregate([
    {
      $group: {
        _id: null,
        averagePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalBeatBlooms,
      activeBeatBlooms,
      inactiveBeatBlooms,
      categoryStats,
      priceStats: priceStats[0] || { averagePrice: 0, minPrice: 0, maxPrice: 0 }
    }
  });
});

// Search Beat & Bloom packages (Admin)
export const searchBeatBlooms = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;
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
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { features: { $regex: q, $options: 'i' } }
    ]
  };

  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseInt(minPrice);
    if (maxPrice) query.price.$lte = parseInt(maxPrice);
  }

  const beatBlooms = await BeatBloom.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await BeatBloom.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      beatBlooms,
      query: q,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});




