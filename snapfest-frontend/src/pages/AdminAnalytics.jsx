import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Activity
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { adminAPI } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const { handleAsync, handleApiError } = useErrorHandler();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, statsRes] = await Promise.all([
        adminAPI.getAnalytics({ period: selectedPeriod }),
        adminAPI.getSystemStats()
      ]);

      setAnalytics(analyticsRes.data.data);
      setSystemStats(statsRes.data.data);
    } catch (error) {
      handleApiError(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign, color: 'text-green-600' },
    { id: 'bookings', label: 'Bookings', icon: Calendar, color: 'text-blue-600' },
    { id: 'users', label: 'Users', icon: Users, color: 'text-purple-600' },
    { id: 'vendors', label: 'Vendors', icon: Users, color: 'text-orange-600' }
  ];

  const periods = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last Year' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="text-gray-600 mt-2">Comprehensive insights into your platform performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={loadAnalyticsData}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-8">
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-700">Time Period:</span>
              <div className="flex space-x-2">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{analytics?.totalRevenue?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{analytics?.revenueGrowth || 0}% from last period
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.totalBookings?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{analytics?.bookingGrowth || 0}% from last period
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.activeUsers?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{analytics?.userGrowth || 0}% from last period
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.activeVendors?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{analytics?.vendorGrowth || 0}% from last period
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
              <div className="flex space-x-2">
                {metrics.map((metric) => (
                  <button
                    key={metric.id}
                    onClick={() => setSelectedMetric(metric.id)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedMetric === metric.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Chart visualization would go here</p>
                <p className="text-sm text-gray-500">Revenue data: ₹{analytics?.revenueData?.join(', ') || '0'}</p>
              </div>
            </div>
          </Card>

          {/* Bookings Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Status Distribution</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Pie chart visualization would go here</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-medium">{analytics?.completedBookings || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-medium">{analytics?.pendingBookings || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cancelled</span>
                    <span className="font-medium">{analytics?.cancelledBookings || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <Badge className="bg-green-100 text-green-800">
                  {systemStats?.uptime || '99.9%'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="font-medium">{systemStats?.responseTime || '120ms'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Error Rate</span>
                <span className="font-medium text-green-600">{systemStats?.errorRate || '0.1%'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Daily Active Users</span>
                <span className="font-medium">{analytics?.dailyActiveUsers || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Registrations</span>
                <span className="font-medium">{analytics?.newRegistrations || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Session Duration</span>
                <span className="font-medium">{analytics?.avgSessionDuration || '0m'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="font-medium">{analytics?.conversionRate || '0%'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Order Value</span>
                <span className="font-medium">₹{analytics?.avgOrderValue || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customer Satisfaction</span>
                <span className="font-medium text-green-600">{analytics?.satisfaction || '4.8/5'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {analytics?.recentActivity?.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-600">{activity.timestamp}</p>
                  </div>
                  <Badge className={activity.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {activity.type}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;

