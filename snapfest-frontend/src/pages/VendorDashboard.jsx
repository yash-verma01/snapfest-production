import React, { useState, useEffect, useMemo } from 'react';
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
  Filter,
  Package,
  Sparkles,
  X,
  Plus
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { vendorAPI } from '../services/api';
import VendorStatsCard from '../components/vendor/VendorStatsCard';
import OTPVerification from '../components/vendor/OTPVerification';
import VendorBookingCard from '../components/vendor/VendorBookingCard';
import ModalPortal from '../components/modals/ModalPortal';
import NotificationBell from '../components/NotificationBell';
import VendorNotificationManagement from '../components/vendor/VendorNotificationManagement';
import { Card, Button, Badge } from '../components/ui';
import { GlassCard, ScrollReveal } from '../components/enhanced';

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
  const [showNotifications, setShowNotifications] = useState(false);

  // Navigation handler for notifications
  const handleNotificationNavigation = (tab) => {
    if (tab === 'notifications') {
      setShowNotifications(true);
    }
  };

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
  
  // Memoize filtered bookings to avoid recalculating on every render
  const filteredBookings = useMemo(() => {
    let filtered = bookings || [];
    
    // Filter by status
    if (bookingFilter !== 'all') {
      if (bookingFilter === 'assigned') {
        // Show bookings that have been accepted by vendor (IN_PROGRESS or COMPLETED)
        filtered = filtered.filter(b => 
          b.vendorStatus === 'IN_PROGRESS' || b.vendorStatus === 'COMPLETED'
        );
      } else if (bookingFilter === 'pending') {
        // Show new bookings that haven't been accepted yet (ASSIGNED or null)
        filtered = filtered.filter(b => 
          b.vendorStatus === 'ASSIGNED' || b.vendorStatus === null
        );
      } else if (bookingFilter === 'in_progress') {
        filtered = filtered.filter(b => b.vendorStatus === 'IN_PROGRESS');
      } else if (bookingFilter === 'completed') {
        filtered = filtered.filter(b => b.vendorStatus === 'COMPLETED');
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.packageId?.title?.toLowerCase().includes(query) ||
        b.beatBloomId?.title?.toLowerCase().includes(query) ||
        b.location?.toLowerCase().includes(query) ||
        b._id?.toLowerCase().includes(query) ||
        b.userId?.name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [bookings, bookingFilter, searchQuery]);
  
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
    }
    // Temporarily hidden - Average Rating
    // {
    //   title: 'Average Rating',
    //   value: dashboardData?.averageRating || 0,
    //   icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
    //   change: 'Based on 12 reviews',
    //   changeType: 'positive',
    //   description: 'Customer satisfaction',
    //   trend: 'up'
    // }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      {/* Enhanced Header */}
      <ScrollReveal direction="down">
        <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                  Welcome back, {user?.name || 'Vendor'}!
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Manage your bookings and earnings
                </p>
              </div>
            <div className="flex items-center flex-wrap gap-2 sm:gap-4">
              <NotificationBell 
                userRole="vendor" 
                onNavigate={handleNotificationNavigation}
              />
              <Link to="/vendor/profile">
                <Button variant="outline" size="sm" title="Profile">
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
              <Link to="/vendor/bookings">
                <Button variant="outline" size="sm" title="Bookings">
                  <Calendar className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Bookings</span>
                </Button>
              </Link>
              {/* Temporarily hidden - Earnings button */}
              {/* <Link to="/vendor/earnings">
                <Button variant="outline" size="sm" title="Earnings">
                  <CreditCard className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Earnings</span>
                </Button>
              </Link> */}
              {/* Temporarily hidden - Settings button */}
              {/* <Link to="/vendor/settings">
                <Button variant="outline" size="sm" title="Settings">
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link> */}
              <Button variant="outline" size="sm" onClick={logout} title="Logout">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
        </div>
      </ScrollReveal>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show Notifications Section if requested */}
        {showNotifications ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowNotifications(false)}
                className="w-full sm:w-auto"
              >
                ← Back to Dashboard
              </Button>
            </div>
            <VendorNotificationManagement />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending OTPs Alert */}
            {pendingOTPs && pendingOTPs.length > 0 && (
              <ScrollReveal direction="up" delay={0.1}>
                <GlassCard className="p-4 sm:p-6 border-yellow-200 bg-yellow-50/80 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 text-sm sm:text-base">
                        {pendingOTPs?.length || 0} Pending OTP Verification{(pendingOTPs?.length || 0) > 1 ? 's' : ''}
                      </h3>
                      <p className="text-xs sm:text-sm text-yellow-700">
                        Customer payments are waiting for OTP verification
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowOTPModal(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verify OTPs
                  </Button>
                </div>
              </GlassCard>
              </ScrollReveal>
            )}

            {/* Unified Bookings Section */}
            <ScrollReveal direction="up" delay={0.2}>
              <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">All Bookings</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Manage all your bookings in one place</p>
                </div>
                <Link to="/vendor/bookings">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    View All
                  </Button>
                </Link>
              </div>

              {/* Filters Section */}
              <div className="mb-4 sm:mb-6 space-y-4">
                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                  <button
                    onClick={() => setBookingFilter('all')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                      bookingFilter === 'all'
                        ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    All ({bookings?.length || 0})
                  </button>
                  <button
                    onClick={() => setBookingFilter('assigned')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                      bookingFilter === 'assigned'
                        ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Assigned ({bookings?.filter(b => b.vendorStatus === 'IN_PROGRESS' || b.vendorStatus === 'COMPLETED')?.length || 0})
                  </button>
                  <button
                    onClick={() => setBookingFilter('pending')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                      bookingFilter === 'pending'
                        ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Pending ({bookings?.filter(b => b.vendorStatus === 'ASSIGNED' || b.vendorStatus === null)?.length || 0})
                  </button>
                  <button
                    onClick={() => setBookingFilter('in_progress')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                      bookingFilter === 'in_progress'
                        ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    In Progress ({bookings?.filter(b => b.vendorStatus === 'IN_PROGRESS')?.length || 0})
                  </button>
                  <button
                    onClick={() => setBookingFilter('completed')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
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
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Assigned Bookings Alert */}
              {bookingFilter === 'all' && bookings?.some(booking => booking.assignedVendorId) && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <UserCheck className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-green-800">
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
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No bookings match your filters</p>
                  <Button variant="outline" size="sm" onClick={() => { setBookingFilter('all'); setSearchQuery(''); }}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
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
            </GlassCard>
          </ScrollReveal>

          {/* Sidebar */}
          <div className="space-y-6 sm:space-y-8">
            {/* Tips & Guidelines */}
            <GlassCard className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Tips & Guidelines</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1 text-sm sm:text-base">OTP Verification</h4>
                  <p className="text-xs sm:text-sm text-blue-700">
                    Always verify customer OTPs before starting photography sessions to ensure payment confirmation.
                  </p>
                </div>
                
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-1 text-sm sm:text-base">Quality Standards</h4>
                  <p className="text-xs sm:text-sm text-green-700">
                    Maintain high quality standards and deliver photos within 48 hours of the event.
                  </p>
                </div>
                
                <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-1 text-sm sm:text-base">Communication</h4>
                  <p className="text-xs sm:text-sm text-yellow-700">
                    Keep customers informed about event progress and any changes in schedule.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
        </div>
          </>
        )}
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">OTP Verification</h3>
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
        <div className="bg-white p-4 sm:p-6 rounded-lg max-w-md w-full mx-2 sm:mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold">Verify Booking OTP</h3>
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
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Enter the OTP provided by the customer for booking #{selectedBookingForOTP._id.slice(-8)}
              </p>
              
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Booking Details
                </label>
                <div className="bg-gray-50 p-3 rounded-lg text-xs sm:text-sm">
                  <p><strong>Package:</strong> {selectedBookingForOTP.packageId?.title || 'N/A'}</p>
                  <p><strong>Date:</strong> {new Date(selectedBookingForOTP.eventDate).toLocaleDateString()}</p>
                  <p><strong>Location:</strong> {selectedBookingForOTP.location || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 border rounded-lg text-center text-xl sm:text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
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
                  className="w-full sm:w-auto"
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
          <div className="bg-white p-4 sm:p-6 rounded-lg max-w-4xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Booking Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBookingDetails(false);
                  setSelectedBookingDetails(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Booking Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Details */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-5 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-base sm:text-lg">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Event Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-24 flex-shrink-0">Date:</span>
                      <span className="text-gray-900">{new Date(selectedBookingDetails.eventDate).toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-24 flex-shrink-0">Time:</span>
                      <span className="text-gray-900">{new Date(selectedBookingDetails.eventDate).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-24 flex-shrink-0">Location:</span>
                      <span className="text-gray-900 break-words">{selectedBookingDetails.location}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-24 flex-shrink-0">Guests:</span>
                      <span className="text-gray-900">{selectedBookingDetails.guests || 1} {selectedBookingDetails.guests === 1 ? 'guest' : 'guests'}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 sm:p-5 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-base sm:text-lg">
                    <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                    Payment Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Amount:</span>
                      <span className="text-lg font-bold text-green-700">₹{selectedBookingDetails.totalAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Amount Paid:</span>
                      <span className="text-lg font-bold text-green-600">₹{selectedBookingDetails.amountPaid?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Remaining:</span>
                      <span className="text-lg font-bold text-gray-900">₹{((selectedBookingDetails.totalAmount || 0) - (selectedBookingDetails.amountPaid || 0)).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-green-300">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Payment Status:</span>
                        <Badge className={selectedBookingDetails.paymentStatus === 'FULLY_PAID' ? 'bg-green-500' : selectedBookingDetails.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-500' : 'bg-red-500'}>
                          {selectedBookingDetails.paymentStatus?.replace('_', ' ') || 'PENDING'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-medium text-gray-700">Vendor Status:</span>
                        <Badge className={selectedBookingDetails.vendorStatus === 'COMPLETED' ? 'bg-green-500' : selectedBookingDetails.vendorStatus === 'IN_PROGRESS' ? 'bg-blue-500' : selectedBookingDetails.vendorStatus === 'CANCELLED' ? 'bg-red-500' : 'bg-yellow-500'}>
                          {selectedBookingDetails.vendorStatus || 'ASSIGNED'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Information */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 sm:p-5 border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-base sm:text-lg">
                  <Package className="w-5 h-5 mr-2 text-purple-600" />
                  Package Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Package Name:</span>
                    <p className="text-gray-900 font-semibold mt-1">{selectedBookingDetails.packageId?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <p className="text-gray-900 font-semibold mt-1">{selectedBookingDetails.packageId?.category || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="text-gray-900 mt-1">{selectedBookingDetails.packageId?.description || 'No description available'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Base Price:</span>
                    <p className="text-gray-900 font-semibold mt-1">₹{selectedBookingDetails.packageId?.basePrice?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Per Guest Price:</span>
                    <p className="text-gray-900 font-semibold mt-1">₹{selectedBookingDetails.packageId?.perGuestPrice?.toLocaleString() || '0'}</p>
                  </div>
                </div>

                {/* Package Included Features */}
                {selectedBookingDetails.packageId?.includedFeatures && selectedBookingDetails.packageId.includedFeatures.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-300">
                    <h5 className="font-medium text-gray-700 mb-3">Package Includes:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedBookingDetails.packageId.includedFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-white rounded-lg p-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature.name}</span>
                          {feature.price > 0 && (
                            <span className="text-xs text-gray-500 ml-auto">₹{feature.price.toLocaleString()}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Information */}
              {selectedBookingDetails.userId && (
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 sm:p-5 border border-pink-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-base sm:text-lg">
                    <User className="w-5 h-5 mr-2 text-pink-600" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <p className="text-gray-900 font-semibold mt-1">{selectedBookingDetails.userId.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <p className="text-gray-900 mt-1 break-words">{selectedBookingDetails.userId.email || 'N/A'}</p>
                    </div>
                    {selectedBookingDetails.userId.phone && (
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>
                        <p className="text-gray-900 mt-1">{selectedBookingDetails.userId.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customization & Add-ons */}
              {selectedBookingDetails.customization && (() => {
                let customizationData = null;
                
                // Parse customization JSON
                try {
                  const customStr = typeof selectedBookingDetails.customization === 'string' 
                    ? selectedBookingDetails.customization 
                    : JSON.stringify(selectedBookingDetails.customization);
                  
                  if (customStr && customStr.trim() !== '') {
                    customizationData = JSON.parse(customStr);
                  } else {
                    return null;
                  }
                } catch (e) {
                  // If parsing fails, show fallback
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Customization</h4>
                      <p className="text-sm text-gray-700">
                        Customization data is available but could not be parsed. Please contact support.
                      </p>
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
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 sm:p-5 border border-orange-200">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-base sm:text-lg">
                      <Sparkles className="w-5 h-5 mr-2 text-orange-600" />
                      Customization & Add-ons
                    </h4>
                    
                    {/* Selected Add-ons */}
                    {hasCustomizations && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Selected Add-ons
                        </h5>
                        <div className="space-y-3">
                          {Object.values(selectedCustomizations).map((item, index) => {
                            const itemPrice = (item.price || 0) + (item.optionPriceModifier || 0);
                            const totalPrice = itemPrice * (item.quantity || 1);
                            
                            return (
                              <div 
                                key={index}
                                className="bg-white border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Plus className="w-5 h-5 text-orange-600" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{item.name || 'Add-on'}</p>
                                        {item.selectedOption && (
                                          <p className="text-xs text-gray-600 mt-1">
                                            <span className="font-medium">Option:</span> {item.selectedOption}
                                          </p>
                                        )}
                                        {item.quantity > 1 && (
                                          <p className="text-xs text-gray-600 mt-1">
                                            <span className="font-medium">Quantity:</span> {item.quantity}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-xs text-gray-600 mb-1">
                                      {item.quantity > 1 
                                        ? `${item.quantity} × ${formatPrice(itemPrice)}` 
                                        : formatPrice(itemPrice)
                                      }
                                      {item.optionPriceModifier !== 0 && (
                                        <span className="text-gray-500 ml-1">
                                          ({item.price > 0 ? '+' : ''}{formatPrice(item.optionPriceModifier)})
                                        </span>
                                      )}
                                    </p>
                                    <p className="font-bold text-orange-600 text-base">
                                      {formatPrice(totalPrice)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Removed Features */}
                    {hasRemovedFeatures && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Removed Features
                        </h5>
                        <div className="space-y-2">
                          {removedFeatures.map((feature, index) => (
                            <div 
                              key={index}
                              className="bg-white border border-red-200 rounded-lg p-3 flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2">
                                <X className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-gray-700">{feature.name || 'Feature'}</span>
                              </div>
                              {feature.price > 0 && (
                                <span className="text-sm font-semibold text-green-600">
                                  -{formatPrice(feature.price)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Booking ID & Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Booking ID:</span>
                    <p className="text-gray-900 font-mono mt-1">{selectedBookingDetails._id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Booking Date:</span>
                    <p className="text-gray-900 mt-1">{new Date(selectedBookingDetails.createdAt).toLocaleDateString()}</p>
                  </div>
                  {selectedBookingDetails.otpVerified && (
                    <div className="sm:col-span-2">
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        OTP Verified
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default VendorDashboard;
