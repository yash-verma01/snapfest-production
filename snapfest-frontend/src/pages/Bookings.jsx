import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Search,
  RefreshCw
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { userAPI, bookingAPI } from '../services/api';
import { dateUtils } from '../utils';
import BookingDetailsModal from '../components/modals/BookingDetailsModal';
import SupportModal from '../components/modals/SupportModal';

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
    status: '',
    dateRange: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadBookings();
  }, [filters, sortBy, sortOrder]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      console.log('📅 Frontend: Loading bookings...');
      
      // Use bookingAPI which handles Clerk cookie authentication properly
      const response = await bookingAPI.getBookings({
        page: 1,
        limit: 50
      });
      
      console.log('📅 Frontend: Bookings response:', response.data);
      
      setBookings(response.data.data?.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
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
    // Use vendorStatus for filtering, fallback to status for backward compatibility
    const displayStatus = booking.vendorStatus || booking.status;
    const matchesStatus = !filters.status || displayStatus === filters.status;
    const matchesSearch = !filters.search || 
      booking.packageId?.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.location?.toLowerCase().includes(filters.search.toLowerCase());
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
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
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
              <p className="text-gray-600 mb-6">You don't have any bookings yet.</p>
              <Link to="/packages">
                <Button>Browse Packages</Button>
              </Link>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <Badge className={`${getStatusColor(booking.vendorStatus || booking.status)} flex items-center space-x-2`}>
                        {getStatusIcon(booking.vendorStatus || booking.status)}
                        <span>{(booking.vendorStatus || booking.status).replace(/_/g, ' ')}</span>
                      </Badge>
                      <span className="text-sm text-gray-500">
                        #{booking._id.slice(-8)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {booking.packageId?.title || 'Photography Package'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {booking.packageId?.category || 'Wedding Photography'}
                        </p>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{dateUtils.formatDate(booking.eventDate)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{booking.location || 'Location not specified'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Booked {dateUtils.formatDate(booking.createdAt)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-2xl font-bold text-primary-600 mb-2">
                          {formatPrice(booking.totalAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Paid: {formatPrice(booking.amountPaid || 0)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Remaining: {formatPrice((booking.totalAmount || 0) - (booking.amountPaid || 0))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowBookingDetails(true);
                      }}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Invoice</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBookingForSupport(booking._id);
                        setShowSupportModal(true);
                      }}
                      className="flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Support</span>
                    </Button>
                  </div>
                </div>
              </Card>
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





