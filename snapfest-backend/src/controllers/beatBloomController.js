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

  // Build sort object - map createdAt to _id for Cosmos DB compatibility
  const sort = {};
  const actualSortBy = sortBy === 'createdAt' ? '_id' : sortBy;
  sort[actualSortBy] = sortOrder === 'desc' ? -1 : 1;

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
    .sort({ _id: -1 })
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

  // Build sort object - map createdAt to _id for Cosmos DB compatibility
  const sort = {};
  const actualSortBy = sortBy === 'createdAt' ? '_id' : sortBy;
  sort[actualSortBy] = sortOrder === 'desc' ? -1 : 1;

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
    primaryImage,
    rating,
    isActive = true
  } = req.body;

  // Validate required fields
  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }

  if (!price || price < 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid price is required'
    });
  }

  // Validate category enum
  const validCategories = ['ENTERTAINMENT', 'DECOR', 'PHOTOGRAPHY', 'CATERING', 'LIGHTING', 'OTHER'];
  if (category && !validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
    });
  }

  // Generate unique slug from title
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
  
  // Add timestamp and random string to ensure uniqueness
  slug = `${slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Check if slug already exists (unlikely but possible) and regenerate if needed
  let existingBeatBloom = await BeatBloom.findOne({ slug });
  let retryCount = 0;
  while (existingBeatBloom && retryCount < 5) {
    // Regenerate slug if collision occurs
    slug = `${slug}-${Math.random().toString(36).substr(2, 9)}`;
    existingBeatBloom = await BeatBloom.findOne({ slug });
    retryCount++;
  }

  try {
    const beatBloom = await BeatBloom.create({
      title: title.trim(),
      slug,
      category: category || 'OTHER',
      description: description || '',
      price,
      features: features || [],
      images: images || [],
      primaryImage: primaryImage || '',
      rating: rating !== undefined ? Math.max(0, Math.min(5, rating)) : 0,
      isActive,
      createdBy: req.userId
    });

    res.status(201).json({
      success: true,
      message: 'Beat & Bloom package created successfully',
      data: { beatBloom }
    });
  } catch (error) {
    // Handle Mongoose/MongoDB duplicate key errors (slug uniqueness)
    if (error.code === 11000 || error.name === 'MongoServerError') {
      const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'slug';
      return res.status(409).json({
        success: false,
        message: `A Beat & Bloom package with this ${field} already exists. Please try again with a different title.`
      });
    }

    // Handle Azure Cosmos DB unique constraint violations
    if (error.message && error.message.includes('Unique index constraint violation')) {
      return res.status(409).json({
        success: false,
        message: 'A Beat & Bloom package with this title already exists. Please use a different title.'
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages}`,
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    // Log unexpected errors
    console.error('❌ createBeatBloom: Unexpected error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern
    });

    // Re-throw for asyncHandler to catch
    throw error;
  }
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
    primaryImage,
    rating,
    isActive
  } = req.body;

  // Update fields
  if (title !== undefined) beatBloom.title = title;
  if (category !== undefined) beatBloom.category = category;
  if (description !== undefined) beatBloom.description = description;
  if (price !== undefined) beatBloom.price = price;
  if (features !== undefined) beatBloom.features = features;
  if (images !== undefined) beatBloom.images = images;
  if (primaryImage !== undefined) beatBloom.primaryImage = primaryImage;
  if (rating !== undefined) beatBloom.rating = rating;
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
    .sort({ _id: -1 });

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




