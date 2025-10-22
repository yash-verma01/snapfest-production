import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Download, 
  Eye, 
  Calendar, 
  MapPin, 
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Receipt,
  Banknote,
  Smartphone
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { userAPI } from '../services/api';
import { dummyBookings } from '../data';
import { dateUtils } from '../utils';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getPayments();
        setPayments(response.data.data.payments);
      } catch (err) {
        console.error('Error loading payments:', err);
        setError(err.message);
        // Fallback to dummy data
        setPayments([
          {
            _id: 'payment_001',
            bookingId: 'booking_001',
            amount: 20000,
            status: 'COMPLETED',
            paymentMethod: 'RAZORPAY',
            paidAt: '2024-02-15T10:30:00Z',
            booking: {
              _id: 'booking_001',
              packageData: { title: 'Wedding Photography - Premium Package' },
              eventDate: '2024-06-15T10:00:00Z',
              location: 'Taj Palace Hotel, Mumbai'
            }
          },
          {
            _id: 'payment_002',
            bookingId: 'booking_002',
            amount: 16000,
            status: 'PENDING',
            paymentMethod: 'RAZORPAY',
            createdAt: '2024-02-01T14:15:00Z',
            booking: {
              _id: 'booking_002',
              packageData: { title: 'Birthday Party Photography' },
              eventDate: '2024-05-20T16:00:00Z',
              location: 'Community Center, Delhi'
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status.toLowerCase() === filter.toLowerCase();
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'danger';
      case 'REFUNDED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'FAILED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'REFUNDED':
        return <ArrowRight className="w-5 h-5 text-blue-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'RAZORPAY':
        return <CreditCard className="w-4 h-4" />;
      case 'CASH':
        return <Banknote className="w-4 h-4" />;
      case 'UPI':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDownloadInvoice = (paymentId) => {
    // TODO: Implement invoice download
    console.log('Download invoice for payment:', paymentId);
  };

  const handleViewDetails = (paymentId) => {
    // TODO: Navigate to payment details
    console.log('View payment details:', paymentId);
  };

  const handleRetryPayment = (paymentId) => {
    // TODO: Implement payment retry
    console.log('Retry payment:', paymentId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-600 mb-4">
            <CreditCard className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Payments</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
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
              <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
              <p className="text-gray-600">
                View and manage your payment transactions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Payments</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPayments.length === 0 ? (
          <Card className="p-8 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payments Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't made any payments yet"
                : `No ${filter} payments found`
              }
            </p>
            <Link to="/packages">
              <Button>Browse Packages</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredPayments.map((payment) => (
              <Card key={payment._id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  {/* Payment Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {payment.booking?.package?.title || 'Photography Package'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Payment ID: #{payment._id}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.status)}
                        <Badge variant={getStatusColor(payment.status)} size="sm">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {payment.paidAt 
                            ? dateUtils.formatDate(payment.paidAt)
                            : dateUtils.formatDate(payment.createdAt)
                          }
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{payment.booking?.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        <span className="ml-2 capitalize">{payment.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-primary-600">
                          {formatPrice(payment.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.paymentMethod === 'RAZORPAY' ? 'Online Payment' : 'Cash Payment'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(payment._id)}
                      className="flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(payment._id)}
                      className="flex items-center justify-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Invoice
                    </Button>
                    {payment.status === 'FAILED' && (
                      <Button
                        size="sm"
                        onClick={() => handleRetryPayment(payment._id)}
                        className="flex items-center justify-center"
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Payment Summary */}
        {filteredPayments.length > 0 && (
          <Card className="mt-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(filteredPayments.reduce((sum, p) => p.status === 'COMPLETED' ? sum + p.amount : sum, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {formatPrice(filteredPayments.reduce((sum, p) => p.status === 'PENDING' ? sum + p.amount : sum, 0))}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatPrice(filteredPayments.reduce((sum, p) => p.status === 'FAILED' ? sum + p.amount : sum, 0))}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(filteredPayments.reduce((sum, p) => p.status === 'REFUNDED' ? sum + p.amount : sum, 0))}
                </div>
                <div className="text-sm text-gray-600">Refunded</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Payments;