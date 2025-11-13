import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Users, 
  Calendar, 
  Filter, 
  Search,
  Grid,
  List,
  SlidersHorizontal,
  Heart,
  Share2,
  Clock
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { publicAPI } from '../services/api';

const Venues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('popularity');

  useEffect(() => {
    const loadVenues = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getVenues({
          page: 1,
          limit: 20,
          location: selectedLocation,
          capacity: selectedCapacity,
          minPrice: selectedPriceRange.min,
          maxPrice: selectedPriceRange.max,
          sortBy: sortBy
        });
        const venuesData = response.data.data.items || response.data.data.venues || response.data.data.results || [];
        console.log('Loaded venues:', venuesData);
        setVenues(venuesData);
      } catch (err) {
        console.error('Error loading venues:', err);
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };

    loadVenues();
  }, [selectedLocation, selectedCapacity, selectedPriceRange, sortBy]);



  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !selectedLocation || venue.location.includes(selectedLocation);
    const matchesCapacity = !selectedCapacity || venue.capacity.includes(selectedCapacity);
    
    return matchesSearch && matchesLocation && matchesCapacity;
  });

  const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Chennai', 'Pune'];
  const capacities = ['100-200', '200-500', '500-1000', '1000+'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-500 via-red-500 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Your Perfect <span className="text-yellow-300">Venue</span>
            </h1>
            <p className="text-xl md:text-2xl text-pink-100 mb-8">
              Discover beautiful venues for your special events
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search venues or locations..."
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

      {/* Filters Section */}
      {showFilters && (
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <select
                  value={selectedCapacity}
                        onChange={(e) => setSelectedCapacity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                  <option value="">Any Capacity</option>
                  {capacities.map(capacity => (
                    <option key={capacity} value={capacity}>{capacity} guests</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                  <option value="popularity">Popularity</option>
                  <option value="rating">Rating</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('');
                    setSelectedCapacity('');
                    setSelectedPriceRange({ min: '', max: '' });
                  }}
                  className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Clear Filters
                </Button>
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
                {filteredVenues.length} Venues Found
              </h2>
              <p className="text-gray-600">
                Discover the perfect venue for your special event
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0">
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

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="p-0 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Venues Grid */}
          {!loading && (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredVenues.map((venue) => (
                <Card key={venue._id || venue.id} className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={venue.primaryImage || venue.images?.[0] || '/api/placeholder/400/300'}
                      alt={venue.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {venue.isPremium && (
                      <Badge className="absolute top-4 left-4 bg-yellow-500 text-white">
                        Premium
                      </Badge>
                    )}
                    {!venue.isAvailable && (
                      <Badge className="absolute top-4 right-4 bg-red-500 text-white">
                        Unavailable
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 flex gap-2">
                        <Button size="sm" className="bg-white text-pink-600 hover:bg-pink-50">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-white text-pink-600 hover:bg-pink-50">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {venue.name}
                        </h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm">{venue.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium">{venue.rating}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span className="text-sm">Capacity: {venue.capacity} guests</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-sm font-medium text-green-600">
                          {venue.pricePerDay ? `₹${venue.pricePerDay.toLocaleString()}/day` : 'Price on request'}
                        </span>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {venue.amenities?.slice(0, 3).map((amenity, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {venue.amenities && venue.amenities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{venue.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>


                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                        disabled={!venue.isAvailable}
                      >
                        {venue.isAvailable ? 'Enquiry Now' : 'Unavailable'}
                      </Button>
                      <Link to={`/venues/${venue._id || venue.id}`}>
                        <Button
                          variant="outline"
                          className="px-4"
                        >
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredVenues.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLocation('');
                  setSelectedCapacity('');
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

export default Venues;



