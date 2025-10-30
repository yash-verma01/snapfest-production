import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Grid, List, SlidersHorizontal, Star, Crown, Sparkles, Award, Zap } from 'lucide-react';
import { PackageCard } from '../components/cards';
import { Button } from '../components/ui';
import { usePackages } from '../hooks';
// Auth handled by Clerk globally; no local auth hook needed

const Packages = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const {
    packages,
    loading,
    error,
    pagination,
    updateFilters,
    hasMore,
    loadMore
  } = usePackages({
    category: selectedCategory,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    search: searchQuery,
    sortBy
  });



  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({
      category: selectedCategory,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      search: searchQuery,
      sortBy
    });
  };


  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    updateFilters({
      category,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      search: searchQuery,
      sortBy
    });
  };

  const handlePriceFilter = (min, max) => {
    setPriceRange({ min, max });
    updateFilters({
      category: selectedCategory,
      minPrice: min,
      maxPrice: max,
      search: searchQuery,
      sortBy
    });
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    updateFilters({
      category: selectedCategory,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      search: searchQuery,
      sortBy: newSortBy
    });
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSelectedLocation('');
    setSelectedDate('');
    setSelectedRating('');
    setSearchQuery('');
    updateFilters({});
  };

  const premiumCategories = [
    { name: 'All', value: '', icon: <Crown className="w-5 h-5" />, color: 'from-primary-500 to-accent-500' },
    { name: 'Wedding', value: 'WEDDING', icon: <Star className="w-5 h-5" />, color: 'from-accent-500 to-pink-500' },
    { name: 'Birthday', value: 'BIRTHDAY', icon: <Sparkles className="w-5 h-5" />, color: 'from-pink-500 to-primary-500' },
    { name: 'Baby Shower', value: 'BABY_SHOWER', icon: <Star className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
    { name: 'Demise', value: 'DEMISE', icon: <Award className="w-5 h-5" />, color: 'from-gray-500 to-slate-500' },
    { name: 'Haldi & Mehndi', value: 'HALDI_MEHNDI', icon: <Zap className="w-5 h-5" />, color: 'from-yellow-500 to-orange-500' },
    { name: 'Car & Diggi', value: 'CAR_DIGGI_CELEBRATION', icon: <Crown className="w-5 h-5" />, color: 'from-purple-500 to-indigo-500' },
    { name: 'Corporate', value: 'CORPORATE', icon: <Award className="w-5 h-5" />, color: 'from-secondary-500 to-accent-500' }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-50 via-white to-primary-50">
      {/* Professional Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-red-50 py-16">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-pink-200/20 to-red-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-red-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg">
                <Crown className="w-4 h-4 mr-2" />
                Premium Event Packages
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                <span className="bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                  Choose Your Perfect Package
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Discover our carefully curated event packages designed to make your special day unforgettable. 
                From intimate gatherings to grand celebrations, we have the perfect package for you.
              </p>
            </div>

            {/* Professional Search Bar */}
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for packages, events, or services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-base border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg"
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

      {/* AuthDebug removed - no longer needed */}

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
                  placeholder="Search packages, events, or services..."
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
                    value={selectedCategory}
                    onChange={(e) => handleCategoryFilter(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    <option value="WEDDING">Wedding</option>
                    <option value="BIRTHDAY">Birthday</option>
                    <option value="BABY_SHOWER">Baby Shower</option>
                    <option value="DEMISE">Demise</option>
                    <option value="HALDI_MEHNDI">Haldi & Mehndi</option>
                    <option value="CAR_DIGGI_CELEBRATION">Car & Diggi</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                  <input
                    type="number"
                    placeholder="₹0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                  <input
                    type="number"
                    placeholder="₹1000000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price">Price</option>
                    <option value="name">Name</option>
                    <option value="rating">Rating</option>
                    <option value="createdAt">Newest First</option>
                  </select>
                </div>
              </div>

              {/* Additional Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    <option value="delhi">Delhi</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="bangalore">Bangalore</option>
                    <option value="chennai">Chennai</option>
                    <option value="kolkata">Kolkata</option>
                  </select>
                </div>

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
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {packages.length} packages
                {selectedCategory && ` in ${selectedCategory}`}
                {priceRange.min && priceRange.max && ` • ₹${priceRange.min} - ₹${priceRange.max}`}
              </p>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center border border-gray-100">
                <div className="text-red-500 mb-4">
                  <Search className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Packages</h3>
                <p className="text-gray-600 mb-4 text-sm">{error}</p>
                <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-sm">
                  Try Again
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                    <div className="loading-skeleton h-40 mb-4"></div>
                    <div className="loading-skeleton h-3 mb-2"></div>
                    <div className="loading-skeleton h-3 w-2/3"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Packages Grid/List */}
            {!loading && !error && packages.length > 0 && (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-6'
              }>
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg._id}
                    packageData={pkg}
                    onViewDetails={(pkg) => {
                      navigate(`/packages/${pkg._id}`);
                    }}
                    className={viewMode === 'list' ? 'flex flex-row' : ''}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && packages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}

            {/* Load More Button */}
            {!loading && hasMore && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Load More Packages
                </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Packages;