import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Search, Filter, Eye, Edit, CheckCircle, XCircle, Clock, UserPlus, ShieldCheck, RefreshCw, X, Package, MapPin, DollarSign, CreditCard, User, Mail, Phone } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';
import VendorAssignmentModal from './VendorAssignmentModal';
import { useDebounce } from '../../hooks/useDebounce';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import toast from 'react-hot-toast';

const BookingManagement = ({ highlightBookingId, onBookingHighlighted }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assigningVendor, setAssigningVendor] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [generatingOTP, setGeneratingOTP] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  const highlightedBookingRef = useRef(null);

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Memoized load function with useCallback
  const loadBookings = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(debouncedSearchQuery && { q: debouncedSearchQuery }),
        ...(selectedStatus && { status: selectedStatus })
      };
      
      const response = await adminAPI.getBookings(params);
      setBookings(response.data.data.bookings);
      setTotalPages(response.data.data.pagination.pages);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, selectedStatus]);

  // Load bookings when dependencies change (using debounced search)
  useEffect(() => {
    loadBookings();
  }, [currentPage, debouncedSearchQuery, selectedStatus, loadBookings]);

  // Real-time updates handler
  const handleNewBooking = useCallback((notificationData) => {
    console.log('🔄 New booking notification received, refreshing...');
    // Only refresh if we're on the first page or if it's a new booking
    if (currentPage === 1) {
      loadBookings(false); // Silent refresh (no loading spinner)
      toast.success('New booking received!', { duration: 2000 });
    } else {
      // Show notification but don't auto-refresh if on other pages
      toast.success('New booking received! Click refresh to view.', { duration: 3000 });
    }
  }, [currentPage, loadBookings]);

  // Use real-time updates hook
  useRealtimeUpdates(handleNewBooking, null, null);

  // Highlight booking when navigating from notification
  useEffect(() => {
    if (highlightBookingId && bookings.length > 0) {
      const booking = bookings.find(b => b._id === highlightBookingId);
      if (booking && highlightedBookingRef.current) {
        highlightedBookingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (onBookingHighlighted) {
          setTimeout(() => { onBookingHighlighted(); }, 2000);
        }
      }
    }
  }, [highlightBookingId, bookings, onBookingHighlighted]);

  // Optimistic update handlers
  const handleUpdateStatus = async (bookingId, newStatus) => {
    // Optimistic update - update UI immediately
    setBookings(prev => prev.map(b => 
      b._id === bookingId ? { ...b, vendorStatus: newStatus } : b
    ));

    try {
      await adminAPI.updateBooking(bookingId, { status: newStatus });
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating booking status:', error);
      // Revert on error
      loadBookings(false);
      toast.error('Failed to update status');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    // Optimistic update
    setBookings(prev => prev.map(b => 
      b._id === bookingId ? { ...b, vendorStatus: 'CANCELLED' } : b
    ));

    try {
      await adminAPI.cancelBooking(bookingId, { reason: 'Cancelled by admin' });
      toast.success('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      loadBookings(false);
      toast.error('Failed to cancel booking');
    }
  };

  const handleAssignVendor = (booking) => {
    setSelectedBooking(booking);
    setShowVendorModal(true);
  };

  const handleVendorAssign = async (bookingId, vendorId) => {
    try {
      setAssigningVendor(true);
      await adminAPI.assignVendorToBooking(bookingId, { vendorId });
      toast.success('Vendor assigned successfully');
      loadBookings(false); // Silent refresh
      setShowVendorModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast.error('Failed to assign vendor');
    } finally {
      setAssigningVendor(false);
    }
  };

  const handleEditVendor = (booking) => {
    setEditingBooking(booking);
    setShowEditVendorModal(true);
  };

  const handleCloseEditVendorModal = () => {
    setShowEditVendorModal(false);
    setEditingBooking(null);
  };

  const handleViewBooking = (bookingId) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (booking) {
      setSelectedBookingForDetails(booking);
      setShowBookingDetails(true);
    }
  };

  const handleVendorChange = async (bookingId, vendorId) => {
    try {
      setAssigningVendor(true);
      await adminAPI.assignVendorToBooking(bookingId, { vendorId });
      toast.success('Vendor changed successfully!');
      loadBookings(false); // Silent refresh
      setShowEditVendorModal(false);
      setEditingBooking(null);
    } catch (error) {
      console.error('Error changing vendor:', error);
      toast.error('Failed to change vendor');
    } finally {
      setAssigningVendor(false);
    }
  };

  const handleGenerateOTP = async (bookingId) => {
    if (!window.confirm('Generate and send OTP to user?')) return;
    
    try {
      setGeneratingOTP(true);
      const response = await adminAPI.generateBookingOTP(bookingId);
      toast.success('OTP generated and sent to user successfully!');
      loadBookings(false);
    } catch (error) {
      console.error('Error generating OTP:', error);
      toast.error(error.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setGeneratingOTP(false);
    }
  };

  const handleProcessRefund = async (bookingId) => {
    if (!window.confirm('Are you sure you want to process refund for this booking? This will refund all payments made by the user.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.processBookingRefund(bookingId, {
        reason: 'Refund for cancelled booking'
      });
      toast.success('Refund processed successfully!');
      loadBookings(false); // Silent refresh
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVendorModal = () => {
    setShowVendorModal(false);
    setSelectedBooking(null);
  };

  const getStatusBadgeColor = (vendorStatus) => {
    switch (vendorStatus) {
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS': return 'bg-indigo-100 text-indigo-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (vendorStatus) => {
    switch (vendorStatus) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4" />;
      case 'ASSIGNED': return <UserPlus className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-sm sm:text-base text-gray-600">
            {lastFetchTime 
              ? `Last updated: ${new Date(lastFetchTime).toLocaleTimeString()}` 
              : 'Manage all bookings in the system'}
          </p>
        </div>
        <Button 
          onClick={() => loadBookings()} 
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2 w-full sm:w-auto text-xs sm:text-sm"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
          <span className="sm:hidden">{loading ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_PARTIAL_PAYMENT">Pending Payment</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="FULLY_PAID">Fully Paid</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('');
                setCurrentPage(1);
              }}
              className="w-full text-xs sm:text-sm"
              size="sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Loading bookings...</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-2 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr 
                    key={booking._id} 
                    ref={booking._id === highlightBookingId ? highlightedBookingRef : null}
                    className={`hover:bg-gray-50 ${
                      booking._id === highlightBookingId 
                        ? 'bg-yellow-50 border-2 border-yellow-400' 
                        : ''
                    }`}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          #{booking._id.slice(-8)}
                        </div>
                        {/* Verified Indicator */}
                        {booking.otpVerified && (
                          <Badge className="bg-green-100 text-green-800 flex items-center text-xs">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Verified</span>
                            <span className="sm:hidden">✓</span>
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{booking.userId?.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{booking.userId?.email}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {booking.packageId ? (
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">{booking.packageId.title}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[100px] sm:max-w-none">{booking.packageId.category}</div>
                        </div>
                      ) : booking.beatBloomId ? (
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">{booking.beatBloomId.title}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[100px] sm:max-w-none">Service - {booking.beatBloomId.category}</div>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-500 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        ₹{booking.totalAmount?.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        Paid: ₹{booking.amountPaid?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <Badge className={`${getStatusBadgeColor(booking.vendorStatus || 'Not Assigned')} text-xs`}>
                          <span className="flex items-center">
                            {getStatusIcon(booking.vendorStatus || 'Not Assigned')}
                            <span className="ml-1 truncate max-w-[80px] sm:max-w-none">{booking.vendorStatus || 'Not Assigned'}</span>
                          </span>
                        </Badge>
                        {/* Payment Status Badge */}
                        {booking.paymentStatus && (
                          <Badge className={
                            booking.paymentStatus === 'FULLY_PAID' ? 'bg-green-100 text-green-800' :
                            booking.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' :
                            booking.paymentStatus === 'PENDING_PAYMENT' ? 'bg-orange-100 text-orange-800' :
                            booking.paymentStatus === 'FAILED_PAYMENT' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            <span className="text-xs">
                              Payment: {booking.paymentStatus.replace(/_/g, ' ')}
                              {booking.onlinePaymentDone && ' (Online)'}
                            </span>
                          </Badge>
                        )}
                        {/* Refund Status Badge */}
                        {booking.refundStatus && booking.refundStatus !== 'NONE' && (
                          <Badge className={
                            booking.refundStatus === 'PROCESSED' ? 'bg-green-100 text-green-800' :
                            booking.refundStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            booking.refundStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            <span className="text-xs">
                              Refund: {booking.refundStatus}
                              {booking.refundAmount > 0 && ` (₹${booking.refundAmount.toLocaleString()})`}
                            </span>
                          </Badge>
                        )}
                        {/* Verification Status Badge */}
                        {booking.vendorStatus === 'COMPLETED' && booking.otpVerified && (
                          <Badge className="bg-green-100 text-green-800 text-xs flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            OTP Verified
                          </Badge>
                        )}
                        {booking.vendorStatus === 'COMPLETED' && !booking.otpVerified && booking.paymentStatus !== 'FULLY_PAID' && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Verification
                          </Badge>
                        )}
                        {booking.vendorStatus === 'COMPLETED' && booking.paymentStatus === 'FULLY_PAID' && booking.onlinePaymentDone && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Online Payment Done
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {booking.assignedVendorId ? (
                        <div className="text-xs sm:text-sm">
                          <div className="font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">
                            {booking.assignedVendorId.businessName || booking.assignedVendorId.name || 'Assigned Vendor'}
                          </div>
                          <div className="text-gray-500 truncate max-w-[100px] sm:max-w-none">
                            {booking.assignedVendorId.email || 'Vendor assigned'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-500 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {new Date(booking.eventDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex items-center flex-wrap gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => handleViewBooking(booking._id)}
                          title="View Booking Details"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 pointer-events-none" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditVendor(booking)}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                          title="Change Vendor"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        {!booking.assignedVendorId && 
                         booking.vendorStatus !== 'COMPLETED' && 
                         booking.vendorStatus !== 'CANCELLED' && 
                         booking.paymentStatus !== 'PENDING_PAYMENT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignVendor(booking)}
                            className="text-blue-600 hover:text-blue-700 text-xs"
                          >
                            <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                        {/* Generate OTP button - only show for COMPLETED bookings that are NOT fully paid online */}
                        {booking.vendorStatus === 'COMPLETED' && !booking.otpVerified && booking.paymentStatus !== 'FULLY_PAID' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateOTP(booking._id)}
                            disabled={generatingOTP}
                            className="text-green-600 hover:text-green-700 text-xs"
                            title="Generate OTP"
                          >
                            <span className="hidden sm:inline">{generatingOTP ? 'Generating...' : '🔐 Generate OTP'}</span>
                            <span className="sm:hidden">🔐</span>
                          </Button>
                        )}
                        {/* Show verified badge if OTP is verified */}
                        {booking.otpVerified && (
                          <Badge className="bg-green-100 text-green-800 flex items-center text-xs">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">✓ Verified</span>
                            <span className="sm:hidden">✓</span>
                          </Badge>
                        )}
                        {booking.vendorStatus !== 'COMPLETED' && booking.vendorStatus !== 'CANCELLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking._id)}
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                        {/* Refund button - only show for cancelled bookings that haven't been refunded */}
                        {booking.vendorStatus === 'CANCELLED' && 
                         booking.refundStatus !== 'PROCESSED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessRefund(booking._id)}
                            className="text-green-600 hover:text-green-700 text-xs"
                            title="Process Refund"
                          >
                            <span className="hidden sm:inline">💰 Refund</span>
                            <span className="sm:hidden">💰</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Vendor Assignment Modal */}
      <VendorAssignmentModal
        isOpen={showVendorModal}
        onClose={handleCloseVendorModal}
        booking={selectedBooking}
        onAssignmentSuccess={() => {
          loadBookings();
          setShowVendorModal(false);
          setSelectedBooking(null);
        }}
      />

      {/* Edit Vendor Modal */}
      <VendorAssignmentModal
        isOpen={showEditVendorModal}
        onClose={handleCloseEditVendorModal}
        booking={editingBooking}
        onAssignmentSuccess={() => {
          loadBookings();
          setShowEditVendorModal(false);
          setEditingBooking(null);
        }}
        isEditMode={true}
        currentVendor={editingBooking?.assignedVendorId}
      />

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBookingForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Booking Details #{selectedBookingForDetails._id.slice(-8)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBookingDetails(false);
                  setSelectedBookingForDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Booking Information */}
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Booking Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Event Date</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {new Date(selectedBookingForDetails.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Package className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Package</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {selectedBookingForDetails.packageId?.title || selectedBookingForDetails.beatBloomId?.title || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {selectedBookingForDetails.packageId?.category || selectedBookingForDetails.beatBloomId?.category || ''}
                      </p>
                    </div>
                  </div>
                  {selectedBookingForDetails.location && (
                    <div className="flex items-start space-x-3 sm:col-span-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Location</p>
                        <p className="text-sm sm:text-base font-medium text-gray-900">
                          {selectedBookingForDetails.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Payment Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Total Amount</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        ₹{selectedBookingForDetails.totalAmount?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Amount Paid</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        ₹{selectedBookingForDetails.amountPaid?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 sm:col-span-2">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Payment Status</p>
                      <Badge className={
                        selectedBookingForDetails.paymentStatus === 'FULLY_PAID' ? 'bg-green-100 text-green-800' :
                        selectedBookingForDetails.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' :
                        selectedBookingForDetails.paymentStatus === 'PENDING_PAYMENT' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {selectedBookingForDetails.paymentStatus?.replace(/_/g, ' ') || 'N/A'}
                        {selectedBookingForDetails.onlinePaymentDone && ' (Online)'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              {selectedBookingForDetails.userId && (
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Name</p>
                        <p className="text-sm sm:text-base font-medium text-gray-900">
                          {selectedBookingForDetails.userId.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Email</p>
                        <p className="text-sm sm:text-base font-medium text-gray-900 break-all">
                          {selectedBookingForDetails.userId.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {selectedBookingForDetails.userId.phone && (
                      <div className="flex items-start space-x-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                          <p className="text-sm sm:text-base font-medium text-gray-900">
                            {selectedBookingForDetails.userId.phone}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vendor Information */}
              {selectedBookingForDetails.assignedVendorId && (
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Vendor Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Business Name</p>
                        <p className="text-sm sm:text-base font-medium text-gray-900">
                          {selectedBookingForDetails.assignedVendorId.businessName || selectedBookingForDetails.assignedVendorId.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Email</p>
                        <p className="text-sm sm:text-base font-medium text-gray-900 break-all">
                          {selectedBookingForDetails.assignedVendorId.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Information */}
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Status Information</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusBadgeColor(selectedBookingForDetails.vendorStatus || 'Not Assigned')}>
                    <span className="flex items-center">
                      {getStatusIcon(selectedBookingForDetails.vendorStatus || 'Not Assigned')}
                      <span className="ml-1">{selectedBookingForDetails.vendorStatus || 'Not Assigned'}</span>
                    </span>
                  </Badge>
                  {selectedBookingForDetails.otpVerified && (
                    <Badge className="bg-green-100 text-green-800 flex items-center">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      OTP Verified
                    </Badge>
                  )}
                  {selectedBookingForDetails.refundStatus && selectedBookingForDetails.refundStatus !== 'NONE' && (
                    <Badge className={
                      selectedBookingForDetails.refundStatus === 'PROCESSED' ? 'bg-green-100 text-green-800' :
                      selectedBookingForDetails.refundStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      Refund: {selectedBookingForDetails.refundStatus}
                      {selectedBookingForDetails.refundAmount > 0 && ` (₹${selectedBookingForDetails.refundAmount.toLocaleString()})`}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Customization & Add-ons */}
              {selectedBookingForDetails.customization && (() => {
                let customizationData = null;
                
                // Parse customization JSON
                try {
                  const customStr = typeof selectedBookingForDetails.customization === 'string' 
                    ? selectedBookingForDetails.customization 
                    : JSON.stringify(selectedBookingForDetails.customization);
                  
                  if (customStr && customStr.trim() !== '') {
                    customizationData = JSON.parse(customStr);
                  } else {
                    return null;
                  }
                } catch (e) {
                  // If parsing fails, show fallback
                  return (
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Customization</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-700">
                          {typeof selectedBookingForDetails.customization === 'string' 
                            ? selectedBookingForDetails.customization.substring(0, 100) + (selectedBookingForDetails.customization.length > 100 ? '...' : '')
                            : 'Customization data available but could not be parsed'}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (!customizationData) {
                  return null;
                }

                const selectedCustomizations = customizationData.selectedCustomizations || {};
                const removedFeatures = customizationData.removedFeatures || [];
                const hasCustomizations = Object.keys(selectedCustomizations).length > 0;
                const hasRemovedFeatures = Array.isArray(removedFeatures) && removedFeatures.length > 0;

                if (!hasCustomizations && !hasRemovedFeatures) {
                  return null;
                }

                const formatPrice = (price) => {
                  return `₹${(price || 0).toLocaleString()}`;
                };

                return (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Customization & Add-ons</h4>
                    
                    {/* Selected Add-ons */}
                    {hasCustomizations && (
                      <div className="mb-4">
                        <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Selected Add-ons
                        </h5>
                        <div className="space-y-2">
                          {Object.values(selectedCustomizations).map((item, index) => (
                            <div 
                              key={index}
                              className="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-pink-600 font-bold text-xs sm:text-sm">+</span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{item.name || 'Add-on'}</p>
                                      {item.description && (
                                        <p className="text-xs text-gray-600 truncate">{item.description}</p>
                                      )}
                                      {item.quantity > 1 && (
                                        <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    {item.quantity > 1 ? `${item.quantity} × ${formatPrice(item.price)}` : formatPrice(item.price)}
                                  </p>
                                  <p className="font-bold text-pink-600 text-xs sm:text-sm">
                                    {formatPrice((item.price || 0) * (item.quantity || 1))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Removed Features */}
                    {hasRemovedFeatures && (
                      <div>
                        <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                          Removed Features
                        </h5>
                        <div className="space-y-2">
                          {removedFeatures.map((feature, index) => (
                            <div 
                              key={index}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 opacity-75"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-gray-500 font-bold text-xs sm:text-sm">−</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-600 line-through text-xs sm:text-sm truncate">{feature.name || 'Feature'}</p>
                                    {feature.price > 0 && (
                                      <p className="text-xs text-gray-500">Saved: {formatPrice(feature.price)}</p>
                                    )}
                                  </div>
                                </div>
                                {feature.price > 0 && (
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="text-xs sm:text-sm font-semibold text-green-600">
                                      -{formatPrice(feature.price)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(BookingManagement);

