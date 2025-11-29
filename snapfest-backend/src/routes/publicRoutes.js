import express from 'express';
import {
  // Package Management (Public)
  getAllPackages,
  getPackageById,
  getFeaturedPackages,
  getPackagesByCategory,
  searchPackages,
  getPackageFilters,
  searchAll,
  getTrendingPackages,
  getPopularPackages,
  getApprovedTestimonials,
  getAllReviews,
  getAllGalleryImages,
  getHeroImages
} from '../controllers/publicController.js';
import { getAllEvents, getEventById, getRecentEvents, getEventsByCategory, searchEvents } from '../controllers/eventController.js';
import { getAllVenues, getVenueById } from '../controllers/venueController.js';
import { getAllBeatBloom, getBeatBloomById, getBeatBloomsByCategory, searchBeatBlooms } from '../controllers/beatBloomController.js';
import { optionalAuth } from '../middleware/auth.js';
import { validatePagination, validateSearch } from '../middleware/validation.js';

const router = express.Router();

// ==================== PACKAGE ROUTES ====================
router.get('/packages', optionalAuth, validatePagination, getAllPackages);
router.get('/packages/featured', getFeaturedPackages);
router.get('/packages/trending', getTrendingPackages);
router.get('/packages/popular', getPopularPackages);
router.get('/packages/category/:category', validatePagination, getPackagesByCategory);
router.get('/packages/search', validateSearch, searchPackages);
router.get('/packages/filters', getPackageFilters);
router.get('/packages/:id', getPackageById);

// ==================== EVENT ROUTES ====================
router.get('/events', optionalAuth, validatePagination, getAllEvents);
router.get('/events/upcoming', getRecentEvents);
router.get('/events/recent', getRecentEvents);
router.get('/events/category/:category', validatePagination, getEventsByCategory);
router.get('/events/search', validateSearch, searchEvents);
router.get('/events/:id', getEventById);

// ==================== VENUE ROUTES ====================
router.get('/venues', validatePagination, getAllVenues);
router.get('/venues/:id', getVenueById);

// ==================== BEAT & BLOOM ROUTES ====================
router.get('/beatbloom', validatePagination, getAllBeatBloom);
router.get('/beatbloom/category/:category', getBeatBloomsByCategory);
router.get('/beatbloom/search', validateSearch, searchBeatBlooms);
router.get('/beatbloom/:id', getBeatBloomById);

// ==================== SEARCH & DISCOVERY ====================
router.get('/search', validateSearch, searchAll);

// ==================== TESTIMONIALS ====================
router.get('/testimonials', getApprovedTestimonials);

// ==================== REVIEWS ====================
router.get('/reviews', getAllReviews);

// ==================== GALLERY ====================
router.get('/gallery', getAllGalleryImages);

// ==================== HERO IMAGES ====================
router.get('/hero-images', getHeroImages);

export default router;
