import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Smartphone,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { userAPI, paymentAPI } from '../services/api';
import { dummyBookings } from '../data';
import { dateUtils } from '../utils';

const Payments = () => {
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expandedBookings, setExpandedBookings] = useState(new Set());
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        console.log('💳 Loading payment details...');
        const response = await userAPI.getPayments();
        console.log('💳 Payment details response:', response.data);
        console.log('💳 Payment details structure:', JSON.stringify(response.data, null, 2));
        const paymentDetails = response.data.data?.paymentDetails || [];
        console.log('💳 Payment details received:', paymentDetails.length, 'bookings');
        setPaymentDetails(paymentDetails);
      } catch (err) {
        console.error('💳 Error loading payments:', err);
        console.error('💳 Error response:', err.response?.data);
        console.error('💳 Error status:', err.response?.status);
        setError(err.message);
        // Don't use dummy data, show empty state instead
        setPaymentDetails([]);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const filteredPaymentDetails = paymentDetails.filter(detail => {
    if (filter === 'all') return true;
    // Use paymentStatus from booking or paymentSummary
    const paymentStatus = detail.booking.paymentStatus || detail.paymentSummary.paymentStatus;
    if (filter === 'fully_paid') return paymentStatus === 'FULLY_PAID';
    if (filter === 'partially_paid') return paymentStatus === 'PARTIALLY_PAID';
    if (filter === 'pending') return paymentStatus === 'PENDING_PAYMENT';
    if (filter === 'failed') return paymentStatus === 'FAILED_PAYMENT';
    return true;
  });

  const toggleBookingExpansion = (bookingId) => {
    const newExpanded = new Set(expandedBookings);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedBookings(newExpanded);
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
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

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'REFUNDED':
        return <ArrowRight className="w-4 h-4 text-blue-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'warning';
      case 'PENDING_PARTIAL_PAYMENT':
        return 'danger';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getBookingStatusIcon = (status) => {
    switch (status) {
      case 'FULLY_PAID':
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PARTIALLY_PAID':
        return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      case 'PENDING_PARTIAL_PAYMENT':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'CANCELLED':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
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
                <option value="all">All Statuses</option>
                <option value="fully_paid">Fully Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="pending">Pending Payment</option>
                <option value="failed">Failed Payment</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPaymentDetails.length === 0 ? (
          <Card className="p-8 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment History</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't made any bookings yet. Book a package to see your payment history here."
                : `No ${filter.replace('_', ' ')} bookings found`
              }
            </p>
            <Link to="/packages">
              <Button>Browse Packages</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredPaymentDetails.map((detail) => {
              const isExpanded = expandedBookings.has(detail.booking._id);
              const { booking, payments, paymentSummary } = detail;
              
              return (
                <Card key={booking._id} className="p-6">
                  {/* Booking Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Package className="w-5 h-5 text-primary-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.packageId?.title || 'Photography Package'}
                        </h3>
                        <Badge 
                          variant={
                            booking.paymentStatus === 'FULLY_PAID' ? 'success' :
                            booking.paymentStatus === 'PARTIALLY_PAID' ? 'warning' :
                            booking.paymentStatus === 'PENDING_PAYMENT' ? 'danger' :
                            booking.paymentStatus === 'FAILED_PAYMENT' ? 'danger' :
                            'default'
                          } 
                          size="sm"
                        >
                          {booking.paymentStatus?.replace(/_/g, ' ') || 'PENDING'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Booking ID: #{booking._id}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBookingExpansion(booking._id)}
                      className="flex items-center"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 mr-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 mr-1" />
                      )}
                      {isExpanded ? 'Hide' : 'Show'} Details
                    </Button>
                  </div>

                  {/* Booking Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{dateUtils.formatDate(booking.eventDate)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{booking.location}</span>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(paymentSummary.totalPaid)}
                        </div>
                        <div className="text-xs text-gray-600">Paid</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {formatPrice(paymentSummary.remainingAmount)}
                        </div>
                        <div className="text-xs text-gray-600">Remaining</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {formatPrice(booking.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary-600">
                          {paymentSummary.paymentProgress}%
                        </div>
                        <div className="text-xs text-gray-600">Progress</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${paymentSummary.paymentProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Payment Details */}
                  {isExpanded && (
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                        <Receipt className="w-4 h-4 mr-2" />
                        Payment History ({payments.length} payments)
                      </h4>
                      
                      {payments.length === 0 ? (
                        <p className="text-gray-500 text-sm">No payments made yet</p>
                      ) : (
                        <div className="space-y-3">
                          {payments.map((payment) => (
                            <div key={payment._id} className="bg-white border rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {getPaymentStatusIcon(payment.status)}
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {formatPrice(payment.amount)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {dateUtils.formatDate(payment.createdAt)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={getPaymentStatusColor(payment.status)} size="sm">
                                    {payment.status}
                                  </Badge>
                                  <div className="flex items-center text-sm text-gray-500">
                                    {getPaymentMethodIcon(payment.method)}
                                    <span className="ml-1 capitalize">{payment.method}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(booking._id)}
                      className="flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Booking
                    </Button>
                    {paymentSummary.remainingAmount > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleRetryPayment(booking._id)}
                        disabled={processingPayment}
                        className="flex items-center justify-center"
                      >
                        {processingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-1" />
                            Pay Remaining
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(booking._id)}
                      className="flex items-center justify-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Invoice
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Payment Summary */}
        {filteredPaymentDetails.length > 0 && (
          <Card className="mt-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(filteredPaymentDetails.reduce((sum, d) => sum + d.paymentSummary.totalPaid, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatPrice(filteredPaymentDetails.reduce((sum, d) => sum + d.paymentSummary.remainingAmount, 0))}
                </div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(filteredPaymentDetails.reduce((sum, d) => sum + d.booking.totalAmount, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {Math.round(filteredPaymentDetails.reduce((sum, d) => sum + d.paymentSummary.paymentProgress, 0) / filteredPaymentDetails.length)}%
                </div>
                <div className="text-sm text-gray-600">Avg Progress</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Payments;