import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Eye, Edit, CheckCircle, XCircle, Clock, UserPlus, ShieldCheck } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';
import VendorAssignmentModal from './VendorAssignmentModal';

const BookingManagement = () => {
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

  useEffect(() => {
    loadBookings();
  }, [currentPage, searchQuery, selectedStatus]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchQuery && { q: searchQuery }),
        ...(selectedStatus && { status: selectedStatus })
      };
      
      const response = await adminAPI.getBookings(params);
      setBookings(response.data.data.bookings);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await adminAPI.updateBooking(bookingId, { status: newStatus });
      loadBookings(); // Reload bookings
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await adminAPI.cancelBooking(bookingId, { reason: 'Cancelled by admin' });
        loadBookings(); // Reload bookings
      } catch (error) {
        console.error('Error cancelling booking:', error);
      }
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
      loadBookings(); // Reload bookings
      setShowVendorModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error assigning vendor:', error);
      alert('Failed to assign vendor. Please try again.');
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
      loadBookings(); // Reload bookings
      setShowEditVendorModal(false);
      setEditingBooking(null);
      alert('Vendor changed successfully!');
    } catch (error) {
      console.error('Error changing vendor:', error);
      alert('Failed to change vendor. Please try again.');
    } finally {
      setAssigningVendor(false);
    }
  };

  const handleGenerateOTP = async (bookingId) => {
    if (!window.confirm('Generate and send OTP to user?')) return;
    
    try {
      setGeneratingOTP(true);
      const response = await adminAPI.generateBookingOTP(bookingId);
      alert('OTP generated and sent to user successfully!');
      loadBookings();
    } catch (error) {
      console.error('Error generating OTP:', error);
      alert(error.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setGeneratingOTP(false);
    }
  };

  const handleCloseVendorModal = () => {
    setShowVendorModal(false);
    setSelectedBooking(null);
  };

  const testRoute = async () => {
    try {
      console.log('🧪 Testing route...');
      const response = await adminAPI.testAssign();
      console.log('✅ Test route response:', response);
    } catch (error) {
      console.error('❌ Test route error:', error);
    }
  };

  const simpleTest = async () => {
    try {
      console.log('🧪 Simple test...');
      const response = await adminAPI.simpleTest();
      console.log('✅ Simple test response:', response);
    } catch (error) {
      console.error('❌ Simple test error:', error);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING_PARTIAL_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800';
      case 'FULLY_PAID': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-indigo-100 text-indigo-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600">Manage all bookings in the system</p>
        </div>
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
              onClick={loadBookings}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
            
            <Button
              variant="outline"
              onClick={testRoute}
              className="w-full mt-2"
            >
              🧪 Test Route
            </Button>
            
            <Button
              variant="outline"
              onClick={simpleTest}
              className="w-full mt-2"
            >
              🧪 Simple Test
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
                  <tr key={booking._id} className="hover:bg-gray-50">
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
                      <div className="text-sm font-medium text-gray-900">{booking.packageId?.title}</div>
                      <div className="text-sm text-gray-500">{booking.packageId?.category}</div>
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
                        <Badge className={getStatusBadgeColor(booking.status)}>
                          <span className="flex items-center">
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{booking.status}</span>
                          </span>
                        </Badge>
                        {/* Verification Status Badge */}
                        {booking.status === 'COMPLETED' && booking.otpVerified && (
                          <Badge className="bg-green-100 text-green-800 text-xs flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            OTP Verified
                          </Badge>
                        )}
                        {booking.status === 'COMPLETED' && !booking.otpVerified && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Verification
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
                        {!booking.assignedVendorId && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignVendor(booking)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        )}
                        {/* Generate OTP button - only show for COMPLETED bookings */}
                        {booking.status === 'COMPLETED' && !booking.otpVerified && (
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
                        {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
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

export default BookingManagement;

