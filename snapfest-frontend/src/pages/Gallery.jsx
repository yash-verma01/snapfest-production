import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  Filter, 
  Grid, 
  List, 
  Search,
  ArrowLeft,
  Heart,
  Share2,
  Download,
  Eye
} from 'lucide-react';
import { publicAPI } from '../services/api';
import { Card, Button, Badge } from '../components/ui';

const Gallery = () => {
  const [events, setEvents] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getEvents({ 
          page: 1, 
          limit: 50
        });
        
        if (response.data.success && response.data.data) {
          const eventsData = response.data.data.items || response.data.data.events || [];
          setEvents(eventsData);
          
          // Extract all images from events
          const images = [];
          eventsData.forEach(event => {
            if (event.images && event.images.length > 0) {
              event.images.forEach((imageUrl, index) => {
                images.push({
                  id: `${event._id}-${index}`,
                  url: imageUrl,
                  eventTitle: event.title,
                  eventType: event.type,
                  eventLocation: event.location,
                  eventId: event._id
                });
              });
            }
          });
          setAllImages(images);
        }
      } catch (err) {
        console.error('Error loading events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const filteredImages = allImages.filter(image => {
    const matchesSearch = !searchQuery || 
      image.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !selectedType || image.eventType === selectedType;
    const matchesLocation = !selectedLocation || 
      image.eventLocation.toLowerCase().includes(selectedLocation.toLowerCase());
    
    return matchesSearch && matchesType && matchesLocation;
  });

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
            <Camera className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Gallery</h3>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/events" className="text-pink-600 hover:text-pink-700">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Event Gallery</h1>
                <p className="text-gray-600">
                  {filteredImages.length} photos from {events.length} events
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-pink-100 text-pink-600' : 'text-gray-400'}`}
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
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search photos..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="WEDDING">Wedding</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="BIRTHDAY">Birthday</option>
                  <option value="ANNIVERSARY">Anniversary</option>
                  <option value="BABY_SHOWER">Baby Shower</option>
                  <option value="HALDI">Haldi</option>
                </select>
              </div>

              {/* Location */}
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
                  <option value="chennai">Chennai</option>
                  <option value="pune">Pune</option>
                  <option value="jaipur">Jaipur</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('');
                    setSelectedLocation('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredImages.map((image) => (
              <Card key={image.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.eventTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                      <Button size="sm" className="bg-white/90 text-pink-600 hover:bg-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-white/90 text-pink-600 hover:bg-white">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-white/90 text-pink-600 hover:bg-white">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-white/90 text-pink-600 hover:bg-white">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-pink-600 text-white text-xs">
                      {image.eventType}
                    </Badge>
                    <span className="text-xs text-gray-500">{image.eventLocation}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {image.eventTitle}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredImages.map((image) => (
              <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="flex">
                  <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.eventTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {image.eventTitle}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <Badge className="bg-pink-600 text-white">
                            {image.eventType}
                          </Badge>
                          <span>{image.eventLocation}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-pink-600">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-pink-600">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-pink-600">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('');
                setSelectedLocation('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;


