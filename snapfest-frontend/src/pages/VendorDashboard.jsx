import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Camera,
  Settings,
  LogOut,
  Shield,
  CheckCircle,
  Clock,
  User,
  UserCheck,
  Key,
  Search,
  Filter
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { vendorAPI } from '../services/api';
import VendorStatsCard from '../components/vendor/VendorStatsCard';
import OTPVerification from '../components/vendor/OTPVerification';
import VendorBookingCard from '../components/vendor/VendorBookingCard';
import ModalPortal from '../components/modals/ModalPortal';
import { Card, Button, Badge } from '../components/ui';

const VendorDashboard = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  
  // Create logout function for compatibility
  const logout = async () => {
    await signOut();
    window.location.href = '/sign-in';
  };
  const [dashboardData, setDashboardData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [pendingOTPs, setPendingOTPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showBookingOTPModal, setShowBookingOTPModal] = useState(false);
  const [selectedBookingForOTP, setSelectedBookingForOTP] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  
  // Filter state
  const [bookingFilter, setBookingFilter] = useState('all'); // 'all', 'assigned', 'pending', 'in_progress', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load dashboard stats
        const dashboardResponse = await vendorAPI.getDashboard();
        setDashboardData(dashboardResponse.data.data.dashboard);
        
        // Load bookings (backend will prioritize assigned bookings)
        const bookingsResponse = await vendorAPI.getBookings({ limit: 10 });
        setBookings(bookingsResponse.data.data.bookings || []);
        
        // Load pending OTPs
        const otpsResponse = await vendorAPI.getPendingOTPs();
        setPendingOTPs(otpsResponse.data.data.bookings || []);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err.message);
        // Don't use dummy data - just leave as empty arrays
        // This prevents showing incorrect data when there's an error
        setDashboardData(null);
        setBookings([]);
        setPendingOTPs([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleAcceptBooking = async (bookingId, data) => {
    try {
      await vendorAPI.acceptBooking(bookingId);
      // Refresh bookings
      const response = await vendorAPI.getBookings({ limit: 10 });
      setBookings(response.data.data.bookings);
    } catch (err) {
      console.error('Error accepting booking:', err);
    }
  };

  const handleRejectBooking = async (bookingId, data) => {
    try {
      await vendorAPI.rejectBooking(bookingId, { reason: data.reason });
      // Refresh bookings
      const response = await vendorAPI.getBookings({ limit: 10 });
      setBookings(response.data.data.bookings);
    } catch (err) {
      console.error('Error rejecting booking:', err);
    }
  };

  const handleStartBooking = async (bookingId, data) => {
    try {
      await vendorAPI.startBooking(bookingId);
      // Refresh bookings
      const response = await vendorAPI.getBookings({ limit: 10 });
      setBookings(response.data.data.bookings);
    } catch (err) {
      console.error('Error starting booking:', err);
    }
  };

  const handleCompleteBooking = async (bookingId, data) => {
    try {
      await vendorAPI.completeBooking(bookingId, data);
      // Refresh bookings
      const response = await vendorAPI.getBookings({ limit: 10 });
      setBookings(response.data.data.bookings);
    } catch (err) {
      console.error('Error completing booking:', err);
    }
  };

  const handleCancelBooking = async (bookingId, data) => {
    try {
      await vendorAPI.cancelBooking(bookingId);
      // Refresh bookings
      const response = await vendorAPI.getBookings({ limit: 10 });
      setBookings(response.data.data.bookings);
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  const handleOTPVerified = (otpData) => {
    console.log('OTP verified:', otpData);
    setShowOTPModal(false);
    // Refresh data
    window.location.reload();
  };
  
  // Filter bookings function
  const getFilteredBookings = () => {
    let filtered = bookings || [];
    
    // Filter by status
    if (bookingFilter !== 'all') {
      if (bookingFilter === 'assigned') {
        filtered = filtered.filter(b => b.assignedVendorId);
      } else {
        filtered = filtered.filter(b => {
          const status = b.vendorStatus || (b.assignedVendorId ? 'ASSIGNED' : null);
          return status === bookingFilter.toUpperCase();
        });
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.packageId?.title?.toLowerCase().includes(query) ||
        b.location?.toLowerCase().includes(query) ||
        b._id?.toLowerCase().includes(query) ||
        b.customerId?.name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };
  
  // View booking details handler
  const handleViewDetails = (booking) => {
    setSelectedBookingDetails(booking);
    setShowBookingDetails(true);
  };

  const handleOTPError = (error) => {
    console.error('OTP verification error:', error);
  };

  const handleVerifyBookingOTP = async (booking) => {
    setSelectedBookingForOTP(booking);
    setShowBookingOTPModal(true);
    setOtpCode('');
  };

  const handleOTPSubmit = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    if (!selectedBookingForOTP) {
      alert('No booking selected');
      return;
    }

    try {
      setVerifyingOTP(true);
      await vendorAPI.verifyBookingOTP(selectedBookingForOTP._id, { otp: otpCode });
      alert('OTP verified successfully! Booking is now verified.');
      setShowBookingOTPModal(false);
      setOtpCode('');
      setSelectedBookingForOTP(null);
      // Refresh bookings
      const response = await vendorAPI.getBookings({ limit: 10 });
      setBookings(response.data.data.bookings || []);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert(error.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  const stats = [
    {
      title: 'Total Bookings',
      value: dashboardData?.totalBookings || 0,
      icon: <Calendar className="w-6 h-6 text-primary-600" />,
      change: '+3 this week',
      changeType: 'positive',
      description: 'All time bookings',
      trend: 'up'
    },
    {
      title: 'Pending Bookings',
      value: dashboardData?.pendingBookings || 0,
      icon: <Clock className="w-6 h-6 text-yellow-600" />,
      change: 'Requires attention',
      changeType: 'neutral',
      description: 'Awaiting action',
      trend: 'neutral'
    },
    {
      title: 'Total Earnings',
      value: `₹${(dashboardData?.totalEarnings || 0).toLocaleString()}`,
      icon: <CreditCard className="w-6 h-6 text-green-600" />,
      change: '+₹15,000 this month',
      changeType: 'positive',
      description: 'Lifetime earnings',
      trend: 'up'
    },
    {
      title: 'Average Rating',
      value: dashboardData?.averageRating || 0,
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
      change: 'Based on 12 reviews',
      changeType: 'positive',
      description: 'Customer satisfaction',
      trend: 'up'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name || 'Vendor'}!
              </h1>
              <p className="text-gray-600">
                Manage your bookings and earnings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/vendor/profile">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link to="/vendor/bookings">
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Bookings
                </Button>
              </Link>
              <Link to="/vendor/earnings">
                <Button variant="outline" size="sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Earnings
                </Button>
              </Link>
              <Link to="/vendor/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <VendorStatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              change={stat.change}
              changeType={stat.changeType}
              description={stat.description}
              trend={stat.trend}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending OTPs Alert */}
            {pendingOTPs && pendingOTPs.length > 0 && (
              <Card className="p-6 border-yellow-200 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-6 h-6 text-yellow-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-yellow-900">
                        {pendingOTPs?.length || 0} Pending OTP Verification{(pendingOTPs?.length || 0) > 1 ? 's' : ''}
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Customer payments are waiting for OTP verification
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowOTPModal(true)}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verify OTPs
                  </Button>
                </div>
              </Card>
            )}

            {/* Unified Bookings Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">All Bookings</h2>
                  <p className="text-sm text-gray-600">Manage all your bookings in one place</p>
                </div>
                <Link to="/vendor/bookings">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {/* Filters Section */}
              <div className="mb-6 space-y-4">
                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
                  <button
                    onClick={() => setBookingFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      bookingFilter === 'all'
                        ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    All ({bookings?.length || 0})
                  </button>
                  <button
                    onClick={() => setBookingFilter('assigned')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      bookingFilter === 'assigned'
                        ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Assigned ({bookings?.filter(b => b.assignedVendorId)?.length || 0})
                  </button>
                  <button
                    onClick={() => setBookingFilter('pending')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      bookingFilter === 'pending'
                        ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Pending ({bookings?.filter(b => !b.vendorStatus || b.vendorStatus === 'PENDING')?.length || 0})
                  </button>
                  <button
                    onClick={() => setBookingFilter('in_progress')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      bookingFilter === 'in_progress'
                        ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    In Progress ({bookings?.filter(b => b.vendorStatus === 'IN_PROGRESS')?.length || 0})
                  </button>
                  <button
                    onClick={() => setBookingFilter('completed')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      bookingFilter === 'completed'
                        ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Completed ({bookings?.filter(b => b.vendorStatus === 'COMPLETED')?.length || 0})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookings by package, location, or booking ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Assigned Bookings Alert */}
              {bookingFilter === 'all' && bookings?.some(booking => booking.assignedVendorId) && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <UserCheck className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      You have {bookings.filter(booking => booking.assignedVendorId).length} assigned booking(s) - these appear first
                    </span>
                  </div>
                </div>
              )}

              {/* Bookings List */}
              {!bookings || bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No bookings yet</p>
                  <p className="text-sm text-gray-500">Your bookings will appear here</p>
                </div>
              ) : getFilteredBookings().length === 0 ? (
                <div className="text-center py-8">
                  <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No bookings match your filters</p>
                  <Button variant="outline" size="sm" onClick={() => { setBookingFilter('all'); setSearchQuery(''); }}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredBookings().map((booking) => (
                    <div key={booking._id} className="relative">
                      {/* Assigned Badge */}
                      {booking.assignedVendorId && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Assigned
                          </Badge>
                        </div>
                      )}
                      
                      <VendorBookingCard
                        booking={booking}
                        onAccept={handleAcceptBooking}
                        onReject={handleRejectBooking}
                        onStart={handleStartBooking}
                        onComplete={handleCompleteBooking}
                        onCancel={handleCancelBooking}
                        onViewDetails={handleViewDetails}
                        onMessageCustomer={(booking) => {
                          console.log('Message customer for:', booking._id);
                        }}
                      />
                      
                      {/* Verify OTP button for COMPLETED bookings */}
                      {booking.vendorStatus === 'COMPLETED' && !booking.otpVerified && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            onClick={() => handleVerifyBookingOTP(booking)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Verify Booking OTP
                          </Button>
                        </div>
                      )}
                      
                      {/* Show verified badge */}
                      {booking.vendorStatus === 'COMPLETED' && booking.otpVerified && (
                        <div className="mt-2 flex justify-end">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Tips & Guidelines */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips & Guidelines</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">OTP Verification</h4>
                  <p className="text-sm text-blue-700">
                    Always verify customer OTPs before starting photography sessions to ensure payment confirmation.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-1">Quality Standards</h4>
                  <p className="text-sm text-green-700">
                    Maintain high quality standards and deliver photos within 48 hours of the event.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-1">Communication</h4>
                  <p className="text-sm text-yellow-700">
                    Keep customers informed about event progress and any changes in schedule.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">OTP Verification</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOTPModal(false)}
                >
                  ×
                </Button>
              </div>
              <OTPVerification
                bookingId={pendingOTPs?.[0]?.bookingId}
                onVerified={handleOTPVerified}
                onError={handleOTPError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Booking OTP Verification Modal */}
      <ModalPortal isOpen={showBookingOTPModal}>
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Verify Booking OTP</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowBookingOTPModal(false);
                setOtpCode('');
                setSelectedBookingForOTP(null);
              }}
            >
              ×
            </Button>
          </div>
          
          {selectedBookingForOTP && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Enter the OTP provided by the customer for booking #{selectedBookingForOTP._id.slice(-8)}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Details
                </label>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p><strong>Package:</strong> {selectedBookingForOTP.packageId?.title || 'N/A'}</p>
                  <p><strong>Date:</strong> {new Date(selectedBookingForOTP.eventDate).toLocaleDateString()}</p>
                  <p><strong>Location:</strong> {selectedBookingForOTP.location || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleOTPSubmit}
                  disabled={verifyingOTP || otpCode.length !== 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {verifyingOTP ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBookingOTPModal(false);
                    setOtpCode('');
                    setSelectedBookingForOTP(null);
                  }}
                  disabled={verifyingOTP}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </ModalPortal>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBookingDetails && (
        <ModalPortal isOpen={showBookingDetails}>
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Booking Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBookingDetails(false);
                  setSelectedBookingDetails(null);
                }}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Event Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Date:</strong> {new Date(selectedBookingDetails.eventDate).toLocaleDateString()}</p>
                    <p><strong>Location:</strong> {selectedBookingDetails.location}</p>
                    <p><strong>Package:</strong> {selectedBookingDetails.packageId?.title}</p>
                    <p><strong>Category:</strong> {selectedBookingDetails.packageId?.category}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total Amount:</strong> ₹{selectedBookingDetails.totalAmount?.toLocaleString()}</p>
                    <p><strong>Amount Paid:</strong> ₹{selectedBookingDetails.amountPaid?.toLocaleString()}</p>
                    <p><strong>Status:</strong> <Badge>{selectedBookingDetails.status}</Badge></p>
                    <p><strong>Vendor Status:</strong> <Badge>{selectedBookingDetails.vendorStatus || 'N/A'}</Badge></p>
                  </div>
                </div>
              </div>
              
              {selectedBookingDetails.customization && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Customization</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {typeof selectedBookingDetails.customization === 'string' 
                        ? selectedBookingDetails.customization 
                        : JSON.stringify(selectedBookingDetails.customization, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default VendorDashboard;
