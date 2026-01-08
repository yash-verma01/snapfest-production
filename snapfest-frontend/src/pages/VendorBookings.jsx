import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Filter,
  Search,
  SortAsc,
  RefreshCw
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { vendorAPI } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

const VendorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const { handleAsync, handleApiError } = useErrorHandler();

  useEffect(() => {
    loadBookings();
  }, [filters, sortBy, sortOrder]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getBookings({
        ...filters,
        sortBy,
        sortOrder,
        limit: 50
      });
      setBookings(response.data.data.bookings || []);
    } catch (error) {
      handleApiError(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId, action, data = {}) => {
    try {
      let response;
      switch (action) {
        case 'accept':
          response = await vendorAPI.acceptBooking(bookingId);
          break;
        case 'reject':
          response = await vendorAPI.rejectBooking(bookingId, data);
          break;
        case 'start':
          response = await vendorAPI.startBooking(bookingId);
          break;
        case 'complete':
          response = await vendorAPI.completeBooking(bookingId, data);
          break;
        case 'cancel':
          response = await vendorAPI.cancelBooking(bookingId);
          break;
        default:
          throw new Error('Invalid action');
      }
      
      if (response.data.success) {
        await loadBookings();
        setSelectedBooking(null);
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const getStatusColor = (vendorStatus) => {
    switch (vendorStatus) {
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (vendorStatus) => {
    switch (vendorStatus) {
      case 'ASSIGNED': return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS': return <AlertCircle className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = !filters.status || booking.vendorStatus === filters.status;
    const matchesSearch = !filters.search || 
      booking.userId?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.packageId?.title?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bookings</h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your bookings and events</p>
            </div>
            <div className="flex items-center flex-wrap gap-2 sm:gap-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center space-x-2 text-xs sm:text-sm"
                size="sm"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filter</span>
              </Button>
              <Button
                onClick={loadBookings}
                variant="outline"
                className="flex items-center space-x-2 text-xs sm:text-sm"
                size="sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-4 sm:mb-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search bookings..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="eventDate">Event Date</option>
                  <option value="totalAmount">Amount</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Bookings List */}
        <div className="grid gap-4 sm:gap-6">
          {filteredBookings.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-sm sm:text-base text-gray-600">You don't have any bookings yet.</p>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking._id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
                      <Badge className={`${getStatusColor(booking.vendorStatus || 'ASSIGNED')} flex items-center space-x-2 text-xs`}>
                        {getStatusIcon(booking.vendorStatus || 'ASSIGNED')}
                        <span className="hidden sm:inline">{booking.vendorStatus || 'ASSIGNED'}</span>
                        <span className="sm:hidden">{(booking.vendorStatus || 'ASSIGNED').split('_')[0]}</span>
                      </Badge>
                      <span className="text-xs sm:text-sm text-gray-500">
                        #{booking._id.slice(-8)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Customer Info */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Customer</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate">{booking.userId?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2 min-w-0">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate">{booking.userId?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2 min-w-0">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate">{booking.userId?.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Event Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              {new Date(booking.eventDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 min-w-0">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate">{booking.location || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2 min-w-0">
                            <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium">
                              ₹{booking.totalAmount?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Package Info */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Package</h4>
                        <div className="space-y-2">
                          <p className="text-xs sm:text-sm font-medium break-words">{booking.packageId?.title || 'N/A'}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{booking.packageId?.category || 'N/A'}</p>
                          {booking.customizations && (
                            <div className="text-xs sm:text-sm text-gray-600">
                              <span className="font-medium">Customizations:</span>
                              <ul className="list-disc list-inside ml-2">
                                {booking.customizations.map((custom, index) => (
                                  <li key={index} className="break-words">{custom}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-4">
                      <Button
                        onClick={() => setSelectedBooking(booking)}
                        variant="outline"
                        className="flex items-center space-x-2 text-xs sm:text-sm"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                      </Button>

                      {(booking.vendorStatus === 'ASSIGNED' || booking.vendorStatus === null) && (
                        <>
                          <Button
                            onClick={() => handleBookingAction(booking._id, 'accept')}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                            size="sm"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleBookingAction(booking._id, 'reject')}
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50 text-xs sm:text-sm"
                            size="sm"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {booking.vendorStatus === 'ASSIGNED' && (
                        <Button
                          onClick={() => handleBookingAction(booking._id, 'start')}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                          size="sm"
                        >
                          <span className="hidden sm:inline">Start Event</span>
                          <span className="sm:hidden">Start</span>
                        </Button>
                      )}

                      {booking.vendorStatus === 'IN_PROGRESS' && (
                        <Button
                          onClick={() => handleBookingAction(booking._id, 'complete')}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                          size="sm"
                        >
                          <span className="hidden sm:inline">Complete Event</span>
                          <span className="sm:hidden">Complete</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorBookings;

