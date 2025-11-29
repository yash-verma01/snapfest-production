import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Grid, List, SlidersHorizontal, Star, Crown, Sparkles, Award, Zap } from 'lucide-react';
import { PackageCard } from '../components/cards';
import { Button } from '../components/ui';
import { GlassCard, ScrollReveal, LoadingSkeleton } from '../components/enhanced';
import { usePackages } from '../hooks';
// Auth handled by Clerk globally; no local auth hook needed

const Packages = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
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
    goToPage
  } = usePackages({
    category: selectedCategory,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    sortBy
  });

  // Sync URL with current page and fetch packages when page changes
  useEffect(() => {
    // Wait for pagination data to be available
    if (pagination.totalPages === 0) {
      // Initial load - fetch the page from URL or default to 1
      goToPage(currentPage || 1);
      return;
    }

    // If page number differs from URL, sync it
    if (currentPage !== pagination.page && !loading) {
      if (currentPage >= 1 && currentPage <= pagination.totalPages) {
        goToPage(currentPage);
      } else if (currentPage < 1) {
        // Invalid page (too low), reset to page 1
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.set('page', '1');
          return newParams;
        });
      } else {
        // Invalid page (too high), reset to last page
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.set('page', pagination.totalPages.toString());
          return newParams;
        });
      }
    }
  }, [currentPage, pagination.page, pagination.totalPages, goToPage, setSearchParams]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== currentPage) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', newPage.toString());
        return newParams;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset to page 1 when filters change and fetch packages
  useEffect(() => {
    // Only trigger on filter changes, not on initial mount
    const hasFilters = selectedCategory || priceRange.min || priceRange.max || sortBy;
    if (hasFilters && currentPage !== 1) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', '1');
        return newParams;
      });
    }
  }, [selectedCategory, priceRange.min, priceRange.max, sortBy, currentPage, setSearchParams]);



  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    updateFilters({
      category,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sortBy
    });
  };

  const handlePriceFilter = (min, max) => {
    const newPriceRange = { min, max };
    setPriceRange(newPriceRange);
    updateFilters({
      category: selectedCategory,
      minPrice: min,
      maxPrice: max,
      sortBy
    });
  };

  const handleRatingFilter = (rating) => {
    setSelectedRating(rating);
    // Rating is applied client-side in filteredPackages, no need to call updateFilters
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    updateFilters({
      category: selectedCategory,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sortBy: newSortBy
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSelectedLocation('');
    setSelectedDate('');
    setSelectedRating('');
    updateFilters({});
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by filtering logic below
  };

  // Map search terms to category values
  const getCategoryFromSearch = (query) => {
    const queryLower = query.toLowerCase().trim();
    const categoryMap = {
      'wedding': 'WEDDING',
      'weddings': 'WEDDING',
      'birthday': 'BIRTHDAY',
      'birthdays': 'BIRTHDAY',
      'baby shower': 'BABY_SHOWER',
      'babyshower': 'BABY_SHOWER',
      'demise': 'DEMISE',
      'haldi': 'HALDI_MEHNDI',
      'mehndi': 'HALDI_MEHNDI',
      'haldi mehndi': 'HALDI_MEHNDI',
      'car': 'CAR_DIGGI_CELEBRATION',
      'diggi': 'CAR_DIGGI_CELEBRATION',
      'car diggi': 'CAR_DIGGI_CELEBRATION',
      'corporate': 'CORPORATE',
    };
    
    // Check for exact matches first
    if (categoryMap[queryLower]) {
      return categoryMap[queryLower];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(categoryMap)) {
      if (queryLower.includes(key) || key.includes(queryLower)) {
        return value;
      }
    }
    
    return null;
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

  // Filter packages based on search query, category, price, and rating
  const filteredPackages = useMemo(() => {
    let filtered = packages;

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchedCategory = getCategoryFromSearch(query);
      
      filtered = filtered.filter(pkg => {
        // Search in title
        const titleMatch = pkg.title?.toLowerCase().includes(query) || false;
        
        // Search in description
        const descriptionMatch = pkg.description?.toLowerCase().includes(query) || false;
        
        // Search in category (exact match or partial)
        const categoryMatch = matchedCategory 
          ? pkg.category === matchedCategory
          : pkg.category?.toLowerCase().includes(query) || false;
        
        // Search in category name (human-readable)
        const categoryNameMatch = premiumCategories.some(cat => 
          cat.value === pkg.category && cat.name.toLowerCase().includes(query)
        );
        
        return titleMatch || descriptionMatch || categoryMatch || categoryNameMatch;
      });
    }

    // Apply category filter (if not already filtered by search)
    if (selectedCategory && !searchQuery.trim()) {
      filtered = filtered.filter(pkg => pkg.category === selectedCategory);
    }

    // Apply price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(pkg => {
        const price = pkg.basePrice || pkg.price || 0;
        const min = priceRange.min ? parseInt(priceRange.min) : 0;
        const max = priceRange.max ? parseInt(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Apply rating filter
    if (selectedRating) {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter(pkg => {
        const rating = pkg.rating || pkg.averageRating || 0;
        return rating >= minRating;
      });
    }

    return filtered;
  }, [packages, searchQuery, selectedCategory, priceRange, selectedRating, premiumCategories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
      {/* Professional Hero Section with Background Image */}
      <section className="relative overflow-hidden min-h-[400px] flex items-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/heroImages/WhatsApp Image 2025-11-28 at 10.48.48.jpeg')` }}>
        {/* Overlay for text readability - subtle dark overlay only */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg border border-white/30">
                <Crown className="w-4 h-4 mr-2" />
                Premium Event Packages
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-2xl">
                Choose Your Perfect Package
              </h1>
              <p className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-lg">
                Discover our carefully curated event packages designed to make your special day unforgettable. 
                From intimate gatherings to grand celebrations, we have the perfect package for you.
              </p>
            </div>

            {/* Professional Search Bar */}
            <div className="max-w-3xl mx-auto mt-6">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search packages by name, category (wedding, birthday, etc.)..."
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

      {/* AuthDebug removed - no longer needed */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <GlassCard className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Category</label>
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
              </div>

              {/* Additional Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                  <select
                    value={selectedRating}
                    onChange={(e) => handleRatingFilter(e.target.value)}
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
            </GlassCard>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {filteredPackages.length} {filteredPackages.length === 1 ? 'package' : 'packages'}
                {searchQuery && ` for "${searchQuery}"`}
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
                <LoadingSkeleton type="card" count={6} />
              </div>
            )}

            {/* Packages Grid/List */}
            {!loading && !error && filteredPackages.length > 0 && (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-6'
              }>
                {filteredPackages.map((pkg, index) => (
                  <ScrollReveal key={pkg._id} direction="up" delay={index * 0.1}>
                    <PackageCard
                      packageData={pkg}
                      onViewDetails={(pkg) => {
                        navigate(`/packages/${pkg._id}`);
                      }}
                      className={viewMode === 'list' ? 'flex flex-row' : ''}
                    />
                  </ScrollReveal>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredPackages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? `No packages found for "${searchQuery}". Try adjusting your search or filters.`
                    : 'Try adjusting your filters or search terms'
                  }
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && pagination.totalPages > 1 && (
              <div className="flex flex-col items-center gap-4 mt-8">
                {/* Page Info */}
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages} • Showing {packages.length} packages
                </div>
                
                {/* Pagination Buttons */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {/* Previous Button */}
                  <Button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                    variant="outline"
                    className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </Button>
                  
                  {/* Page Numbers */}
                  {(() => {
                    const pages = [];
                    const totalPages = pagination.totalPages;
                    const current = pagination.page;
                    
                    // Show max 5 page numbers
                    let startPage = Math.max(1, current - 2);
                    let endPage = Math.min(totalPages, current + 2);
                    
                    // Adjust if we're near the start
                    if (current <= 3) {
                      startPage = 1;
                      endPage = Math.min(5, totalPages);
                    }
                    
                    // Adjust if we're near the end
                    if (current >= totalPages - 2) {
                      startPage = Math.max(1, totalPages - 4);
                      endPage = totalPages;
                    }
                    
                    // First page and ellipsis
                    if (startPage > 1) {
                      pages.push(
                        <Button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className={`px-4 py-2 ${
                            current === 1
                              ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-pink-50'
                          }`}
                        >
                          1
                        </Button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis-start" className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                    }
                    
                    // Page number buttons
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`px-4 py-2 ${
                            current === i
                              ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-pink-50'
                          }`}
                        >
                          {i}
                        </Button>
                      );
                    }
                    
                    // Last page and ellipsis
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis-end" className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <Button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className={`px-4 py-2 ${
                            current === totalPages
                              ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-pink-50'
                          }`}
                        >
                          {totalPages}
                        </Button>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  {/* Next Button */}
                  <Button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages || loading}
                    variant="outline"
                    className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default Packages;