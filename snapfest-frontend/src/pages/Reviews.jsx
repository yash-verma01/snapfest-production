import React, { useState, useEffect } from 'react';
import { Star, Calendar, User, Sparkles, Quote } from 'lucide-react';
import { publicAPI } from '../services/api';
import { Card, Button } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the new reviews endpoint to get all reviews (not just approved testimonials)
      const response = await publicAPI.getReviews({ limit: 100 });
      
      if (response.data.success && response.data.data) {
        const reviewsData = response.data.data.reviews || [];
        setReviews(reviewsData);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // Filter reviews by rating
  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(review => review.rating === parseInt(filter));

  // Calculate statistics
  const stats = {
    total: reviews.length,
    average: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
    byRating: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }
  };

  // Render stars
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 transition-all duration-200 ${
          index < rating
            ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md shadow-xl">
          <div className="text-red-600 mb-4">
            <Star className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Error Loading Reviews</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <Button
            onClick={() => loadReviews()}
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
        className="relative h-[350px] overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/heroImages/WhatsApp Image 2025-11-28 at 10.55.37.jpeg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <div className="text-center text-white">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg border border-white/30 mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Customer Testimonials
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-2xl">
              Customer <span className="text-pink-200">Reviews</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 font-medium drop-shadow-lg max-w-3xl mx-auto">
              See what our customers are saying about SnapFest
            </p>
            
            {/* Statistics */}
            {stats.total > 0 && (
              <div className="mt-8 flex items-center justify-center gap-8 flex-wrap">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-sm text-white/90">Total Reviews</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                  <div className="text-3xl font-bold flex items-center justify-center gap-1">
                    {stats.average}
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="text-sm text-white/90">Average Rating</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Section - Redesigned with Mobile-Friendly Design */}
      <div className="bg-white/90 backdrop-blur-sm border-b sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          {/* Mobile: Horizontal Scrollable Chips */}
          <div className="md:hidden">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap flex-shrink-0 shadow-sm snap-start ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 active:scale-95'
                }`}
              >
                All ({stats.total})
              </button>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.byRating[rating];
                return (
                  <button
                    key={rating}
                    onClick={() => setFilter(rating.toString())}
                    className={`px-4 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 shadow-sm snap-start ${
                      filter === rating.toString()
                        ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-700 active:scale-95'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${filter === rating.toString() ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400'}`} />
                    {rating} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop: Button Layout */}
          <div className="hidden md:flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Reviews ({stats.total})
            </button>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.byRating[rating];
              return (
                <button
                  key={rating}
                  onClick={() => setFilter(rating.toString())}
                  className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                    filter === rating.toString()
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star className={`w-4 h-4 ${filter === rating.toString() ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400'}`} />
                  {rating} Star{count !== 1 ? 's' : ''} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews Grid - Redesigned */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filteredReviews.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredReviews.map((review) => (
                <motion.div
                  key={review._id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: { 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: {
                        duration: 0.3,
                        ease: "easeOut"
                      }
                    }
                  }}
                  exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="p-6 hover:shadow-2xl transition-all duration-500 bg-white border-2 border-gray-100 rounded-2xl h-full flex flex-col group"
                  >
                    {/* Quote Icon */}
                    <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                      <Quote className="w-16 h-16 text-pink-500" />
                    </div>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-5 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <User className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg mb-1">
                            {review.userId?.name || 'Anonymous'}
                          </h3>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                            <span className="ml-2 text-sm font-semibold text-gray-600">
                              {review.rating}.0
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review Text */}
                    <div className="mb-5 flex-1">
                      <p className="text-gray-700 leading-relaxed text-base relative z-10">
                        {review.feedback}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t-2 border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{formatDate(review.createdAt)}</span>
                      </div>

                      {/* Featured Badge */}
                      {review.isFeatured && (
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold rounded-full shadow-md">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Star className="w-16 h-16 text-pink-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              No reviews found
            </h3>
            <p className="text-gray-600 text-lg mb-6">
              {filter === 'all'
                ? 'No reviews available yet.'
                : `No ${filter}-star reviews found.`}
            </p>
            {filter !== 'all' && (
              <Button
                onClick={() => setFilter('all')}
                className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
              >
                View All Reviews
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
