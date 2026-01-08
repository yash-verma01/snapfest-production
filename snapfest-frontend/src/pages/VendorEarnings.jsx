import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { vendorAPI } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

const VendorEarnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showFilters, setShowFilters] = useState(false);
  const { handleAsync, handleApiError } = useErrorHandler();

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      const [earningsRes, monthlyRes, payoutsRes, pendingRes] = await Promise.all([
        vendorAPI.getEarnings(),
        vendorAPI.getMonthlyEarnings(),
        vendorAPI.getPayoutHistory(),
        vendorAPI.getPendingPayouts()
      ]);

      setEarnings(earningsRes.data.data);
      setMonthlyEarnings(monthlyRes.data.data.earnings || []);
      setPayoutHistory(payoutsRes.data.data.payouts || []);
      setPendingPayouts(pendingRes.data.data.payouts || []);
    } catch (error) {
      handleApiError(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      const response = await vendorAPI.requestPayout({
        amount: earnings?.pendingAmount || 0,
        method: 'bank_transfer'
      });
      
      if (response.data.success) {
        await loadEarningsData();
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'PROCESSING': return <AlertCircle className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Earnings & Payouts</h1>
              <p className="text-gray-600 mt-2">Track your earnings and manage payouts</p>
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
                onClick={loadEarningsData}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{earnings?.totalEarnings?.toLocaleString() || '0'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{earnings?.thisMonthEarnings?.toLocaleString() || '0'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{earnings?.availableBalance?.toLocaleString() || '0'}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{earnings?.pendingAmount?.toLocaleString() || '0'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRequestPayout}
                disabled={!earnings?.pendingAmount || earnings.pendingAmount <= 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Request Payout
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Earnings</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Monthly Earnings Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Earnings</h3>
            <div className="space-y-4">
              {monthlyEarnings.slice(0, 6).map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{month.month}</p>
                    <p className="text-sm text-gray-600">{month.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{month.earnings?.toLocaleString()}</p>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(month.earnings / Math.max(...monthlyEarnings.map(m => m.earnings))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Completed Events</span>
                <span className="font-medium">{earnings?.completedEvents || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average per Event</span>
                <span className="font-medium">
                  ₹{earnings?.averagePerEvent?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Commission Rate</span>
                <span className="font-medium">{earnings?.commissionRate || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-medium">
                  ₹{earnings?.platformFee?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Payout History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payout History</h3>
            <div className="space-y-4">
              {payoutHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No payout history</p>
              ) : (
                payoutHistory.slice(0, 5).map((payout) => (
                  <div key={payout._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">₹{payout.amount?.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(payout.status)} flex items-center space-x-2`}>
                      {getStatusIcon(payout.status)}
                      <span>{payout.status}</span>
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Payouts</h3>
            <div className="space-y-4">
              {pendingPayouts.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No pending payouts</p>
              ) : (
                pendingPayouts.map((payout) => (
                  <div key={payout._id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">₹{payout.amount?.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        Requested: {new Date(payout.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(payout.status)} flex items-center space-x-2`}>
                      {getStatusIcon(payout.status)}
                      <span>{payout.status}</span>
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorEarnings;

