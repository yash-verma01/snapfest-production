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
  Share2
} from 'lucide-react';
import { publicAPI } from '../services/api';
import { dummyEvents, eventTypes } from '../data';
import { Card, Button, Badge } from '../components/ui';
import { ImageCarousel } from '../components/carousel';
import { dateUtils } from '../utils';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
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
      case 'popularity':
        return b.attendees - a.attendees;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'workshop':
        return 'bg-blue-100 text-blue-800';
      case 'exhibition':
        return 'bg-purple-100 text-purple-800';
      case 'competition':
        return 'bg-green-100 text-green-800';
      case 'meetup':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
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
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Photography Events
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our photography workshops, exhibitions, and meetups to enhance your skills
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="popularity">Sort by Popularity</option>
              <option value="rating">Sort by Rating</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>

        {/* Events Grid/List */}
        {sortedEvents.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {sortedEvents.map((event) => (
              <Card key={event._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Event Image */}
                <div className="relative h-48">
                  <img
                    src={event.image || '/api/placeholder/400/300'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className={getEventTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <Button variant="ghost" size="sm" className="bg-white/80 hover:bg-white">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="bg-white/80 hover:bg-white">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {formatPrice(event.price)}
                      </div>
                      {event.price > 0 && (
                        <div className="text-sm text-gray-500">per person</div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{dateUtils.formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{event.attendees} attendees</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{event.duration}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium">{event.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({event.reviews} reviews)</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {event.isOnline ? 'Online Event' : 'In-Person Event'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link to={`/events/${event._id}`} className="flex-1">
                      <Button className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Button variant="outline">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {sortedEvents.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Load More Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;