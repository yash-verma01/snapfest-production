import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Clock, MapPin, Heart, ArrowRight, Grid, List, SlidersHorizontal } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { publicAPI } from '../services/api';

const BeatBloom = () => {
  const navigate = useNavigate();
  const [beatBlooms, setBeatBlooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'ENTERTAINMENT', label: 'Entertainment' },
    { value: 'DECOR', label: 'Decoration' },
    { value: 'PHOTOGRAPHY', label: 'Photography' },
    { value: 'CATERING', label: 'Catering' },
    { value: 'LIGHTING', label: 'Lighting' },
    { value: 'OTHER', label: 'Other' }
  ];

  useEffect(() => {
    loadBeatBlooms();
  }, [filters, pagination.current]);

  const loadBeatBlooms = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: 12,
        ...filters
      };

      const response = await publicAPI.getBeatBlooms(params);
      
      if (response.data.success) {
        setBeatBlooms(response.data.data.items || []);
        setPagination(response.data.data.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        throw new Error('Failed to load Beat & Bloom packages');
      }
    } catch (err) {
      console.error('Error loading Beat & Bloom packages:', err);
      setError(err.message);
      // Fallback to dummy data
      setBeatBlooms([
        {
          _id: 'dj-setup',
          title: 'DJ Setup & Sound',
          description: 'Professional DJ services with premium sound systems',
          price: 15000,
          category: 'ENTERTAINMENT',
          features: ['Professional DJ', 'Premium Sound System', 'Music Library', 'Lighting Effects'],
          images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'],
          rating: 4.8
        },
        {
          _id: 'decor-setup',
          title: 'Event Decoration',
          description: 'Beautiful decorations to make your event memorable',
          price: 25000,
          category: 'DECOR',
          features: ['Floral Arrangements', 'Lighting Design', 'Backdrop Setup', 'Table Decorations'],
          images: ['https://images.unsplash.com/photo-1519167758481-83f142bb8bce?w=400&h=300&fit=crop'],
          rating: 4.9
        },
        {
          _id: 'photography',
          title: 'Photography Services',
          description: 'Professional photography to capture every moment',
          price: 20000,
          category: 'PHOTOGRAPHY',
          features: ['Professional Photographer', 'High-Resolution Photos', 'Photo Editing', 'Online Gallery'],
          images: ['https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=300&fit=crop'],
          rating: 4.7
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    loadBeatBlooms();
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Beat & Bloom Services
            </h1>
            <p className="text-xl text-pink-100 max-w-3xl mx-auto">
              Individual service packages to make your event perfect. Choose from our curated selection of entertainment, décor, catering, and photography services.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search Beat & Bloom services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </form>

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
                onClick={() => setViewMode('grid')}
                className={`p-3 ${viewMode === 'grid' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600'}`}
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
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                  <input
                    type="number"
                    placeholder="₹0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                  <input
                    type="number"
                    placeholder="₹100000"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="createdAt">Newest First</option>
                    <option value="price">Price</option>
                    <option value="title">Name</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Beat & Bloom services...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadBeatBlooms}>Try Again</Button>
          </div>
        ) : beatBlooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
            <Button onClick={() => {
              setFilters({ category: '', minPrice: '', maxPrice: '', sortBy: 'createdAt', sortOrder: 'desc' });
              setSearchQuery('');
            }}>Clear Filters</Button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {beatBlooms.length} of {pagination.total} services
              </p>
            </div>

            {/* Beat & Bloom Grid/List */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-6'
            }>
              {beatBlooms.map((item) => (
                <Card 
                  key={item._id} 
                  className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                    viewMode === 'list' ? 'flex flex-row' : ''
                  }`}
                  onClick={() => navigate(`/beatbloom/${item._id}`)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="relative">
                        <img
                          src={item.images?.[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'}
                          alt={item.title}
                          className="w-full h-48 object-cover rounded-t-xl"
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-pink-500 text-white">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="absolute top-4 left-4">
                          <button className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                            <Heart className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                            {item.title}
                          </h3>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-gray-600">{item.rating}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="space-y-2 mb-4">
                          {item.features?.slice(0, 2).map((feature, idx) => (
                            <div key={idx} className="flex items-center text-sm text-gray-600">
                              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-2"></div>
                              {feature}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-pink-600">
                            {formatPrice(item.price)}
                          </div>
                          <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex">
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'}
                        alt={item.title}
                        className="w-48 h-32 object-cover rounded-l-xl"
                      />
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                              <Badge className="bg-pink-500 text-white">{item.category}</Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{item.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                {item.rating}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                2-4 hours
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-pink-600 mb-2">
                              {formatPrice(item.price)}
                            </div>
                            <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                              View Details
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={pagination.current === page ? 'bg-pink-500 text-white' : 'bg-white text-gray-600'}
                      variant={pagination.current === page ? 'default' : 'outline'}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BeatBloom;

