import React, { useState, useEffect } from 'react';
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
  SlidersHorizontal
} from 'lucide-react';
import { publicAPI } from '../services/api';
import { dummyEvents, eventTypes } from '../data';
import { Card, Button, Badge } from '../components/ui';
import { ImageCarousel } from '../components/carousel';
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

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getUpcomingEvents();
        setEvents(response.data.data.events);
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
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !selectedType || event.type === selectedType;
    const matchesLocation = !selectedLocation || event.location.toLowerCase().includes(selectedLocation.toLowerCase());
    
    return matchesSearch && matchesType && matchesLocation;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-500 via-red-500 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Photography <span className="text-yellow-300">Events</span>
            </h1>
            <p className="text-xl md:text-2xl text-pink-100 mb-8">
              Join our photography workshops, exhibitions, and meetups
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-0 text-gray-900 focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-white text-pink-600 hover:bg-pink-50 px-6 py-3 flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Filters Section */}
      {showFilters && (
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">All Event Types</option>
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="delhi">Delhi</option>
                  <option value="bangalore">Bangalore</option>
                  <option value="online">Online</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Any Date</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="next-month">Next Month</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="price">Price</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {filteredEvents.length} Events Found
              </h2>
              <p className="text-gray-600">
                Discover photography events and workshops
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setViewMode('masonry')}
                  className={`p-2 ${viewMode === 'masonry' ? 'bg-pink-100 text-pink-600' : 'text-gray-400'}`}
                >
                  <Grid className="w-5 h-5" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-pink-100 text-pink-600' : 'text-gray-400'}`}
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Events Grid/List */}
          {viewMode === 'masonry' ? (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {sortedEvents.map((event) => (
                <Card key={event.id} className="break-inside-avoid mb-6 p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.images[0]}
                      alt={event.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-pink-600 text-white">
                        {event.type}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-white/80 text-pink-600 hover:bg-white">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-white/80 text-pink-600 hover:bg-white">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">{dateUtils.formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="text-sm">{event.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span className="text-sm">{event.attendees} attendees</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium">{event.rating}</span>
                        <span className="text-sm text-gray-500 ml-1">({event.reviews} reviews)</span>
                      </div>
                      <div className="text-lg font-bold text-pink-600">
                        {formatPrice(event.price)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-pink-600 hover:bg-pink-700 text-white">
                        Book Now
                      </Button>
                      <Button variant="outline" className="px-4">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedEvents.map((event) => (
                <Card key={event.id} className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="relative w-full md:w-80 h-48 md:h-auto overflow-hidden">
                      <img
                        src={event.images[0]}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-pink-600 text-white">
                          {event.type}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {event.title}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-pink-600 mb-2">
                            {formatPrice(event.price)}
                          </div>
                          <div className="flex items-center justify-end">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium">{event.rating}</span>
                            <span className="text-sm text-gray-500 ml-1">({event.reviews})</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">{dateUtils.formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span className="text-sm">{event.attendees} attendees</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="text-sm">{event.duration}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                          Book Now
                        </Button>
                        <Button variant="outline">
                          View Details
                        </Button>
                        <Button variant="outline" className="p-2">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" className="p-2">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

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
    </div>
  );
};

export default EventsEnhanced;





