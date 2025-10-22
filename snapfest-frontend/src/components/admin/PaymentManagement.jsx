import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadPayments();
    loadPaymentStats();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPayments({ 
        page: 1, 
        limit: 50,
        status: statusFilter || undefined
      });
      setPayments(response.data.data.payments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStats = async () => {
    try {
      const response = await adminAPI.getPaymentStats();
      setPaymentStats(response.data.data);
    } catch (err) {
      console.error('Error loading payment stats:', err);
    }
  };

  const handleVerifyPayment = async (paymentId, status) => {
    try {
      await adminAPI.verifyPayment(paymentId, { status });
      await loadPayments();
      setShowDetails(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProcessRefund = async (paymentId, amount, reason) => {
    try {
      await adminAPI.processRefund(paymentId, { amount, reason });
      await loadPayments();
      setShowDetails(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'SUCCESS': { color: 'green', icon: CheckCircle },
      'PENDING': { color: 'yellow', icon: AlertCircle },
      'FAILED': { color: 'red', icon: XCircle },
      'REFUNDED': { color: 'purple', icon: RefreshCw }
    };
    
    const config = statusConfig[status] || { color: 'gray', icon: AlertCircle };
    const Icon = config.icon;
    
    return (
      <Badge className={`bg-${config.color}-100 text-${config.color}-800`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.bookingId?.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.bookingId?.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
          <p className="text-gray-600">Manage and monitor all payments</p>
        </div>
        <Button onClick={loadPayments} className="bg-primary-600 hover:bg-primary-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Payment Stats */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{paymentStats.totalPayments}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-gray-900">{paymentStats.successfulPayments}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{paymentStats.pendingPayments}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{paymentStats.totalRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <Button onClick={loadPayments} className="bg-gray-600 hover:bg-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.bookingId?.userId?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.bookingId?.userId?.email || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{payment.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.method || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowDetails(true);
                      }}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              <Button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Customer</label>
                  <p className="text-sm text-gray-900">{selectedPayment.bookingId?.userId?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedPayment.bookingId?.userId?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-sm text-gray-900">₹{selectedPayment.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>

              {selectedPayment.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVerifyPayment(selectedPayment._id, 'SUCCESS')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleVerifyPayment(selectedPayment._id, 'FAILED')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {selectedPayment.status === 'SUCCESS' && (
                <Button
                  onClick={() => handleProcessRefund(selectedPayment._id, selectedPayment.amount, 'Admin refund')}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Process Refund
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;

