import { asyncHandler } from '../middleware/errorHandler.js';
import { User, Package, BeatBloom } from '../models/index.js';
import { deleteImage, processImage, generatePublicUrl } from '../middleware/upload.js';

// ==================== PROFILE IMAGE UPLOAD ====================

// @desc    Upload user profile image
// @route   POST /api/upload/profile
// @access  Private
export const uploadProfileImage = asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile image if exists
    if (user.profileImage) {
      await deleteImage(user.profileImage);
    }

    // Generate public URL for the uploaded image
    const publicUrl = generatePublicUrl(req.file.path, 'profiles', req);
    
    // Update user profile image
    user.profileImage = publicUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: user.profileImage,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading profile image',
      error: error.message
    });
  }
});

// ==================== PACKAGE IMAGES UPLOAD ====================

// @desc    Upload package images
// @route   POST /api/upload/package/:packageId
// @access  Private/Admin
export const uploadPackageImages = asyncHandler(async (req, res) => {
  const { packageId } = req.params;
  const userId = req.userId;
  
  // Check if this is a primary image upload (from query param or body)
  // FormData sends strings, so check for both string 'true' and boolean true
  const isPrimary = req.query.isPrimary === 'true' || req.body.isPrimary === 'true' || req.body.isPrimary === true;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image files provided'
    });
  }

  try {
    // Get package to verify it exists
    const packageDoc = await Package.findById(packageId);
    if (!packageDoc) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Generate public URLs for uploaded images
    const imageUrls = req.files.map(file => generatePublicUrl(file.path, 'packages', req));
    
    if (isPrimary) {
      // Primary image: set primaryImage field directly (only first image if multiple)
      const primaryImageUrl = imageUrls[0];
      await Package.findByIdAndUpdate(
        packageId,
        { $set: { primaryImage: primaryImageUrl } },
        { new: false }
      );
      
      // Get updated package
      const updatedPackage = await Package.findById(packageId);
      
      res.status(200).json({
        success: true,
        message: 'Primary image uploaded successfully',
        data: {
          packageId: updatedPackage._id,
          primaryImage: updatedPackage.primaryImage,
          newImages: [primaryImageUrl]
        }
      });
    } else {
      // Gallery images: add to images array using atomic $push (prevents race conditions)
      await Package.findByIdAndUpdate(
        packageId,
        { $push: { images: { $each: imageUrls } } },
        { new: false }
      );
      
      // Get updated package
      const updatedPackage = await Package.findById(packageId);
      
      res.status(200).json({
        success: true,
        message: 'Package images uploaded successfully',
        data: {
          packageId: updatedPackage._id,
          images: updatedPackage.images,
          newImages: imageUrls
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading package images',
      error: error.message
    });
  }
});

// ==================== ADDON IMAGES UPLOAD ====================

// @desc    Upload addon images
// @route   POST /api/upload/addon/:addonId
// @access  Private/Vendor
export const uploadAddonImages = asyncHandler(async (req, res) => {
  const { addonId } = req.params;
  const userId = req.userId;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image files provided'
    });
  }

  try {
    // Get Beat & Bloom package
    const beatBloom = await BeatBloom.findById(addonId);
    if (!beatBloom) {
      return res.status(404).json({
        success: false,
        message: 'Beat & Bloom package not found'
      });
    }

    // Check if user owns this Beat & Bloom package
    if (beatBloom.vendorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only upload images for your own Beat & Bloom packages'
      });
    }

    // Generate public URLs for uploaded images
    const imageUrls = req.files.map(file => generatePublicUrl(file.path, 'beatbloom', req));
    
    // Add new images to existing ones
    beatBloom.images = [...beatBloom.images, ...imageUrls];
    await beatBloom.save();

    res.status(200).json({
      success: true,
      message: 'Beat & Bloom images uploaded successfully',
      data: {
        addonId: beatBloom._id,
        images: beatBloom.images,
        newImages: imageUrls
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading Beat & Bloom images',
      error: error.message
    });
  }
});

// ==================== EVENT IMAGES UPLOAD ====================

// @desc    Upload event images
// @route   POST /api/upload/event/:eventId
// @access  Private/Admin
export const uploadEventImages = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.userId;
  
  // Check if this is a primary image upload (from query param or body)
  // FormData sends strings, so check for both string 'true' and boolean true
  const isPrimary = req.query.isPrimary === 'true' || req.body.isPrimary === 'true' || req.body.isPrimary === true;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image files provided'
    });
  }

  try {
    // Import Event model
    const { Event } = await import('../models/index.js');
    
    // Get event to verify it exists
    const eventDoc = await Event.findById(eventId);
    if (!eventDoc) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Generate public URLs for uploaded images
    const imageUrls = req.files.map(file => generatePublicUrl(file.path, 'events', req));
    
    if (isPrimary) {
      // Primary image: set image field directly (only first image if multiple)
      const primaryImageUrl = imageUrls[0];
      await Event.findByIdAndUpdate(
        eventId,
        { $set: { image: primaryImageUrl } },
        { new: false }
      );
      
      // Get updated event
      const updatedEvent = await Event.findById(eventId);
      
      res.status(200).json({
        success: true,
        message: 'Primary image uploaded successfully',
        data: {
          eventId: updatedEvent._id,
          image: updatedEvent.image,
          newImages: [primaryImageUrl]
        }
      });
    } else {
      // Gallery images: add to images array using atomic $push (prevents race conditions)
      await Event.findByIdAndUpdate(
        eventId,
        { $push: { images: { $each: imageUrls } } },
        { new: false }
      );
      
      // Get updated event
      const updatedEvent = await Event.findById(eventId);
      
      res.status(200).json({
        success: true,
        message: 'Event images uploaded successfully',
        data: {
          eventId: updatedEvent._id,
          images: updatedEvent.images,
          newImages: imageUrls
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading event images',
      error: error.message
    });
  }
});

// ==================== VENUE IMAGES UPLOAD ====================

// @desc    Upload venue images
// @route   POST /api/upload/venue/:venueId
// @access  Private/Admin
export const uploadVenueImages = asyncHandler(async (req, res) => {
  const { venueId } = req.params;
  const userId = req.userId;
  
  // Check if this is a primary image upload (from query param or body)
  // FormData sends strings, so check for both string 'true' and boolean true
  const isPrimary = req.query.isPrimary === 'true' || req.body.isPrimary === 'true' || req.body.isPrimary === true;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image files provided'
    });
  }

  try {
    // Import Venue model
    const { Venue } = await import('../models/index.js');
    
    // Get venue to verify it exists
    const venueDoc = await Venue.findById(venueId);
    if (!venueDoc) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    // Generate public URLs for uploaded images
    const imageUrls = req.files.map(file => generatePublicUrl(file.path, 'venues', req));
    
    if (isPrimary) {
      // Primary image: set primaryImage field directly (only first image if multiple)
      const primaryImageUrl = imageUrls[0];
      await Venue.findByIdAndUpdate(
        venueId,
        { $set: { primaryImage: primaryImageUrl } },
        { new: false }
      );
      
      // Get updated venue
      const updatedVenue = await Venue.findById(venueId);
      
      res.status(200).json({
        success: true,
        message: 'Primary image uploaded successfully',
        data: {
          venueId: updatedVenue._id,
          primaryImage: updatedVenue.primaryImage,
          newImages: [primaryImageUrl]
        }
      });
    } else {
      // Gallery images: add to images array using atomic $push (prevents race conditions)
      await Venue.findByIdAndUpdate(
        venueId,
        { $push: { images: { $each: imageUrls } } },
        { new: false }
      );
      
      // Get updated venue
      const updatedVenue = await Venue.findById(venueId);
      
      res.status(200).json({
        success: true,
        message: 'Venue images uploaded successfully',
        data: {
          venueId: updatedVenue._id,
          images: updatedVenue.images,
          newImages: imageUrls
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading venue images',
      error: error.message
    });
  }
});

// ==================== DELETE IMAGE ====================

// @desc    Delete image
// @route   DELETE /api/upload/image
// @access  Private
export const deleteUserImage = asyncHandler(async (req, res) => {
  const { imageUrl, type, id } = req.body;
  const userId = req.userId;

  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Image URL is required'
    });
  }

  try {
    let document;
    
    // Find the document based on type
    switch (type) {
      case 'profile':
        document = await User.findById(userId);
        if (document && document.profileImage === imageUrl) {
          document.profileImage = null;
          await document.save();
        }
        break;
        
      case 'package':
        document = await Package.findById(id);
        if (document) {
          // Check if it's the primary image
          if (document.primaryImage === imageUrl) {
            document.primaryImage = '';
          }
          // Remove from gallery images
          document.images = document.images.filter(img => img !== imageUrl);
          await document.save();
        }
        break;
        
      case 'beatbloom':
        document = await BeatBloom.findById(id);
        if (document) {
          // Check if it's the primary image
          if (document.primaryImage === imageUrl) {
            document.primaryImage = '';
          }
          // Remove from gallery images
          document.images = document.images.filter(img => img !== imageUrl);
          await document.save();
        }
        break;
        
      case 'event':
        const { Event } = await import('../models/index.js');
        document = await Event.findById(id);
        if (document) {
          // Check if it's the primary image
          if (document.image === imageUrl) {
            document.image = '';
          }
          // Remove from gallery images
          document.images = document.images.filter(img => img !== imageUrl);
          await document.save();
        }
        break;
        
      case 'venue':
        const { Venue } = await import('../models/index.js');
        document = await Venue.findById(id);
        if (document) {
          // Check if it's the primary image
          if (document.primaryImage === imageUrl) {
            document.primaryImage = '';
          }
          // Remove from gallery images
          document.images = document.images.filter(img => img !== imageUrl);
          await document.save();
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid image type'
        });
    }

    // Delete image from storage
    const deleted = await deleteImage(imageUrl);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        deleted,
        imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

// ==================== GET IMAGE INFO ====================

// @desc    Get image information
// @route   GET /api/upload/image-info
// @access  Private
export const getImageInfo = asyncHandler(async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Image URL is required'
    });
  }

  try {
    // Extract image information
    const imageInfo = {
      url: imageUrl,
      filename: imageUrl.split('/').pop(),
      size: 'Unknown', // You can get this from Cloudinary API
      format: imageUrl.split('.').pop(),
      uploadedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: imageInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting image information',
      error: error.message
    });
  }
});

// ==================== BEAT & BLOOM IMAGE UPLOAD ====================

// @desc    Upload Beat & Bloom images
// @route   POST /api/upload/beatbloom/:beatBloomId
// @access  Private/Admin
export const uploadBeatBloomImages = asyncHandler(async (req, res) => {
  const { beatBloomId } = req.params;
  const userId = req.userId;
  
  // Check if this is a primary image upload (from query param or body)
  // FormData sends strings, so check for both string 'true' and boolean true
  const isPrimary = req.query.isPrimary === 'true' || req.body.isPrimary === 'true' || req.body.isPrimary === true;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image files provided'
    });
  }

  try {
    // Get Beat & Bloom to verify it exists
    const beatBloomDoc = await BeatBloom.findById(beatBloomId);
    if (!beatBloomDoc) {
      return res.status(404).json({
        success: false,
        message: 'Beat & Bloom service not found'
      });
    }

    // Generate public URLs for uploaded images
    const imageUrls = req.files.map(file => generatePublicUrl(file.path, 'beatbloom', req));
    
    if (isPrimary) {
      // Primary image: set primaryImage field directly (only first image if multiple)
      const primaryImageUrl = imageUrls[0];
      await BeatBloom.findByIdAndUpdate(
        beatBloomId,
        { $set: { primaryImage: primaryImageUrl } },
        { new: false }
      );
      
      // Get updated beat bloom
      const updatedBeatBloom = await BeatBloom.findById(beatBloomId);
      
      res.status(200).json({
        success: true,
        message: 'Primary image uploaded successfully',
        data: {
          beatBloomId: updatedBeatBloom._id,
          primaryImage: updatedBeatBloom.primaryImage,
          newImages: [primaryImageUrl]
        }
      });
    } else {
      // Gallery images: add to images array using atomic $push (prevents race conditions)
      await BeatBloom.findByIdAndUpdate(
        beatBloomId,
        { $push: { images: { $each: imageUrls } } },
        { new: false }
      );
      
      // Get updated beat bloom
      const updatedBeatBloom = await BeatBloom.findById(beatBloomId);
      
      res.status(200).json({
        success: true,
        message: 'Beat & Bloom images uploaded successfully',
        data: {
          beatBloomId: updatedBeatBloom._id,
          images: updatedBeatBloom.images,
          newImages: imageUrls
        }
      });
    }
  } catch (error) {
    console.error('Beat & Bloom image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading Beat & Bloom images',
      error: error.message
    });
  }
});

// ==================== BULK IMAGE UPLOAD ====================

// @desc    Upload multiple images for any entity
// @route   POST /api/upload/bulk
// @access  Private
export const uploadBulkImages = asyncHandler(async (req, res) => {
  // Get entity type from query parameter (used by middleware) or body
  const entityType = req.query.entityType || req.body.entityType;
  const { entityId } = req.body;
  const userId = req.userId;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image files provided'
    });
  }

  if (!entityType) {
    return res.status(400).json({
      success: false,
      message: 'Entity type is required (query parameter or body)'
    });
  }

  try {
    // Generate public URLs based on entity type
    const entityTypeMap = {
      'package': 'packages',
      'packages': 'packages',
      'beatbloom': 'beatbloom',
      'event': 'events',
      'events': 'events',
      'venue': 'venues',
      'venues': 'venues'
    };
    const folderType = entityTypeMap[entityType] || 'packages';
    const imageUrls = req.files.map(file => generatePublicUrl(file.path, folderType, req));
    let updatedDocument;

    // Update the appropriate entity
    switch (entityType) {
      case 'package':
        updatedDocument = await Package.findById(entityId);
        if (updatedDocument) {
          updatedDocument.images = [...updatedDocument.images, ...imageUrls];
          await updatedDocument.save();
        }
        break;
        
      case 'beatbloom':
        updatedDocument = await BeatBloom.findById(entityId);
        if (updatedDocument && updatedDocument.vendorId.toString() === userId) {
          updatedDocument.images = [...updatedDocument.images, ...imageUrls];
          await updatedDocument.save();
        }
        break;
        
      case 'event':
        const { Event } = await import('../models/index.js');
        updatedDocument = await Event.findById(entityId);
        if (updatedDocument) {
          updatedDocument.images = [...updatedDocument.images, ...imageUrls];
          await updatedDocument.save();
        }
        break;
        
      case 'venue':
        const { Venue } = await import('../models/index.js');
        updatedDocument = await Venue.findById(entityId);
        if (updatedDocument) {
          updatedDocument.images = [...updatedDocument.images, ...imageUrls];
          await updatedDocument.save();
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type'
        });
    }

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        entityType,
        entityId,
        images: imageUrls,
        totalImages: updatedDocument.images.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
});
