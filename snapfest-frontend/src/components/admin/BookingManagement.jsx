import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Search, Filter, Eye, Edit, CheckCircle, XCircle, Clock, UserPlus, ShieldCheck, RefreshCw } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600">
            {lastFetchTime 
              ? `Last updated: ${new Date(lastFetchTime).toLocaleTimeString()}` 
              : 'Manage all bookings in the system'}
          </p>
        </div>
        <Button 
          onClick={() => loadBookings()} 
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('');
                setCurrentPage(1);
              }}
              className="w-full"
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
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-900">
                          #{booking._id.slice(-8)}
                        </div>
                        {/* Verified Indicator */}
                        {booking.otpVerified && (
                          <Badge className="bg-green-100 text-green-800 flex items-center">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.userId?.name}</div>
                      <div className="text-sm text-gray-500">{booking.userId?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.packageId ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.packageId.title}</div>
                          <div className="text-sm text-gray-500">{booking.packageId.category}</div>
                        </div>
                      ) : booking.beatBloomId ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.beatBloomId.title}</div>
                          <div className="text-sm text-gray-500">Service - {booking.beatBloomId.category}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{booking.totalAmount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Paid: ₹{booking.amountPaid?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <Badge className={getStatusBadgeColor(booking.vendorStatus || 'Not Assigned')}>
                          <span className="flex items-center">
                            {getStatusIcon(booking.vendorStatus || 'Not Assigned')}
                            <span className="ml-1">{booking.vendorStatus || 'Not Assigned'}</span>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.assignedVendorId ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {booking.assignedVendorId.businessName || booking.assignedVendorId.name || 'Assigned Vendor'}
                          </div>
                          <div className="text-gray-500">
                            {booking.assignedVendorId.email || 'Vendor assigned'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.eventDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditVendor(booking)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Change Vendor"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!booking.assignedVendorId && 
                         booking.vendorStatus !== 'COMPLETED' && 
                         booking.vendorStatus !== 'CANCELLED' && 
                         booking.paymentStatus !== 'PENDING_PAYMENT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignVendor(booking)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        )}
                        {/* Generate OTP button - only show for COMPLETED bookings that are NOT fully paid online */}
                        {booking.vendorStatus === 'COMPLETED' && !booking.otpVerified && booking.paymentStatus !== 'FULLY_PAID' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateOTP(booking._id)}
                            disabled={generatingOTP}
                            className="text-green-600 hover:text-green-700"
                            title="Generate OTP"
                          >
                            {generatingOTP ? 'Generating...' : '🔐 Generate OTP'}
                          </Button>
                        )}
                        {/* Show verified badge if OTP is verified */}
                        {booking.otpVerified && (
                          <Badge className="bg-green-100 text-green-800 flex items-center">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            ✓ Verified
                          </Badge>
                        )}
                        {booking.vendorStatus !== 'COMPLETED' && booking.vendorStatus !== 'CANCELLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {/* Refund button - only show for cancelled bookings that haven't been refunded */}
                        {booking.vendorStatus === 'CANCELLED' && 
                         booking.refundStatus !== 'PROCESSED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessRefund(booking._id)}
                            className="text-green-600 hover:text-green-700"
                            title="Process Refund"
                          >
                            💰 Refund
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
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
    </div>
  );
};

export default React.memo(BookingManagement);

