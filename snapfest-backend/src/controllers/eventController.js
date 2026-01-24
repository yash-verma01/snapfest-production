import { Event } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { transformImageUrls } from '../utils/urlTransformer.js';

export const getAllEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const { type, search } = req.query;

  const query = { isActive: { $ne: false } };
  if (type) query.type = type;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Event.find(query).sort({ _id: -1 }).skip(skip).limit(limit),
    Event.countDocuments(query)
  ]);

  // Transform image URLs to blob storage URLs
  const transformedItems = transformImageUrls(items, ['image', 'images']);

  res.status(200).json({
    success: true,
    data: {
      items: transformedItems,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const getEventById = asyncHandler(async (req, res) => {
  const item = await Event.findById(req.params.id);
  if (!item || item.isActive === false) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  
  // Transform image URLs to blob storage URLs
  const transformedItem = transformImageUrls(item.toObject(), ['image', 'images']);
  
  res.status(200).json({ success: true, data: { item: transformedItem } });
});

export const getRecentEvents = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const items = await Event.find({ isActive: { $ne: false } })
    .sort({ _id: -1 })
    .limit(limit);
  
  // Transform image URLs to blob storage URLs
  const transformedItems = transformImageUrls(items, ['image', 'images']);
  
  res.status(200).json({
    success: true,
    data: { items: transformedItems }
  });
});

export const getEventsByCategory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const { category } = req.params;

  const query = { 
    isActive: { $ne: false },
    type: category 
  };

  const [items, total] = await Promise.all([
    Event.find(query).sort({ _id: -1 }).skip(skip).limit(limit),
    Event.countDocuments(query)
  ]);

  // Transform image URLs to blob storage URLs
  const transformedItems = transformImageUrls(items, ['image', 'images']);

  res.status(200).json({
    success: true,
    data: {
      items: transformedItems,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

export const searchEvents = asyncHandler(async (req, res) => {
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
    isActive: { $ne: false },
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

  // Transform image URLs to blob storage URLs
  const transformedItems = transformImageUrls(items, ['image', 'images']);

  res.status(200).json({
    success: true,
    data: {
      items: transformedItems,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});
