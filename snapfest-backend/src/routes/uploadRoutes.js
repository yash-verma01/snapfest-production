import express from 'express';
import {
  uploadProfileImage,
  uploadPackageImages,
  uploadAddonImages,
  uploadEventImages,
  uploadVenueImages,
  uploadBeatBloomImages,
  deleteUserImage,
  getImageInfo,
  uploadBulkImages
} from '../controllers/uploadController.js';
import { authenticate, adminOnly, vendorOrAdmin } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple, uploadMixed, processUploadedFiles } from '../middleware/upload.js';

const router = express.Router();

// ==================== PROFILE IMAGE ROUTES ====================

// @route   POST /api/upload/profile
// @desc    Upload user profile image
// @access  Private
router.post('/profile', 
  authenticate, 
  uploadSingle('profileImage', 'profiles'),
  async (req, res, next) => {
    await processUploadedFiles(req, 'profiles');
    next();
  },
  uploadProfileImage
);

// ==================== PACKAGE IMAGE ROUTES ====================

// @route   POST /api/upload/package/:packageId
// @desc    Upload package images
// @access  Private/Admin
router.post('/package/:packageId', 
  authenticate, 
  adminOnly, 
  uploadMultiple('images', 10, 'packages'),
  async (req, res, next) => {
    await processUploadedFiles(req, 'packages');
    next();
  },
  uploadPackageImages
);

// ==================== ADDON IMAGE ROUTES ====================

// @route   POST /api/upload/addon/:addonId
// @desc    Upload addon images
// @access  Private/Vendor
router.post('/addon/:addonId', 
  authenticate, 
  vendorOrAdmin, 
  uploadMultiple('images', 5, 'beatbloom'),
  async (req, res, next) => {
    await processUploadedFiles(req, 'beatbloom');
    next();
  },
  uploadAddonImages
);

// ==================== EVENT IMAGE ROUTES ====================

// @route   POST /api/upload/event/:eventId
// @desc    Upload event images
// @access  Private/Admin
router.post('/event/:eventId', 
  authenticate, 
  adminOnly, 
  uploadMultiple('images', 10, 'events'),
  async (req, res, next) => {
    await processUploadedFiles(req, 'events');
    next();
  },
  uploadEventImages
);

// ==================== VENUE IMAGE ROUTES ====================

// @route   POST /api/upload/venue/:venueId
// @desc    Upload venue images
// @access  Private/Admin
router.post('/venue/:venueId', 
  authenticate, 
  adminOnly, 
  uploadMultiple('images', 10, 'venues'),
  async (req, res, next) => {
    await processUploadedFiles(req, 'venues');
    next();
  },
  uploadVenueImages
);

// ==================== BEAT & BLOOM IMAGE ROUTES ====================

// @route   POST /api/upload/beatbloom/:beatBloomId
// @desc    Upload Beat & Bloom images
// @access  Private/Admin
router.post('/beatbloom/:beatBloomId', 
  authenticate, 
  adminOnly, 
  uploadMultiple('images', 10, 'beatbloom'),
  async (req, res, next) => {
    await processUploadedFiles(req, 'beatbloom');
    next();
  },
  uploadBeatBloomImages
);

// ==================== BULK UPLOAD ROUTES ====================

// @route   POST /api/upload/bulk?entityType=packages|events|venues|beatbloom
// @desc    Upload multiple images for any entity
// @access  Private
// Note: Entity type should be passed as query parameter (e.g., ?entityType=packages)
router.post('/bulk', 
  authenticate, 
  async (req, res, next) => {
    // Extract entity type from query parameter or default to 'packages'
    const entityType = req.query.entityType || 'packages';
    // Create middleware with correct entity type
    const upload = uploadMultiple('images', 20, entityType);
    upload(req, res, async (err) => {
      if (err) return next(err);
      await processUploadedFiles(req, entityType);
      next();
    });
  },
  uploadBulkImages
);

// ==================== IMAGE MANAGEMENT ROUTES ====================

// @route   DELETE /api/upload/image
// @desc    Delete image
// @access  Private
router.delete('/image', 
  authenticate, 
  deleteUserImage
);

// @route   GET /api/upload/image-info
// @desc    Get image information
// @access  Private
router.get('/image-info', 
  authenticate, 
  getImageInfo
);

export default router;
