import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Button, Card } from '../ui';
import { paymentService, loadRazorpayScript } from '../../services/paymentService';
import { paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, bookingData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [paymentType, setPaymentType] = useState('partial'); // partial or full
  const [amount, setAmount] = useState(0);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript().then(setRazorpayLoaded);
      calculateAmount();
    }
  }, [isOpen, bookingData]);

  const calculateAmount = () => {
    if (!bookingData) return;
    
    const totalAmount = bookingData.totalAmount || 0;
    if (paymentType === 'partial') {
      setAmount(Math.round(totalAmount * 0.2)); // 20% advance
    } else {
      setAmount(Math.round(totalAmount * 0.8)); // 80% remaining
    }
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment system is loading, please wait...');
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === 'online') {
        await handleOnlinePayment();
      } else {
        await handleCashPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    try {
      // Create payment order via backend based on payment type
      const orderResponse = paymentType === 'partial' 
        ? await paymentAPI.createPartialPaymentOrder({
            bookingId: bookingData.bookingId,
            amount: amount
          })
        : await paymentAPI.createFullPaymentOrder({
            bookingId: bookingData.bookingId,
            amount: amount
          });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message);
      }

      const orderData = orderResponse.data.data;
      
      // Open Razorpay checkout
      const paymentResult = await paymentService.openCheckout(
        orderData.order.id,
        amount,
        'INR',
        'SnapFest Payment',
        `${paymentType === 'partial' ? 'Partial' : 'Full'} payment for ${bookingData.packageTitle}`,
        {
          name: bookingData.userName,
          email: bookingData.userEmail,
          contact: bookingData.userPhone
        }
      );

      if (paymentResult.success) {
        // Verify payment with backend
        const verifyResponse = await paymentAPI.verifyPayment({
          orderId: paymentResult.orderId,
          paymentId: paymentResult.paymentId,
          signature: paymentResult.signature
        });

        if (verifyResponse.data.success) {
          toast.success('Payment successful!');
          onSuccess(verifyResponse.data.data);
          onClose();
        } else {
          throw new Error('Payment verification failed');
        }
      }
    } catch (error) {
      console.error('Online payment error:', error);
      toast.error('Payment failed: ' + error.message);
    }
  };

  const handleCashPayment = async () => {
    try {
      // For cash payment, we'll create a pending payment record
      const response = await paymentAPI.confirmCashPayment({
        bookingId: bookingData.bookingId,
        amount: amount
      });

      if (response.data.success) {
        toast.success('Cash payment recorded. Please pay to the vendor.');
        onSuccess(response.data.data);
        onClose();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Cash payment error:', error);
      toast.error('Cash payment failed: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Complete Payment</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentType('partial')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentType === 'partial'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">Partial Payment</div>
                  <div className="text-sm text-gray-500">20% Advance</div>
                </div>
              </button>
              <button
                onClick={() => setPaymentType('full')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentType === 'full'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">Full Payment</div>
                  <div className="text-sm text-gray-500">80% Remaining</div>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod('online')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                  paymentMethod === 'online'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Online Payment</div>
                  <div className="text-sm text-gray-500">Credit/Debit Card, UPI, Net Banking</div>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                  paymentMethod === 'cash'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Cash Payment</div>
                  <div className="text-sm text-gray-500">Pay directly to vendor</div>
                </div>
              </button>
            </div>
          </div>

          {/* Amount Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount to Pay:</span>
              <span className="text-2xl font-bold text-pink-600">₹{amount.toLocaleString()}</span>
            </div>
            {paymentType === 'partial' && (
              <div className="text-sm text-gray-500 mt-1">
                Remaining: ₹{((bookingData?.totalAmount || 0) - amount).toLocaleString()}
              </div>
            )}
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={loading || !razorpayLoaded}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {paymentMethod === 'online' ? (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay Online
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5 mr-2" />
                    Confirm Cash Payment
                  </>
                )}
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="flex items-start space-x-2 text-sm text-gray-500">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Your payment is secure and encrypted. We use Razorpay for safe transactions.</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentModal;


