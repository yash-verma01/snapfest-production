import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Star, 
  Filter,
  Grid,
  List,
  Search,
  Camera,
  Video,
  Heart,
  Share2,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { publicAPI } from '../services/api';
import { dummyEvents, eventTypes } from '../data';
import { Card, Button, Badge } from '../components/ui';
import { ImageCarousel } from '../components/carousel';
import MasonryGrid from '../components/MasonryGrid';
import { MobileCarousel, TouchCard } from '../components/MobileEnhancements';
import { dateUtils } from '../utils';

const EventsEnhanced = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('masonry');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEventForGallery, setSelectedEventForGallery] = useState(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        console.log('🔍 Events: Fetching events with filters:', { selectedType, selectedLocation, selectedDateRange, sortBy });
        const response = await publicAPI.getEvents({ 
          page: 1, 
          limit: 20,
          type: selectedType,
          location: selectedLocation,
          dateRange: selectedDateRange,
          sortBy: sortBy
        });
        console.log('📅 Events: API response:', response.data);
        
        // Parse backend response correctly
        if (response.data.success && response.data.data) {
          const events = response.data.data.items || response.data.data.events || [];
          console.log('📅 Events: Parsed events:', events);
          setEvents(events);
        } else {
          throw new Error('Invalid response format from backend');
        }
      } catch (err) {
        console.error('Error loading events:', err);
        setError(err.message);
        // Fallback to dummy data
        setEvents(dummyEvents);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [selectedType, selectedLocation, selectedDateRange, sortBy]);

  // Memoize filtered events to avoid recalculating on every render
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Enhanced search - checks title, description, type, and location
      const matchesSearch = !searchQuery || (() => {
        const query = searchQuery.toLowerCase();
        const searchableFields = [
          event.title || '',
          event.description || '',
          event.type || '',
          typeof event.location === 'string' 
            ? event.location 
            : (event.location?.name || event.location?.fullAddress || event.location?.city || '')
        ];
        
        return searchableFields.some(field => 
          field.toLowerCase().includes(query)
        );
      })();
      
      const matchesType = !selectedType || event.type === selectedType;
      const matchesLocation = !selectedLocation || 
        (typeof event.location === 'string' 
          ? event.location.toLowerCase().includes(selectedLocation.toLowerCase())
          : (event.location?.name || event.location?.fullAddress || '').toLowerCase().includes(selectedLocation.toLowerCase())
        );
      
      // Apply rating filter
      const matchesRating = !selectedRating || (() => {
        const minRating = parseFloat(selectedRating);
        const eventRating = event.rating || event.averageRating || 0;
        return eventRating >= minRating;
      })();
      
      // Apply date filter
      const matchesDate = !selectedDate || (() => {
        if (!event.date) return false;
        const eventDate = new Date(event.date).toISOString().split('T')[0];
        return eventDate === selectedDate;
      })();
      
      return matchesSearch && matchesType && matchesLocation && matchesRating && matchesDate;
    });
  }, [events, searchQuery, selectedType, selectedLocation, selectedRating, selectedDate]);

  // Memoize sorted events to avoid recalculating on every render
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'price':
          return a.price - b.price;
        case 'popularity':
          return b.attendees - a.attendees;
        default:
          return 0;
      }
    });
  }, [filteredEvents, sortBy]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Filter handlers
  const handleTypeFilter = (type) => {
    setSelectedType(type);
  };

  const handlePriceFilter = (min, max) => {
    setPriceRange({ min, max });
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
  };

  const clearFilters = () => {
    setSelectedType('');
    setSelectedLocation('');
    setSelectedDateRange('');
    setPriceRange({ min: '', max: '' });
    setSelectedRating('');
    setSelectedDate('');
    setSortBy('date');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the useEffect
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-red-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-red-100 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-600 mb-4">
            <Calendar className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Events</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
      {/* Hero Section with Background Image */}
      <section className="relative overflow-hidden min-h-[400px] flex items-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/heroImages/WhatsApp Image 2025-11-28 at 10.55.36.jpeg')` }}>
        {/* Overlay for text readability - subtle dark overlay only */}
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="container mx-auto px-4 relative z-10 w-full">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-2xl">
              Photography <span className="text-pink-200">Events</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 mb-8 font-semibold drop-shadow-lg">
              Join our photography workshops, exhibitions, and meetups
            </p>
            
            {/* Professional Search Bar */}
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for events, workshops, or photography sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-base border border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg text-gray-900 placeholder-gray-500"
                  />
                  <Button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Search
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
        <div className="container mx-auto px-4">
          {/* Filters */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 justify-end mb-4">
              {/* Filter Toggle */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('masonry')}
                  className={`p-3 ${viewMode === 'masonry' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-pink-100">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  {/* Event Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                    <select
                      value={selectedType}
                      onChange={(e) => handleTypeFilter(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">All Event Types</option>
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Rating Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                    <select
                      value={selectedRating}
                      onChange={(e) => setSelectedRating(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Any Rating</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4+ Stars</option>
                      <option value="3">3+ Stars</option>
                      <option value="2">2+ Stars</option>
                      <option value="1">1+ Stars</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Clear All Filters
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowFilters(false)}
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        handlePriceFilter(priceRange.min, priceRange.max);
                        setShowFilters(false);
                      }}
                      className="bg-pink-500 hover:bg-pink-600 text-white"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {filteredEvents.length} events
                {selectedType && ` in ${selectedType}`}
              </p>
            </div>

            {/* Events Grid */}
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map((event) => (
                  <Card key={event._id || event.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={event.image || '/api/placeholder/400/300'}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-pink-600 text-white">
                          {event.type}
                        </Badge>
                      </div>
                      {event.isFeatured && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-yellow-500 text-white">
                            Featured
                          </Badge>
                        </div>
                      )}
                      <div className="absolute bottom-4 right-4">
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-white/90 text-pink-600 hover:bg-white">
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Button size="sm" className="bg-white/90 text-pink-600 hover:bg-white">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">{event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            {event.location 
                              ? (typeof event.location === 'string' 
                                ? event.location 
                                : event.location.name || event.location.fullAddress || 'Location TBD')
                              : 'Location TBD'
                            }
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span className="text-sm">{event.guestCount || 0} guests</span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {event.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <Link to={`/events/${event._id || event.id}`}>
                          <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                            View Details
                          </Button>
                        </Link>
                        {event.images && event.images.length > 0 && (
                          <Button
                            variant="ghost"
                            className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                            onClick={() => {
                              setSelectedEventForGallery(event);
                              setShowGalleryModal(true);
                            }}
                          >
                            View Gallery
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Empty State */}
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('');
                  setSelectedLocation('');
                  setSelectedDateRange('');
                }}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Gallery Modal */}
      {showGalleryModal && selectedEventForGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedEventForGallery.title} - Gallery
              </h3>
              <button
                onClick={() => {
                  setShowGalleryModal(false);
                  setSelectedEventForGallery(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
              {selectedEventForGallery.images?.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${selectedEventForGallery.title} - Photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(image, '_blank')}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsEnhanced;
