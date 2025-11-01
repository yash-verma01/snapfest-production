import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  CreditCard, 
  Users, 
  TrendingUp, 
  Camera,
  Bell,
  Settings,
  LogOut,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  UserCheck
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { vendorAPI } from '../services/api';
import { dummyVendor, dummyBookings } from '../data';
import VendorStatsCard from '../components/vendor/VendorStatsCard';
import OTPVerification from '../components/vendor/OTPVerification';
import VendorBookingCard from '../components/vendor/VendorBookingCard';
import AssignedBookings from '../components/vendor/AssignedBookings';
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
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);

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
        // Fallback to dummy data
        setDashboardData({
          totalBookings: 12,
          pendingBookings: 3,
          completedBookings: 8,
          totalEarnings: 240000,
          thisMonthEarnings: 45000,
          averageRating: 4.9
        });
        setBookings(dummyBookings.slice(0, 5));
        setPendingOTPs([
          {
            _id: 'otp_001',
            bookingId: 'booking_001',
            amount: 20000,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          }
        ]);
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
    setSelectedBooking(null);
    // Refresh data
    window.location.reload();
  };

  const handleOTPError = (error) => {
    console.error('OTP verification error:', error);
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

            {/* Recent Bookings */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              {/* Assigned Bookings Alert */}
              {bookings.some(booking => booking.assignedVendorId) && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <UserCheck className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      You have {bookings.filter(booking => booking.assignedVendorId).length} assigned booking(s) - these appear first
                    </span>
                  </div>
                </div>
              )}
              
              {!bookings || bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No bookings yet</p>
                  <p className="text-sm text-gray-500">Your bookings will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <VendorBookingCard
                      key={booking._id}
                      booking={booking}
                      onAccept={handleAcceptBooking}
                      onReject={handleRejectBooking}
                      onStart={handleStartBooking}
                      onComplete={handleCompleteBooking}
                      onCancel={handleCancelBooking}
                      onViewDetails={(booking) => {
                        console.log('View booking details:', booking._id);
                      }}
                      onMessageCustomer={(booking) => {
                        console.log('Message customer for:', booking._id);
                      }}
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* Assigned Bookings */}
            <AssignedBookings />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => setShowOTPModal(true)}
                  className="w-full justify-start"
                  disabled={!pendingOTPs || pendingOTPs.length === 0}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify OTPs ({pendingOTPs?.length || 0})
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  View Earnings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </Button>
              </div>
            </Card>

            {/* Profile Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user?.name || 'Vendor Name'}</p>
                    <p className="text-sm text-gray-600">{user?.email || 'vendor@example.com'}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vendor since</span>
                    <span className="font-medium">January 2023</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total events</span>
                    <span className="font-medium">{dashboardData?.totalBookings || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rating</span>
                    <Badge variant="success" size="sm">
                      {dashboardData?.averageRating || 0} ⭐
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

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
                bookingId={selectedBooking?._id || pendingOTPs?.[0]?.bookingId}
                onVerified={handleOTPVerified}
                onError={handleOTPError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
