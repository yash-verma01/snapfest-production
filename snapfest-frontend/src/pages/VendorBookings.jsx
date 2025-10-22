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

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'REJECTED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'ACCEPTED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <AlertCircle className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = !filters.status || booking.status === filters.status;
    const matchesSearch = !filters.search || 
      booking.userId?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.packageId?.title?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
              <p className="text-gray-600 mt-2">Manage your bookings and events</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </Button>
              <Button
                onClick={loadBookings}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search bookings..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="eventDate">Event Date</option>
                  <option value="totalAmount">Amount</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Bookings List */}
        <div className="grid gap-6">
          {filteredBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600">You don't have any bookings yet.</p>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <Badge className={`${getStatusColor(booking.status)} flex items-center space-x-2`}>
                        {getStatusIcon(booking.status)}
                        <span>{booking.status}</span>
                      </Badge>
                      <span className="text-sm text-gray-500">
                        #{booking._id.slice(-8)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Customer Info */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Customer</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{booking.userId?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{booking.userId?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{booking.userId?.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {new Date(booking.eventDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{booking.location || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              ₹{booking.totalAmount?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Package Info */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Package</h4>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{booking.packageId?.title || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{booking.packageId?.category || 'N/A'}</p>
                          {booking.customizations && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Customizations:</span>
                              <ul className="list-disc list-inside ml-2">
                                {booking.customizations.map((custom, index) => (
                                  <li key={index}>{custom}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center space-x-4">
                      <Button
                        onClick={() => setSelectedBooking(booking)}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Button>

                      {booking.status === 'PENDING' && (
                        <>
                          <Button
                            onClick={() => handleBookingAction(booking._id, 'accept')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleBookingAction(booking._id, 'reject')}
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {booking.status === 'ACCEPTED' && (
                        <Button
                          onClick={() => handleBookingAction(booking._id, 'start')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Start Event
                        </Button>
                      )}

                      {booking.status === 'IN_PROGRESS' && (
                        <Button
                          onClick={() => handleBookingAction(booking._id, 'complete')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Complete Event
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

