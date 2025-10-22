import { Package, AuditLog } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all packages
// @route   GET /api/packages
// @access  Public
export const getAllPackages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};
  
  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by price range
  if (req.query.minPrice || req.query.maxPrice) {
    query.basePrice = {};
    if (req.query.minPrice) query.basePrice.$gte = parseInt(req.query.minPrice);
    if (req.query.maxPrice) query.basePrice.$lte = parseInt(req.query.maxPrice);
  }

  // Filter by rating
  if (req.query.minRating) {
    query.rating = { $gte: parseInt(req.query.minRating) };
  }

  // Search by title or description
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Sort options
  let sort = { createdAt: -1 };
  if (req.query.sortBy === 'price_asc') sort = { basePrice: 1 };
  if (req.query.sortBy === 'price_desc') sort = { basePrice: -1 };
  if (req.query.sortBy === 'rating') sort = { rating: -1 };
  if (req.query.sortBy === 'popularity') sort = { bookingCount: -1 };

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

// @desc    Get package by ID
// @route   GET /api/packages/:id
// @access  Public
export const getPackageById = asyncHandler(async (req, res) => {
  const packageData = await Package.findById(req.params.id);

  if (!packageData) {
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { package: packageData }
  });
});

// @desc    Create new package
// @route   POST /api/packages
// @access  Private/Admin
export const createPackage = asyncHandler(async (req, res) => {
  const packageData = await Package.create(req.body);

  // Create audit log - DISABLED
  // // DISABLED: await AuditLog.create({
  //   //   actorId: req.userId,
  //   //   action: 'CREATE',
  //   //   targetId: packageData._id,
  //   //   description: `Package ${packageData.title} created by ${req.user.name}`
  //   // });

  res.status(201).json({
    success: true,
    message: 'Package created successfully',
    data: { package: packageData }
  });
});

// @desc    Update package by ID
// @route   PUT /api/packages/:id
// @access  Private/Admin
export const updatePackageById = asyncHandler(async (req, res) => {
  const packageData = await Package.findById(req.params.id);

  if (!packageData) {
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }

  // Update package
  Object.keys(req.body).forEach(key => {
    packageData[key] = req.body[key];
  });

  await packageData.save();

  // Create audit log - DISABLED
  // // DISABLED: await AuditLog.create({
  //   //   actorId: req.userId,
  //   //   action: 'UPDATE',
  //   //   targetId: packageData._id,
  //   //   description: `Package ${packageData.title} updated by ${req.user.name}`
  //   // });

  res.status(200).json({
    success: true,
    message: 'Package updated successfully',
    data: { package: packageData }
  });
});

// @desc    Delete package by ID
// @route   DELETE /api/packages/:id
// @access  Private/Admin
export const deletePackageById = asyncHandler(async (req, res) => {
  const packageData = await Package.findById(req.params.id);

  if (!packageData) {
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }

  await Package.findByIdAndDelete(req.params.id);

  // Create audit log - DISABLED
  // // DISABLED: await AuditLog.create({
  //   //   actorId: req.userId,
  //   //   action: 'DELETE',
  //   //   targetId: packageData._id,
  //   //   description: `Package ${packageData.title} deleted by ${req.user.name}`
  //   // });

  res.status(200).json({
    success: true,
    message: 'Package deleted successfully'
  });
});

// @desc    Get featured packages
// @route   GET /api/packages/featured
// @access  Public
export const getFeaturedPackages = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const packages = await Package.find({ isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    data: { packages }
  });
});

// @desc    Get packages by category
// @route   GET /api/packages/category/:category
// @access  Public
export const getPackagesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const packages = await Package.find({ category })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Package.countDocuments({ category });

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

// @desc    Get package statistics
// @route   GET /api/packages/stats
// @access  Private/Admin
export const getPackageStats = asyncHandler(async (req, res) => {
  const totalPackages = await Package.countDocuments();
  const packagesByCategory = await Package.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  const featuredPackages = await Package.countDocuments({ isFeatured: true });
  const averageRating = await Package.aggregate([
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalPackages,
      packagesByCategory,
      featuredPackages,
      averageRating: averageRating[0]?.avgRating || 0
    }
  });
});
