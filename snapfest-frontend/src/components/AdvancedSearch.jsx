import React, { useState, useEffect } from 'react';
import { Search, Filter, X, MapPin, Calendar, DollarSign, Star, Users, Clock } from 'lucide-react';
import { Button, Card, Input } from './ui';

const AdvancedSearch = ({ 
  onSearch, 
  onFilterChange, 
  searchTypes = ['packages', 'events', 'venues'],
  showLocation = true,
  showDate = true,
  showPrice = true,
  showRating = true,
  showCapacity = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    type: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    maxCapacity: '',
    sortBy: 'relevance'
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSearch = () => {
    onSearch?.(filters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      type: '',
      location: '',
      dateFrom: '',
      dateTo: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      maxCapacity: '',
      sortBy: 'relevance'
    };
    setFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  };

  return (
    <div className="relative">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search packages, events, venues..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className="px-4 py-3"
        >
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-6 z-50 bg-white shadow-xl border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
              >
                <option value="">All Types</option>
                {searchTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            {showLocation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
            )}

            {/* Date Range */}
            {showDate && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </>
            )}

            {/* Price Range */}
            {showPrice && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Min Price
                  </label>
                  <input
                    type="number"
                    placeholder="Min price"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Max Price
                  </label>
                  <input
                    type="number"
                    placeholder="Max price"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </>
            )}

            {/* Rating */}
            {showRating && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-1" />
                  Min Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>
            )}

            {/* Capacity */}
            {showCapacity && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Max Capacity
                </label>
                <input
                  type="number"
                  placeholder="Max guests"
                  value={filters.maxCapacity}
                  onChange={(e) => handleFilterChange('maxCapacity', e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
            )}

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
              >
                <option value="relevance">Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Rating</option>
                <option value="date">Date</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="text-gray-600"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-pink-500 to-red-500 text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;


