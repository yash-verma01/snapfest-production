import { Event } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { transformImageUrls } from '../utils/urlTransformer.js';

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

  // Transform image URLs to blob storage URLs
  const transformedItems = transformImageUrls(items, ['image', 'images']);

  res.status(200).json({
    success: true,
    data: {
      events: transformedItems,
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

  // Transform image URLs to blob storage URLs
  const transformedEvent = transformImageUrls(event.toObject(), ['image', 'images']);

  res.status(200).json({
    success: true,
    data: { event: transformedEvent }
  });
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create(req.body);
  
  // Transform image URLs in response
  const transformedEvent = transformImageUrls(event.toObject(), ['image', 'images']);
  
  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: { event: transformedEvent }
  });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  // Transform image URLs in response
  const transformedEvent = transformImageUrls(event.toObject(), ['image', 'images']);

  res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: { event: transformedEvent }
  });
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

  // Transform image URLs in response
  const transformedEvent = transformImageUrls(event.toObject(), ['image', 'images']);

  res.status(200).json({
    success: true,
    message: `Event ${event.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { event: transformedEvent }
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


