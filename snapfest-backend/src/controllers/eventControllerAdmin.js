import { Event } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ==================== ADMIN ROUTES ====================

export const getAllEventsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const { type, search, isActive, isFeatured } = req.query;

  let query = {};
  if (type) query.type = type;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

  const [items, total] = await Promise.all([
    Event.find(query).sort({ _id: -1 }).skip(skip).limit(limit),
    Event.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      events: items,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const getEventByIdAdmin = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { event }
  });
});

export const createEvent = asyncHandler(async (req, res) => {
  const { title, type, description, slug } = req.body;

  // Validate required fields
  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }

  // Validate type enum if provided
  const validTypes = ['WEDDING', 'BIRTHDAY', 'HALDI', 'CORPORATE', 'BABY_SHOWER', 'ANNIVERSARY', 'FESTIVAL', 'OTHER'];
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid event type. Must be one of: ${validTypes.join(', ')}`
    });
  }

  // Generate slug if not provided
  let eventSlug = slug;
  if (!eventSlug || !eventSlug.trim()) {
    eventSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    // Add timestamp to ensure uniqueness
    eventSlug = `${eventSlug}-${Date.now()}`;
  }

  // Check if slug already exists
  if (eventSlug) {
    const existingEvent = await Event.findOne({ slug: eventSlug });
    if (existingEvent) {
      // Regenerate slug with random string
      eventSlug = `${eventSlug}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  try {
    const event = await Event.create({
      ...req.body,
      title: title.trim(),
      slug: eventSlug,
      type: type || 'OTHER'
    });
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });
  } catch (error) {
    // Handle Mongoose/MongoDB duplicate key errors
    if (error.code === 11000 || error.name === 'MongoServerError') {
      const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'slug';
      return res.status(409).json({
        success: false,
        message: `An event with this ${field} already exists. Please use a different ${field === 'slug' ? 'title' : field}.`
      });
    }

    // Handle Azure Cosmos DB unique constraint violations
    if (error.message && error.message.includes('Unique index constraint violation')) {
      return res.status(409).json({
        success: false,
        message: 'An event with this information already exists. Please use different values.'
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
    console.error('❌ createEvent: Unexpected error:', {
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

export const updateEvent = asyncHandler(async (req, res) => {
  const { title, type, slug } = req.body;

  // Validate type enum if provided
  const validTypes = ['WEDDING', 'BIRTHDAY', 'HALDI', 'CORPORATE', 'BABY_SHOWER', 'ANNIVERSARY', 'FESTIVAL', 'OTHER'];
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid event type. Must be one of: ${validTypes.join(', ')}`
    });
  }

  // Check if slug is being updated and if it conflicts
  if (slug) {
    const existingEvent = await Event.findOne({ slug, _id: { $ne: req.params.id } });
    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message: 'An event with this slug already exists. Please use a different slug.'
      });
    }
  }

  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...(title && { title: title.trim() })
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
    });
  } catch (error) {
    // Handle Mongoose/MongoDB duplicate key errors
    if (error.code === 11000 || error.name === 'MongoServerError') {
      const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'slug';
      return res.status(409).json({
        success: false,
        message: `An event with this ${field} already exists. Please use a different ${field}.`
      });
    }

    // Handle Azure Cosmos DB unique constraint violations
    if (error.message && error.message.includes('Unique index constraint violation')) {
      return res.status(409).json({
        success: false,
        message: 'An event with this information already exists. Please use different values.'
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages}`
      });
    }

    console.error('❌ updateEvent: Unexpected error:', error.message);
    throw error;
  }
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
});

export const toggleEventStatus = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  event.isActive = !event.isActive;
  await event.save();

  res.status(200).json({
    success: true,
    message: `Event ${event.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { event }
  });
});

export const getEventStats = asyncHandler(async (req, res) => {
  const [
    totalEvents,
    activeEvents,
    inactiveEvents,
    featuredEvents,
    eventsByType
  ] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ isActive: true }),
    Event.countDocuments({ isActive: false }),
    Event.countDocuments({ isFeatured: true }),
    Event.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalEvents,
      activeEvents,
      inactiveEvents,
      featuredEvents,
      eventsByType
    }
  });
});

export const searchEventsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const query = {
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } }
    ]
  };

  const [items, total] = await Promise.all([
    Event.find(query).sort({ _id: -1 }).skip(skip).limit(limit),
    Event.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      events: items,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});


