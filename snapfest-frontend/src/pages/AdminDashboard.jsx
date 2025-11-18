import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Shield,
  Bell,
  Settings,
  LogOut,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Home,
  MessageSquare,
  Star,
  Mail
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { adminAPI } from '../services/api';
import { dummyAdmin } from '../data';
import { Card, Button, Badge } from '../components/ui';
import UserManagement from '../components/admin/UserManagement';
import BookingManagement from '../components/admin/BookingManagement';
import PaymentManagement from '../components/admin/PaymentManagement';
import VendorManagement from '../components/admin/VendorManagement';
import EmailManagement from '../components/admin/EmailManagement';
import PackageManagement from '../components/admin/PackageManagement';
import EventManagement from '../components/admin/EventManagement';
import VenueManagement from '../components/admin/VenueManagement';
import BeatBloomManagement from '../components/admin/BeatBloomManagement';
import EnquiryManagement from '../components/admin/EnquiryManagement';

const AdminDashboard = () => {
  // Use Clerk hooks instead of AuthContext (AdminApp uses ClerkProvider)
  const { user } = useUser();
  const { signOut } = useClerk();
  
  // Create logout function for compatibility
  const logout = async () => {
    await signOut();
    window.location.href = '/sign-in';
  };
  const [dashboardData, setDashboardData] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navigationHistory, setNavigationHistory] = useState(['dashboard']);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialStats, setTestimonialStats] = useState(null);
  const [testimonialLoading, setTestimonialLoading] = useState(false);

  // Navigation handler
  const handleNavigation = (tab) => {
    setActiveTab(tab);
    setNavigationHistory(prev => [...prev, tab]);
  };

  // Back navigation handler
  const handleBackNavigation = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current tab
      const previousTab = newHistory[newHistory.length - 1];
      setActiveTab(previousTab);
      setNavigationHistory(newHistory);
    } else {
      setActiveTab('dashboard');
      setNavigationHistory(['dashboard']);
    }
  };

  // Load testimonials
  const loadTestimonials = async () => {
    try {
      setTestimonialLoading(true);
      const response = await adminAPI.getTestimonials();
      setTestimonials(response.data.data.testimonials);
      
      const statsResponse = await adminAPI.getTestimonialStats();
      setTestimonialStats(statsResponse.data.data);
    } catch (error) {
      console.error('Error loading testimonials:', error);
    } finally {
      setTestimonialLoading(false);
    }
  };

  // Approve testimonial
  const approveTestimonial = async (id) => {
    try {
      await adminAPI.approveTestimonial(id);
      await loadTestimonials(); // Reload testimonials
    } catch (error) {
      console.error('Error approving testimonial:', error);
      alert('Error approving testimonial. Please try again.');
    }
  };

  // Reject testimonial
  const rejectTestimonial = async (id) => {
    try {
      await adminAPI.rejectTestimonial(id);
      await loadTestimonials(); // Reload testimonials
    } catch (error) {
      console.error('Error rejecting testimonial:', error);
      alert('Error rejecting testimonial. Please try again.');
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        console.log('Loading admin dashboard data...');
        
        // Load dashboard data
        console.log('Fetching dashboard data...');
        const dashboardResponse = await adminAPI.getDashboard();
        console.log('Dashboard response:', dashboardResponse.data);
        setDashboardData(dashboardResponse.data.data);
        
        // Load system stats
        console.log('Fetching system stats...');
        const statsResponse = await adminAPI.getSystemStats();
        console.log('System stats response:', statsResponse.data);
        setSystemStats(statsResponse.data.data);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err.message);
        // Set empty data instead of dummy data
        setDashboardData({
          overview: {
            totalUsers: 0,
            totalVendors: 0,
            totalBookings: 0,
            pendingBookings: 0
          },
          revenue: {
            monthly: 0
          }
        });
        setSystemStats({
          users: {
            active: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = [
    {
      title: 'Total Users',
      value: dashboardData?.overview?.totalUsers || 0,
      icon: <Users className="w-6 h-6 text-blue-600" />,
      change: 'Registered users',
      changeType: 'positive',
      description: 'Total registered users',
      trend: 'up'
    },
    {
      title: 'Total Vendors',
      value: dashboardData?.overview?.totalVendors || 0,
      icon: <Shield className="w-6 h-6 text-green-600" />,
      change: 'Active photographers',
      changeType: 'positive',
      description: 'Total active vendors',
      trend: 'up'
    },
    {
      title: 'Total Bookings',
      value: dashboardData?.overview?.totalBookings || 0,
      icon: <Calendar className="w-6 h-6 text-purple-600" />,
      change: 'All time bookings',
      changeType: 'positive',
      description: 'Total bookings',
      trend: 'up'
    },
    {
      title: 'Monthly Revenue',
      value: `₹${(dashboardData?.revenue?.monthly || 0).toLocaleString()}`,
      icon: <CreditCard className="w-6 h-6 text-yellow-600" />,
      change: 'This month revenue',
      changeType: 'positive',
      description: 'Current month revenue',
      trend: 'up'
    }
  ];

  const systemHealth = [
    {
      title: 'System Uptime',
      value: `${systemStats?.systemUptime || 99.8}%`,
      icon: <Activity className="w-5 h-5 text-green-600" />,
      status: 'healthy'
    },
    {
      title: 'Active Users',
      value: systemStats?.users?.active || 0,
      icon: <Users className="w-5 h-5 text-blue-600" />,
      status: 'normal'
    },
    {
      title: 'Response Time',
      value: `${systemStats?.averageResponseTime || 120}ms`,
      icon: <Clock className="w-5 h-5 text-yellow-600" />,
      status: 'normal'
    },
    {
      title: 'Pending Bookings',
      value: dashboardData?.overview?.pendingBookings || 0,
      icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
      status: dashboardData?.overview?.pendingBookings > 10 ? 'warning' : 'normal'
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                System overview and management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {activeTab !== 'dashboard' && (
                <Button variant="outline" size="sm" onClick={handleBackNavigation}>
                  ← Back
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Conditional Content Based on Active Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                      <div className="flex items-center text-sm text-green-600">
                        <span className="mr-1">↗</span>
                        <span>{stat.change}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Debug Information */}
            {error && (
              <Card className="p-4 bg-red-50 border-red-200 mb-8">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <div>
                    <h3 className="font-semibold text-red-900">API Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Showing empty data. Check console for details.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* System Health */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {systemHealth.map((item, index) => (
                      <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          {item.icon}
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{item.value}</div>
                        <div className="text-sm text-gray-600">{item.title}</div>
                        <div className={`mt-2 text-xs px-2 py-1 rounded-full ${
                          item.status === 'healthy' ? 'bg-green-100 text-green-800' :
                          item.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {[
                      { action: 'New user registration', user: 'John Doe', time: '2 minutes ago', type: 'user' },
                      { action: 'Booking completed', user: 'Wedding Photography', time: '15 minutes ago', type: 'booking' },
                      { action: 'Payment processed', user: '₹25,000', time: '1 hour ago', type: 'payment' },
                      { action: 'Vendor approved', user: 'Photography Studio', time: '2 hours ago', type: 'vendor' },
                      { action: 'System backup', user: 'Database backup completed', time: '3 hours ago', type: 'system' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'user' ? 'bg-blue-100' :
                          activity.type === 'booking' ? 'bg-green-100' :
                          activity.type === 'payment' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          {activity.type === 'user' ? <Users className="w-4 h-4 text-blue-600" /> :
                           activity.type === 'booking' ? <Calendar className="w-4 h-4 text-green-600" /> :
                           activity.type === 'payment' ? <CreditCard className="w-4 h-4 text-yellow-600" /> :
                           <Activity className="w-4 h-4 text-gray-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-600">{activity.user}</p>
                        </div>
                        <div className="text-xs text-gray-500">{activity.time}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'bookings' && <BookingManagement />}
        {activeTab === 'packages' && <PackageManagement />}
        {activeTab === 'events' && <EventManagement />}
        {activeTab === 'venues' && <VenueManagement />}
        {activeTab === 'beatbloom' && <BeatBloomManagement />}
        {activeTab === 'enquiries' && <EnquiryManagement />}
        {activeTab === 'vendors' && <VendorManagement />}
        {activeTab === 'payments' && <PaymentManagement />}
        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            {/* Testimonial Stats */}
            {testimonialStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Testimonials</p>
                      <p className="text-2xl font-bold text-gray-900">{testimonialStats.total}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Review</p>
                      <p className="text-2xl font-bold text-yellow-600">{testimonialStats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-green-600">{testimonialStats.approved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </Card>
              </div>
            )}

            {/* Testimonials List */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Testimonials</h3>
                <Button 
                  onClick={loadTestimonials}
                  disabled={testimonialLoading}
                  variant="outline"
                >
                  {testimonialLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>

              {testimonialLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading testimonials...</p>
                </div>
              ) : testimonials.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Testimonials</h3>
                  <p className="text-gray-600">No testimonials have been submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <Badge
                              className={
                                testimonial.isApproved
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {testimonial.isApproved ? 'Approved' : 'Pending Review'}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{testimonial.feedback}</p>
                          <div className="text-sm text-gray-500">
                            <p><strong>User:</strong> {testimonial.userId?.name || 'Unknown User'}</p>
                            <p><strong>Email:</strong> {testimonial.userId?.email || 'N/A'}</p>
                            <p><strong>Submitted:</strong> {new Date(testimonial.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {!testimonial.isApproved && (
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => approveTestimonial(testimonial._id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectTestimonial(testimonial._id)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
        {activeTab === 'emails' && <EmailManagement />}

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Content already rendered above */}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Navigation */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h3>
                <div className="space-y-2">
                  <Button 
                    className={`w-full justify-start ${activeTab === 'dashboard' ? 'bg-primary-600 text-white' : ''}`}
                    onClick={() => handleNavigation('dashboard')}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'users' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => handleNavigation('users')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'bookings' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => handleNavigation('bookings')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Bookings
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'packages' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => handleNavigation('packages')}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Manage Packages
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'events' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => handleNavigation('events')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Events
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'venues' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => handleNavigation('venues')}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Manage Venues
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'beatbloom' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => handleNavigation('beatbloom')}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Beat & Bloom
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'enquiries' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => handleNavigation('enquiries')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enquiries
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'vendors' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => handleNavigation('vendors')}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Manage Vendors
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'payments' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => handleNavigation('payments')}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment Reports
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'testimonials' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => {
                      handleNavigation('testimonials');
                      loadTestimonials();
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Manage Testimonials
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${activeTab === 'emails' ? 'bg-primary-50 text-primary-600' : ''}`}
                    onClick={() => handleNavigation('emails')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Management
                  </Button>
                </div>
              </Card>

              {/* System Status */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Server</span>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment Gateway</span>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Service</span>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;