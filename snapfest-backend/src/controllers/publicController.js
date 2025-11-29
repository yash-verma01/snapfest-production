import { asyncHandler } from '../middleware/errorHandler.js';
import { Package, Booking, Review, Event, Venue, BeatBloom, User } from '../models/index.js';

// ==================== PACKAGE ROUTES ====================
export const getAllPackages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const { category, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Build query
  let query = { isActive: { $ne: false } };
  if (category) query.category = category;
  if (minPrice || maxPrice) {
    // Filter by basePrice field as defined in the Package model
    query.basePrice = {};
    if (minPrice) query.basePrice.$gte = parseInt(minPrice);
    if (maxPrice) query.basePrice.$lte = parseInt(maxPrice);
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const packages = await Package.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Package.countDocuments(query);

  // Get package statistics
  const packagesWithStats = await Promise.all(
    packages.map(async (packageData) => {
      const bookingCount = await Booking.countDocuments({ packageId: packageData._id });
      const avgRating = await Review.aggregate([
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
            'booking.packageId': packageData._id
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' }
          }
        }
      ]);

      return {
        ...packageData.toObject(),
        bookingCount,
        averageRating: avgRating[0]?.averageRating || 0
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      packages: packagesWithStats,
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

  // Check if package is active (default to true if isActive field doesn't exist)
  if (packageData.isActive === false) {
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }

  // Get package statistics
  const bookingCount = await Booking.countDocuments({ packageId: packageData._id });
  const reviews = await Review.aggregate([
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
        'booking.packageId': packageData._id
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $project: {
        rating: 1,
        comment: 1,
        createdAt: 1,
        'user.name': 1
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: 10 }
  ]);

  const avgRating = await Review.aggregate([
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
        'booking.packageId': packageData._id
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
      package: packageData,
      stats: {
        bookingCount,
        averageRating: avgRating[0]?.averageRating || 0,
        totalReviews: avgRating[0]?.totalReviews || 0
      },
      reviews
    }
  });
});

export const getFeaturedPackages = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  
  console.log('🔍 Getting featured packages with limit:', limit);

  try {
    // Get all active packages with booking information
    const allPackages = await Package.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'packageId',
          as: 'bookings'
        }
      },
      {
        $match: {
          isActive: true
        }
      },
      {
        $addFields: {
          bookingCount: { $size: '$bookings' },
          hasBookings: { $gt: [{ $size: '$bookings' }, 0] }
        }
      },
      {
        $sort: [
          { hasBookings: -1 }, // Packages with bookings first
          { bookingCount: -1 }, // Then by booking count
          { createdAt: -1 } // Then by creation date
        ]
      },
      { $limit: limit }
    ]);

    console.log('📦 Featured packages found:', allPackages.length);
    
    // If we still don't have enough packages, get more without the booking filter
    if (allPackages.length < limit) {
      console.log('🔄 Not enough packages, getting additional active packages...');
      const additionalPackages = await Package.find({ 
        isActive: true,
        _id: { $nin: allPackages.map(pkg => pkg._id) }
      })
      .sort({ createdAt: -1 })
      .limit(limit - allPackages.length);
      
      console.log('📦 Additional packages found:', additionalPackages.length);
      allPackages.push(...additionalPackages);
    }

    console.log('✅ Final featured packages count:', allPackages.length);
    
    res.status(200).json({
      success: true,
      data: { packages: allPackages }
    });
  } catch (error) {
    console.error('❌ Error in getFeaturedPackages:', error);
    
    // Fallback: get any packages without complex queries
    try {
      const fallbackPackages = await Package.find({ isActive: true }).limit(limit);
      console.log('🔄 Fallback packages found:', fallbackPackages.length);
      
      res.status(200).json({
        success: true,
        data: { packages: fallbackPackages }
      });
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      res.status(500).json({
        success: false,
        message: 'Error fetching featured packages',
        error: error.message
      });
    }
  }
});

export const getPackagesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const packages = await Package.find({ 
    category, 
    isActive: true 
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Package.countDocuments({ category, isActive: true });

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

export const searchPackages = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // Build search query
  let query = { isActive: { $ne: false } };

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { features: { $in: [new RegExp(q, 'i')] } }
    ];
  }

  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseInt(minPrice);
    if (maxPrice) query.price.$lte = parseInt(maxPrice);
  }

  const packages = await Package.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

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

export const getPackageFilters = asyncHandler(async (req, res) => {
  // Get all categories
  const categories = await Package.distinct('category', { isActive: true });

  // Get price ranges
  const priceRanges = await Package.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      categories,
      priceRange: priceRanges[0] || { minPrice: 0, maxPrice: 0 }
    }
  });
});

export const getTrendingPackages = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  // Get packages with recent bookings (trending)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trendingPackages = await Package.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'packageId',
        as: 'recentBookings',
        pipeline: [
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo }
            }
          }
        ]
      }
    },
    {
      $match: {
        isActive: true,
        'recentBookings.0': { $exists: true }
      }
    },
    {
      $addFields: {
        recentBookingCount: { $size: '$recentBookings' }
      }
    },
    { $sort: { recentBookingCount: -1 } },
    { $limit: limit }
  ]);

  res.status(200).json({
    success: true,
    data: { packages: trendingPackages }
  });
});

export const getPopularPackages = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  // Get packages with highest average rating
  const popularPackages = await Package.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'packageId',
        as: 'bookings'
      }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: 'bookings._id',
        foreignField: 'bookingId',
        as: 'reviews'
      }
    },
    {
      $match: {
        isActive: true,
        'reviews.0': { $exists: true }
      }
    },
    {
      $addFields: {
        averageRating: { $avg: '$reviews.rating' },
        reviewCount: { $size: '$reviews' }
      }
    },
    { $sort: { averageRating: -1, reviewCount: -1 } },
    { $limit: limit }
  ]);

  res.status(200).json({
    success: true,
    data: { packages: popularPackages }
  });
});

// ==================== EVENT ROUTES ====================
export const getAllEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const { category, date, sortBy = 'eventDate', sortOrder = 'asc' } = req.query;

  // Build query
  let query = { isActive: { $ne: false } };
  if (category) query.category = category;
  if (date) {
    const eventDate = new Date(date);
    query.eventDate = {
      $gte: new Date(eventDate.setHours(0, 0, 0, 0)),
      $lt: new Date(eventDate.setHours(23, 59, 59, 999))
    };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const events = await Package.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Package.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      events,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const getEventById = asyncHandler(async (req, res) => {
  const event = await Package.findById(req.params.id);

  if (!event || !event.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  // Get event statistics
  const bookingCount = await Booking.countDocuments({ packageId: event._id });
  const avgRating = await Review.aggregate([
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
        'booking.packageId': event._id
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
      event,
      stats: {
        bookingCount,
        averageRating: avgRating[0]?.averageRating || 0,
        totalReviews: avgRating[0]?.totalReviews || 0
      }
    }
  });
});

export const getEventsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const events = await Package.find({ 
    category, 
    isActive: true 
  })
    .sort({ eventDate: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Package.countDocuments({ category, isActive: true });

  res.status(200).json({
    success: true,
    data: {
      events,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const searchEvents = asyncHandler(async (req, res) => {
  const { q, category, date } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // Build search query
  let query = { isActive: { $ne: false } };

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  if (category) query.category = category;
  if (date) {
    const eventDate = new Date(date);
    query.eventDate = {
      $gte: new Date(eventDate.setHours(0, 0, 0, 0)),
      $lt: new Date(eventDate.setHours(23, 59, 59, 999))
    };
  }

  const events = await Package.find(query)
    .sort({ eventDate: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Package.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      events,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const getRecentEvents = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const recentEvents = await Package.find({ 
    isActive: true,
    eventDate: { $gte: new Date() }
  })
    .sort({ eventDate: 1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    data: { events: recentEvents }
  });
});

// ==================== BEAT & BLOOM ROUTES ====================
export const getAllBeatBlooms = asyncHandler(async (req, res) => {
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

  const beatBlooms = await BeatBloom.find(query)
    .sort(sort)
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

export const getBeatBloomById = asyncHandler(async (req, res) => {
  const beatBloom = await BeatBloom.findById(req.params.id);

  if (!beatBloom || !beatBloom.isActive) {
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

export const getBeatBloomsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const beatBlooms = await BeatBloom.find({ 
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
      beatBlooms,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// ==================== SEARCH & DISCOVERY ====================
export const searchAll = asyncHandler(async (req, res) => {
  const { q, type } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const searchQuery = { $regex: q, $options: 'i' };
  const results = {
    packages: [],
    events: [],
    beatBlooms: []
  };

  // Search packages
  if (!type || type === 'packages') {
    const packages = await Package.find({
      isActive: true,
      $or: [
        { name: searchQuery },
        { description: searchQuery },
        { features: { $regex: q, $options: 'i' } }
      ]
    })
      .limit(limit)
      .sort({ createdAt: -1 });
    
    results.packages = packages;
  }

  // Search events (using Package model for events)
  if (!type || type === 'events') {
    const events = await Package.find({
      isActive: true,
      $or: [
        { name: searchQuery },
        { description: searchQuery }
      ]
    })
      .limit(limit)
      .sort({ eventDate: 1 });
    
    results.events = events;
  }

  // Search Beat & Bloom packages
  if (!type || type === 'beatbloom') {
    const beatBlooms = await BeatBloom.find({
      isActive: true,
      $or: [
        { title: searchQuery },
        { description: searchQuery }
      ]
    })
      .limit(limit)
      .sort({ createdAt: -1 });
    
    results.beatBlooms = beatBlooms;
  }

  const totalResults = results.packages.length + results.events.length + results.beatBlooms.length;

  res.status(200).json({
    success: true,
    data: {
      query: q,
      results,
      totalResults,
      pagination: {
        current: page,
        limit
      }
    }
  });
});

// ==================== TESTIMONIALS ====================

// @desc    Get approved testimonials for home page
// @route   GET /api/testimonials
// @access  Public
export const getApprovedTestimonials = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;

  const testimonials = await Review.find({
    type: 'TESTIMONIAL',
    isApproved: true
  })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      testimonials
    }
  });
});

// ==================== REVIEWS ====================

// @desc    Get all public reviews (for Reviews page)
// @route   GET /api/reviews
// @access  Public
export const getAllReviews = asyncHandler(async (req, res) => {
  const { limit = 100, page = 1 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Only get BOOKING_REVIEW type, not TESTIMONIAL (to avoid duplicates)
  // Testimonials are shown separately in the Testimonials section
  const reviews = await Review.find({ 
    type: 'BOOKING_REVIEW'  // Only show reviews, not testimonials
  })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ type: 'BOOKING_REVIEW' });

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    }
  });
});

// ==================== GALLERY ====================

// @desc    Get all gallery images from packages, events, and venues
// @route   GET /api/gallery
// @access  Public
export const getAllGalleryImages = asyncHandler(async (req, res) => {
  const { category, limit = 200 } = req.query; // category: 'events', 'venues', 'packages', or 'all'
  
  const images = [];
  
  // Get Events images
  if (!category || category === 'all' || category === 'events') {
    const events = await Event.find({ isActive: { $ne: false } })
      .select('title type location images image')
      .limit(100);
    
    events.forEach(event => {
      // Add primary image
      if (event.image) {
        images.push({
          id: `event-${event._id}-primary`,
          url: event.image,
          title: event.title,
          category: 'events',
          type: event.type,
          location: event.location?.name || event.location?.city || '',
          entityId: event._id,
          entityType: 'event'
        });
      }
      // Add gallery images
      if (event.images && event.images.length > 0) {
        event.images.forEach((imageUrl, index) => {
          images.push({
            id: `event-${event._id}-${index}`,
            url: imageUrl,
            title: event.title,
            category: 'events',
            type: event.type,
            location: event.location?.name || event.location?.city || '',
            entityId: event._id,
            entityType: 'event'
          });
        });
      }
    });
  }
  
  // Get Venues images
  if (!category || category === 'all' || category === 'venues') {
    const { Venue } = await import('../models/index.js');
    const venues = await Venue.find({ isActive: { $ne: false } })
      .select('name location images primaryImage type address')
      .limit(100);
    
    venues.forEach(venue => {
      // Add primary image
      if (venue.primaryImage) {
        images.push({
          id: `venue-${venue._id}-primary`,
          url: venue.primaryImage,
          title: venue.name,
          category: 'venues',
          type: venue.type || 'VENUE',
          location: venue.location || venue.address?.city || '',
          entityId: venue._id,
          entityType: 'venue'
        });
      }
      // Add gallery images
      if (venue.images && venue.images.length > 0) {
        venue.images.forEach((imageUrl, index) => {
          images.push({
            id: `venue-${venue._id}-${index}`,
            url: imageUrl,
            title: venue.name,
            category: 'venues',
            type: venue.type || 'VENUE',
            location: venue.location || venue.address?.city || '',
            entityId: venue._id,
            entityType: 'venue'
          });
        });
      }
    });
  }
  
  // Get Packages images
  if (!category || category === 'all' || category === 'packages') {
    const { Package } = await import('../models/index.js');
    const packages = await Package.find({ isActive: { $ne: false } })
      .select('title category images primaryImage')
      .limit(100);
    
    packages.forEach(pkg => {
      // Add primary image
      if (pkg.primaryImage) {
        images.push({
          id: `package-${pkg._id}-primary`,
          url: pkg.primaryImage,
          title: pkg.title,
          category: 'packages',
          type: pkg.category,
          location: '',
          entityId: pkg._id,
          entityType: 'package'
        });
      }
      // Add gallery images
      if (pkg.images && pkg.images.length > 0) {
        pkg.images.forEach((imageUrl, index) => {
          images.push({
            id: `package-${pkg._id}-${index}`,
            url: imageUrl,
            title: pkg.title,
            category: 'packages',
            type: pkg.category,
            location: '',
            entityId: pkg._id,
            entityType: 'package'
          });
        });
      }
    });
  }
  
  // Shuffle and limit
  const shuffled = images.sort(() => 0.5 - Math.random());
  const limited = shuffled.slice(0, parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: {
      images: limited,
      total: images.length,
      categories: {
        events: images.filter(img => img.category === 'events').length,
        venues: images.filter(img => img.category === 'venues').length,
        packages: images.filter(img => img.category === 'packages').length
      }
    }
  });
});
