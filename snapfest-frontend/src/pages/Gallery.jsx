import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  Filter, 
  Grid, 
  List, 
  Search,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { publicAPI } from '../services/api';
import { Card, Button, Badge } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

const Gallery = () => {
  const [allImages, setAllImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageStats, setImageStats] = useState({ events: 0, venues: 0, packages: 0 });

  // Map backend types to human-readable names
  const formatTypeName = (type) => {
    if (!type) return '';
    const typeMap = {
      'WEDDING': 'Wedding',
      'BIRTHDAY': 'Birthday',
      'BABY_SHOWER': 'Baby Shower',
      'DEMISE': 'Demise',
      'HALDI_MEHNDI': 'Haldi & Mehndi',
      'CAR_DIGGI_CELEBRATION': 'Car & Diggi',
      'CORPORATE': 'Corporate',
      'VENUE': 'Venue',
      'HEALTHY': 'Healthy',
      'HEALTH': 'Health'
    };
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setLoading(true);
        
        // Load all images from events, venues, and packages
        const [eventsRes, venuesRes, packagesRes] = await Promise.all([
          publicAPI.getEvents({ page: 1, limit: 100 }),
          publicAPI.getVenues({ page: 1, limit: 100 }),
          publicAPI.getPackages({ page: 1, limit: 100 })
        ]);
        
        const images = [];
        let eventCount = 0, venueCount = 0, packageCount = 0;
        
        // Process Events
        if (eventsRes.data.success && eventsRes.data.data) {
          const events = eventsRes.data.data.items || eventsRes.data.data.events || [];
          events.forEach(event => {
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
              eventCount++;
            }
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
                eventCount++;
              });
            }
          });
        }
        
        // Process Venues
        if (venuesRes.data.success && venuesRes.data.data) {
          const venues = venuesRes.data.data.items || venuesRes.data.data.venues || [];
          venues.forEach(venue => {
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
              venueCount++;
            }
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
                venueCount++;
              });
            }
          });
        }
        
        // Process Packages
        if (packagesRes.data.success && packagesRes.data.data) {
          const packages = packagesRes.data.data.items || packagesRes.data.data.packages || [];
          packages.forEach(pkg => {
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
              packageCount++;
            }
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
                packageCount++;
              });
            }
          });
        }
        
        setAllImages(images);
        setImageStats({ events: eventCount, venues: venueCount, packages: packageCount });
      } catch (err) {
        console.error('Error loading gallery:', err);
        setError(err.message || 'Failed to load gallery images');
      } finally {
        setLoading(false);
      }
    };

    loadGalleryImages();
  }, []);

  // Enhanced filter images with better type matching
  const filteredImages = useMemo(() => {
    if (!allImages || allImages.length === 0) return [];
    
    return allImages.filter(image => {
      // Category filter
      const matchesCategory = selectedCategory === 'all' || image.category === selectedCategory;
      if (!matchesCategory) return false;
      
      // Type filter - must match if selectedType is set
      if (selectedType) {
        if (image.type !== selectedType) {
          return false;
        }
      }
      
      // Search filter - matches title, type (both original and formatted), and location
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = image.title?.toLowerCase().includes(query) || false;
        const locationMatch = image.location?.toLowerCase().includes(query) || false;
        
        // Match against original type
        const typeMatch = image.type?.toLowerCase().includes(query) || false;
        
        // Match against formatted type name
        const formattedType = formatTypeName(image.type).toLowerCase();
        const formattedTypeMatch = formattedType.includes(query) || false;
        
        // Match common type keywords
        const typeKeywords = {
          'wedding': ['WEDDING'],
          'birthday': ['BIRTHDAY'],
          'baby shower': ['BABY_SHOWER'],
          'babyshower': ['BABY_SHOWER'],
          'demise': ['DEMISE'],
          'haldi': ['HALDI_MEHNDI'],
          'mehndi': ['HALDI_MEHNDI'],
          'car': ['CAR_DIGGI_CELEBRATION'],
          'diggi': ['CAR_DIGGI_CELEBRATION'],
          'corporate': ['CORPORATE'],
          'healthy': ['HEALTHY', 'HEALTH'],
          'health': ['HEALTHY', 'HEALTH'],
          'venue': ['VENUE']
        };
        
        const keywordMatch = Object.entries(typeKeywords).some(([keyword, types]) => {
          if (query.includes(keyword) || keyword.includes(query)) {
            return types.includes(image.type);
          }
          return false;
        });
        
        const matchesSearch = titleMatch || locationMatch || typeMatch || formattedTypeMatch || keywordMatch;
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [allImages, selectedCategory, searchQuery, selectedType]);

  // Handle image click
  const handleImageClick = (image, index) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  // Close lightbox
  const closeLightbox = () => {
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  // Navigate images
  const goToPrevious = (e) => {
    e?.stopPropagation();
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : filteredImages.length - 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(filteredImages[newIndex]);
  };

  const goToNext = (e) => {
    e?.stopPropagation();
    const newIndex = currentImageIndex < filteredImages.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setSelectedImage(filteredImages[newIndex]);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentImageIndex, filteredImages]);

  // Get unique types for filter dropdown
  const uniqueTypes = useMemo(() => {
    const types = new Set();
    allImages.forEach(img => {
      if (img.type) types.add(img.type);
    });
    return Array.from(types).sort();
  }, [allImages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md shadow-xl">
          <div className="text-red-600 mb-4">
            <Camera className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Error Loading Gallery</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      {/* Hero Section with Background Image */}
      <div 
        className="relative h-[300px] overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/heroImages/WhatsApp Image 2025-11-28 at 10.55.36.jpeg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="text-white/90 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold mb-3 flex items-center gap-4 text-white drop-shadow-2xl">
                  <ImageIcon className="w-12 h-12" />
                  Gallery
                </h1>
                <p className="text-pink-100 text-xl font-medium drop-shadow-lg">
                  {filteredImages.length} stunning photos from our events, venues & packages
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 shadow-lg"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl p-1 border border-white/30 shadow-lg">
                <Button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white text-pink-600 shadow-md' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white text-pink-600 shadow-md' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs - Redesigned */}
      <div className="bg-white/90 backdrop-blur-sm border-b sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto py-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({allImages.length})
            </button>
            <button
              onClick={() => setSelectedCategory('events')}
              className={`px-6 py-2.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'events'
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Events ({imageStats.events})
            </button>
            <button
              onClick={() => setSelectedCategory('venues')}
              className={`px-6 py-2.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'venues'
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Venues ({imageStats.venues})
            </button>
            <button
              onClick={() => setSelectedCategory('packages')}
              className={`px-6 py-2.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'packages'
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Packages ({imageStats.packages})
            </button>
          </div>
        </div>
      </div>

      {/* Filters - Redesigned */}
      {showFilters && (
        <div className="bg-white/95 backdrop-blur-sm border-b shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, type (wedding, birthday, healthy, etc.)..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>
                      {formatTypeName(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('');
                  }}
                  variant="outline"
                  className="flex-1 py-3 border-2 rounded-xl font-semibold hover:bg-gray-50"
                >
                  Clear Filters
                </Button>
                <Button
                  onClick={() => setShowFilters(false)}
                  variant="outline"
                  className="flex-1 py-3 border-2 rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid - Redesigned */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className="h-full"
              >
                <Card 
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white border-2 border-gray-100 shadow-xl rounded-2xl h-full flex flex-col"
                >
                  <div 
                    className="relative aspect-square overflow-hidden cursor-pointer bg-gradient-to-br from-gray-100 to-gray-200"
                    onClick={() => handleImageClick(image, index)}
                  >
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                    
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Found';
                      }}
                    />
                    
                    {/* Enhanced overlay with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <div className="mb-3">
                          <p className="font-bold text-base line-clamp-2 mb-3 drop-shadow-lg">{image.title}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold px-3 py-1 shadow-lg border-0">
                            {image.category}
                          </Badge>
                          <Badge className="bg-white/25 backdrop-blur-md text-white text-xs font-bold border border-white/40 px-3 py-1 shadow-lg">
                            {formatTypeName(image.type)}
                          </Badge>
                        </div>
                        {image.location && (
                          <div className="mt-3 flex items-center gap-1">
                            <span className="text-xs text-white/90 font-medium">{image.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Click indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 border-2 border-white/40">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Card footer with info (always visible) */}
                  <div className="p-4 bg-gradient-to-br from-white to-gray-50 border-t border-gray-100">
                    <p className="font-semibold text-sm text-gray-900 line-clamp-1 mb-2">{image.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-pink-100 text-pink-700 text-xs font-semibold border-0">
                        {image.category}
                      </Badge>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-600 font-medium">{formatTypeName(image.type)}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                whileHover={{ x: 6, scale: 1.01 }}
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white border-2 border-gray-100 shadow-lg rounded-2xl group">
                  <div className="flex">
                    <div 
                      className="relative w-56 h-56 flex-shrink-0 overflow-hidden cursor-pointer bg-gradient-to-br from-gray-100 to-gray-200 group-hover:shadow-inner transition-all duration-500"
                      onClick={() => handleImageClick(image, index)}
                    >
                      <img
                        src={image.url}
                        alt={image.title}
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Found';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 to-red-500/0 group-hover:from-pink-500/10 group-hover:to-red-500/10 transition-all duration-500"></div>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                          <Camera className="w-5 h-5 text-pink-600" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-6 bg-gradient-to-br from-white to-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors duration-300 pr-4">
                          {image.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm mb-4 flex-wrap">
                        <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white capitalize font-bold px-3 py-1 shadow-md border-0">
                          {image.category}
                        </Badge>
                        <Badge variant="outline" className="capitalize font-bold border-2 border-gray-300 px-3 py-1 bg-white">
                          {formatTypeName(image.type)}
                        </Badge>
                        {image.location && (
                          <span className="text-gray-600 font-semibold flex items-center gap-1">
                            <span className="text-gray-400">📍</span>
                            {image.location}
                          </span>
                        )}
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => handleImageClick(image, index)}
                          className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          View Full Size
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State - Redesigned */}
        {filteredImages.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Camera className="w-16 h-16 text-pink-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No photos found</h3>
            <p className="text-gray-600 mb-8 text-lg">
              Try adjusting your filters or search criteria
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('');
                setSelectedCategory('all');
              }}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={closeLightbox}
              className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-3 hover:bg-black/70 backdrop-blur-md shadow-lg"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </motion.button>

            {filteredImages.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={goToPrevious}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-4 hover:bg-black/70 backdrop-blur-md shadow-lg"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={goToNext}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-4 hover:bg-black/70 backdrop-blur-md shadow-lg"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </>
            )}

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-7xl max-h-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={selectedImage.id}
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800?text=Image+Not+Found';
                }}
              />
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-center text-white"
              >
                <h3 className="text-3xl font-bold mb-3">{selectedImage.title}</h3>
                <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                  <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white capitalize font-semibold px-4 py-1">
                    {selectedImage.category}
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30 capitalize font-semibold px-4 py-1">
                    {formatTypeName(selectedImage.type)}
                  </Badge>
                  {selectedImage.location && (
                    <span className="text-gray-300 font-medium">{selectedImage.location}</span>
                  )}
                  <span className="text-gray-400 font-semibold">{currentImageIndex + 1} / {filteredImages.length}</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
