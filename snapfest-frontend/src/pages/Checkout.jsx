import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  MapPin, 
  Calendar, 
  Users, 
  Phone, 
  Mail, 
  Shield,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge } from '../components/ui';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, loading, error } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    console.log('💳 Checkout: Component mounted');
    console.log('💳 Checkout: Cart data:', cart);
    console.log('💳 Checkout: Loading:', loading);
    console.log('💳 Checkout: Error:', error);
    
    if (!cart || cart.items.length === 0) {
      console.log('💳 Checkout: No cart or empty cart, redirecting to cart page');
      navigate('/cart');
      return;
    }
  }, [cart, navigate]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateTotal = () => {
    const subtotal = cart.totalAmount || 0;
    const serviceFee = subtotal * 0.05;
    const gst = subtotal * 0.18;
    return subtotal + serviceFee + gst;
  };

  const handlePayment = async () => {
    console.log('💳 Checkout: Starting payment process...');
    console.log('💳 Checkout: Cart items:', cart.items);
    
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // For each cart item, create a booking and process partial payment
      const bookingPromises = cart.items.map(async (item) => {
        const itemType = item.itemType || 'package';
        let bookingData;
        
        if (itemType === 'beatbloom') {
          // Handle BeatBloom items
          bookingData = {
            beatBloomId: item.beatBloomId?._id || item.beatBloomId,
            eventDate: item.eventDate,
            location: item.location,
            guests: item.guests || 1,
            customization: item.customization || ''
          };
        } else {
          // Handle package items (existing functionality)
          bookingData = {
            packageId: item.packageId?._id || item.package?._id,
            eventDate: item.eventDate,
            location: item.location,
            guests: item.guests,
            customization: item.customization || ''
          };
        }

        console.log('💳 Checkout: Creating booking...', bookingData);
        
        // Create booking
        const bookingResponse = await fetch('http://localhost:5001/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(bookingData)
        });

        const bookingResult = await bookingResponse.json();
        console.log('💳 Checkout: Booking created:', bookingResult);

        if (!bookingResult.success) {
          throw new Error(bookingResult.message || 'Failed to create booking');
        }

        const booking = bookingResult.data.booking;
        
        // Create partial payment order
        const paymentData = {
          bookingId: booking._id
        };

        console.log('💳 Checkout: Creating partial payment order...', paymentData);
        
        const paymentResponse = await fetch('http://localhost:5001/api/payments/create-order/partial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(paymentData)
        });

        const paymentResult = await paymentResponse.json();
        console.log('💳 Checkout: Payment order created:', paymentResult);

        if (!paymentResult.success) {
          throw new Error(paymentResult.message || 'Failed to create payment order');
        }

        return {
          booking,
          payment: paymentResult.data,
          order: paymentResult.data.order
        };
      });

      // Wait for all bookings and payment orders to be created
      const results = await Promise.all(bookingPromises);
      console.log('💳 Checkout: All bookings and payments created:', results);

      // Process the first payment (for simplicity, we'll handle one at a time)
      const firstResult = results[0];
      
      // Initialize Razorpay payment
      // Ensure minimum amount for UPI payments (₹50 minimum for better UPI support)
      const minAmount = Math.max(firstResult.payment.amount, 50);
      const amountInPaise = minAmount * 100;
      
      const options = {
        key: 'rzp_test_RWpCivnUSkVbTS',
        amount: amountInPaise, // Convert to paise
        currency: 'INR',
        name: 'SnapFest',
        description: `Partial payment for ${cart.items.length} package(s)`,
        order_id: firstResult.order.id,
        handler: async (response) => {
          console.log('💳 Checkout: Payment successful:', response);
          
          try {
            // Verify payment
            const verifyResponse = await fetch('http://localhost:5001/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            });

            const verifyResult = await verifyResponse.json();
            console.log('💳 Checkout: Payment verified:', verifyResult);

            if (verifyResult.data.success) {
              // Payment successful - redirect to success page
              navigate('/payment/success', { 
                state: { 
                  bookingId: firstResult.booking._id,
                  amount: firstResult.payment.amount,
                  remainingAmount: verifyResult.data.data.remainingAmount
                }
              });
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (verifyError) {
            console.error('💳 Checkout: Payment verification error:', verifyError);
            setPaymentError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#e91e63' // Pink theme to match SnapFest
        },
        // Enable all payment methods including UPI
        notes: {
          source: 'snapfest_web'
        },
        // Additional options for better UPI support
        retry: {
          enabled: true,
          max_count: 3
        },
        modal: {
          ondismiss: () => {
            console.log('💳 Checkout: Payment modal dismissed');
            setIsProcessing(false);
          }
        }
      };

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        };
        document.body.appendChild(script);
      } else {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error('💳 Checkout: Payment error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Checkout Error</h3>
          <p className="text-gray-600 mb-4">
            {error || 'Your cart is empty. Please add items to proceed.'}
          </p>
          <Button onClick={() => navigate('/cart')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/cart')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{user?.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{user?.phone || 'Not provided'}</span>
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {(item.itemType || 'package') === 'beatbloom' 
                          ? (item.beatBloomId?.title || 'Service')
                          : (item.packageId?.title || item.package?.title || 'Package')
                        }
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.guests} guests • {item.eventDate} • {item.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {(() => {
                          const itemType = item.itemType || 'package';
                          if (itemType === 'beatbloom') {
                            return formatPrice(item.beatBloomId?.price || 0);
                          } else {
                            return formatPrice((item.packageId?.basePrice || item.package?.basePrice || 0) + ((item.packageId?.perGuestPrice || item.package?.perGuestPrice || 0) * (item.guests || 1)));
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-primary-600"
                  />
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Credit/Debit Card</p>
                    <p className="text-sm text-gray-600">Pay securely with Razorpay</p>
                  </div>
                </label>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatPrice(cart.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee (5%):</span>
                  <span className="font-medium">{formatPrice((cart.totalAmount || 0) * 0.05)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%):</span>
                  <span className="font-medium">{formatPrice((cart.totalAmount || 0) * 0.18)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              {/* Payment Error */}
              {paymentError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">{paymentError}</span>
                  </div>
                </div>
              )}

              {/* Pay Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay {formatPrice(calculateTotal())}
                  </>
                )}
              </Button>

              {/* Security Notice */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                <Shield className="w-4 h-4 inline mr-1" />
                Secure payment powered by Razorpay
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;


