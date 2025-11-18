import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Package, DollarSign, CreditCard, Loader2 } from 'lucide-react';
import { Card, Button, Badge } from '../ui';
import ModalPortal from './ModalPortal';
import { userAPI, paymentAPI } from '../../services/api';
import { paymentService } from '../../services/paymentService';
import { dateUtils } from '../../utils';

const BookingDetailsModal = ({ isOpen, onClose, bookingId }) => {
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingDetails();
    }
  }, [isOpen, bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getBookingDetails(bookingId);
      setBookingDetails(response.data.data);
    } catch (err) {
      console.error('Error loading booking details:', err);
      setError(err.response?.data?.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayRemaining = async () => {
    if (!bookingDetails) return;

    const remainingAmount = bookingDetails.paymentSummary.remainingAmount;
    if (remainingAmount <= 0) {
      alert('No remaining amount to pay');
      return;
    }

    try {
      setProcessingPayment(true);

      // Create Razorpay order for remaining amount
      const orderResponse = await paymentAPI.createFullPaymentOrder({
        bookingId: bookingId
      });

      const { order, payment } = orderResponse.data.data;

      // Open Razorpay checkout
      const paymentResult = await paymentService.openCheckout(
        order.id,
        remainingAmount,
        'INR',
        'SnapFest',
        `Payment for Booking ${bookingId.slice(-8)}`,
        {
          name: bookingDetails.booking.userId?.name || '',
          email: bookingDetails.booking.userId?.email || '',
          contact: bookingDetails.booking.userId?.phone || ''
        }
      );

      if (paymentResult.success) {
        // Verify payment
        const verifyResponse = await paymentAPI.verifyPayment({
          orderId: order.id,
          paymentId: paymentResult.razorpay_payment_id,
          signature: paymentResult.razorpay_signature
        });

        if (verifyResponse.data.success) {
          alert('Payment successful!');
          // Reload booking details
          await loadBookingDetails();
        } else {
          alert('Payment verification failed. Please contact support.');
        }
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      alert(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <Button onClick={loadBookingDetails} className="mt-4">
                Retry
              </Button>
            </div>
          ) : bookingDetails ? (
            <div className="space-y-6">
              {/* Package Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Package className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Package</p>
                      <p className="font-medium text-gray-900">
                        {bookingDetails.booking.packageId?.title || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {bookingDetails.booking.packageId?.category || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Event Date</p>
                      <p className="font-medium text-gray-900">
                        {dateUtils.formatDate(bookingDetails.booking.eventDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">
                        {bookingDetails.booking.location || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customization */}
              {bookingDetails.booking.customization && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Customization</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {bookingDetails.booking.customization}
                  </p>
                </div>
              )}

              {/* Payment Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(bookingDetails.paymentSummary.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(bookingDetails.paymentSummary.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining Amount:</span>
                    <span className="font-semibold text-orange-600">
                      {formatPrice(bookingDetails.paymentSummary.remainingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">Payment Status:</span>
                    <Badge className={
                      bookingDetails.paymentSummary.paymentStatus === 'FULLY_PAID' ? 'bg-green-100 text-green-800' :
                      bookingDetails.paymentSummary.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' :
                      bookingDetails.paymentSummary.paymentStatus === 'FAILED_PAYMENT' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {bookingDetails.paymentSummary.paymentStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {bookingDetails.paymentSummary.paymentPercentagePaid > 0 && (
                    <div className="pt-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Payment Progress</span>
                        <span>{bookingDetails.paymentSummary.paymentPercentagePaid}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${bookingDetails.paymentSummary.paymentPercentagePaid}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment History */}
              {bookingDetails.payments && bookingDetails.payments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                  <div className="space-y-2">
                    {bookingDetails.payments.map((payment) => (
                      <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatPrice(payment.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {dateUtils.formatDate(payment.createdAt)}
                          </p>
                        </div>
                        <Badge className={
                          payment.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor Information */}
              {bookingDetails.booking.assignedVendorId && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Vendor</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">
                      {bookingDetails.booking.assignedVendorId.name || 'N/A'}
                    </p>
                    {bookingDetails.booking.assignedVendorId.businessName && (
                      <p className="text-sm text-gray-600">
                        {bookingDetails.booking.assignedVendorId.businessName}
                      </p>
                    )}
                    {bookingDetails.booking.assignedVendorId.email && (
                      <p className="text-sm text-gray-600">
                        {bookingDetails.booking.assignedVendorId.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Pay Remaining Button */}
              {bookingDetails.paymentSummary.remainingAmount > 0 && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={handlePayRemaining}
                    disabled={processingPayment}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay Remaining Amount ({formatPrice(bookingDetails.paymentSummary.remainingAmount)})</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Card>
    </ModalPortal>
  );
};

export default BookingDetailsModal;

