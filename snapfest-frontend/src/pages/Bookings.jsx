import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  MessageSquare,
  Filter,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Package
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { GlassCard, ScrollReveal } from '../components/enhanced';
import { userAPI, bookingAPI } from '../services/api';
import { dateUtils } from '../utils';
import BookingDetailsModal from '../components/modals/BookingDetailsModal';
import SupportModal from '../components/modals/SupportModal';
import toast from 'react-hot-toast';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedBookingForSupport, setSelectedBookingForSupport] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load bookings only once on mount
  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only load on mount

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // Use bookingAPI which handles Clerk cookie authentication properly
      const response = await bookingAPI.getBookings({
        page: 1,
        limit: 50
      });
      
      setBookings(response.data.data?.bookings || []);
    } catch (error) {
      console.error('Error loading bookings');
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    // Optimistic update - update UI immediately without showing loading state
    const previousBookings = [...bookings];
    setBookings(prev => prev.map(booking => 
      booking._id === bookingId 
        ? { ...booking, vendorStatus: 'CANCELLED' }
        : booking
    ));

    try {
      await bookingAPI.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      // Silently refresh in background to ensure data consistency
      loadBookings();
    } catch (error) {
      // Revert optimistic update on error
      setBookings(previousBookings);
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (vendorStatus) => {
    // Use vendorStatus if available, fallback to status for backward compatibility
    switch (vendorStatus) {
      case 'ASSIGNED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (vendorStatus) => {
    // Use vendorStatus if available, fallback to status for backward compatibility
    switch (vendorStatus) {
      case 'ASSIGNED':
        return <Users className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredBookings = bookings.filter(booking => {
    // Use vendorStatus for filtering - handle null/undefined as 'NOT_ASSIGNED'
    const displayStatus = booking.vendorStatus || null;
    
    // If no filter selected, show all bookings
    if (!filters.status) {
      return true;
    }
    
    // If filter is selected, match exactly with vendorStatus
    // Handle null vendorStatus separately if needed
    if (filters.status === 'NOT_ASSIGNED') {
      return displayStatus === null || displayStatus === undefined;
    }
    
    return displayStatus === filters.status;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gradient-to-r from-pink-200 to-red-200 rounded-lg w-1/3 mb-6"></div>
            <div className="grid gap-4 sm:gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-white rounded-2xl shadow-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 px-4 py-2 rounded-full text-sm font-semibold shadow-md mb-3">
                  <Package className="w-4 h-4 mr-2" />
                  Your Bookings
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                  My Bookings
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">Manage your bookings and events</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="flex items-center space-x-2 bg-white border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-sm"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
                <Button
                  onClick={loadBookings}
                  variant="outline"
                  className="flex items-center space-x-2 bg-white border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 overflow-hidden"
            >
              <GlassCard className="p-4 sm:p-6 bg-white/80 backdrop-blur-sm border-2 border-pink-100 rounded-2xl shadow-lg">
                <div className="max-w-md">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Filter by Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-gray-700 transition-all duration-300"
                  >
                    <option value="">All Bookings</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="NOT_ASSIGNED">Not Assigned</option>
                  </select>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookings List */}
        <div className="grid gap-3 sm:gap-4">
          {filteredBookings.length === 0 ? (
            <ScrollReveal direction="up">
              <Card className="p-8 sm:p-12 text-center bg-white/80 backdrop-blur-sm border-2 border-pink-100 rounded-2xl shadow-lg">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-100 to-red-100 rounded-full mb-6">
                  <Calendar className="w-10 h-10 text-pink-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">You don't have any bookings yet.</p>
                <Link to="/packages">
                  <Button className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    Browse Packages
                  </Button>
                </Link>
              </Card>
            </ScrollReveal>
          ) : (
            filteredBookings.map((booking, index) => (
              <ScrollReveal key={booking._id} direction="up" delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-3 sm:p-4 bg-white/90 backdrop-blur-sm border-2 border-pink-100 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                    {/* Decorative gradient bar */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 via-red-500 to-pink-500"></div>
                    
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 w-full">
                        {/* Status and Booking ID */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge 
                            className={`${getStatusColor(booking.vendorStatus)} flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm`}
                          >
                            {getStatusIcon(booking.vendorStatus)}
                            <span>{(booking.vendorStatus || 'Not Assigned').replace(/_/g, ' ')}</span>
                          </Badge>
                          <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-full">
                            #{booking._id.slice(-8)}
                          </span>
                        </div>

                        {/* Package Info */}
                        <div className="mb-3">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                            {booking.packageId?.title || 'Photography Package'}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            {booking.packageId?.category || 'Wedding Photography'}
                          </p>
                        </div>

                        {/* Details Grid - More Compact */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
                          {/* Event Date */}
                          <div className="flex items-center space-x-2 p-2 bg-gradient-to-br from-pink-50 to-red-50 rounded-lg border border-pink-100">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-md flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-0.5">Event Date</p>
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                {dateUtils.formatDate(booking.eventDate)}
                              </p>
                            </div>
                          </div>

                          {/* Location */}
                          <div className="flex items-center space-x-2 p-2 bg-gradient-to-br from-pink-50 to-red-50 rounded-lg border border-pink-100">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-md flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-0.5">Location</p>
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                {booking.location || 'Location not specified'}
                              </p>
                            </div>
                          </div>

                          {/* Booking Date */}
                          <div className="flex items-center space-x-2 p-2 bg-gradient-to-br from-pink-50 to-red-50 rounded-lg border border-pink-100">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-md flex items-center justify-center">
                              <Clock className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-0.5">Booked On</p>
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                {dateUtils.formatDate(booking.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Price Section - More Compact */}
                        <div className="p-3 bg-gradient-to-r from-pink-600 to-red-600 rounded-lg text-white">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs text-pink-100 mb-0.5">Total Amount</p>
                              <p className="text-xl sm:text-2xl font-bold">
                                {formatPrice(booking.totalAmount)}
                              </p>
                            </div>
                            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-pink-200 opacity-50" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pink-400/30">
                            <div>
                              <p className="text-xs text-pink-100 mb-0.5">Paid</p>
                              <p className="text-xs sm:text-sm font-semibold">
                                {formatPrice(booking.amountPaid || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-pink-100 mb-0.5">Remaining</p>
                              <p className="text-xs sm:text-sm font-semibold">
                                {formatPrice((booking.totalAmount || 0) - (booking.amountPaid || 0))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-1.5 lg:min-w-[120px]">
                        {booking.vendorStatus !== 'CANCELLED' && 
                         booking.vendorStatus !== 'COMPLETED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking._id)}
                            className="flex items-center justify-center space-x-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-300 w-full sm:w-auto lg:w-full py-1.5 text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingDetails(true);
                          }}
                          className="flex items-center justify-center space-x-1.5 border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 w-full sm:w-auto lg:w-full py-1.5 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </Button>
                        {/* Invoice button - Hidden for now, will be implemented later */}
                        {/* <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center justify-center space-x-1.5 border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 w-full sm:w-auto lg:w-full py-1.5 text-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </Button> */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBookingForSupport(booking._id);
                            setShowSupportModal(true);
                          }}
                          className="flex items-center justify-center space-x-1.5 border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 w-full sm:w-auto lg:w-full py-1.5 text-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Support</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </ScrollReveal>
            ))
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          isOpen={showBookingDetails}
          onClose={() => {
            setShowBookingDetails(false);
            setSelectedBooking(null);
          }}
          bookingId={selectedBooking._id}
        />
      )}

      {/* Support Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => {
          setShowSupportModal(false);
          setSelectedBookingForSupport(null);
        }}
        bookingId={selectedBookingForSupport}
      />
    </div>
  );
};

export default Bookings;





