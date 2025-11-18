import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { 
  ShoppingCart, 
  Trash2, 
  Calendar, 
  MapPin,
  CreditCard,
  ArrowRight,
  Package,
  Users,
  Clock,
  Loader2
} from 'lucide-react';
import { useCart } from '../hooks';
import { Card, Button, Badge } from '../components/ui';
import { priceCalculator } from '../utils';
import { paymentAPI } from '../services/api';
import { paymentService } from '../services/paymentService';
// Debug components removed - cart is now working

const Cart = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { getToken } = useClerkAuth();
  const { cart, loading, error, removeFromCart, clearCart, calculateTotal, refreshCart } = useCart();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentPercentage, setPaymentPercentage] = useState(20); // Default 20%, can be 20-100%

  // Debug cart data
  useEffect(() => {
    console.log('🛒 Cart: Component mounted');
    console.log('🛒 Cart: Cart data:', cart);
    console.log('🛒 Cart: Cart items:', cart?.items);
    console.log('🛒 Cart: Cart total amount:', cart?.totalAmount);
    console.log('🛒 Cart: Cart item count:', cart?.itemCount);
    console.log('🛒 Cart: Loading:', loading);
    console.log('🛒 Cart: Error:', error);
  }, [cart, loading, error]);

  // Cart component ready


  useEffect(() => {
    if (!isSignedIn) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
  }, [isSignedIn, navigate]);



  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
      // Show success message
      alert('Item removed from cart successfully!');
    } catch (error) {
      console.error('🛒 Cart: Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const handleCheckout = async () => {
    console.log('🛒 Cart: Starting payment process...');
    console.log('🛒 Cart: Current cart:', cart);
    console.log('🛒 Cart: Cart items:', cart?.items);
    console.log('🛒 Cart: Item count:', cart?.items?.length);
    
    if (!cart || !cart.items || cart.items.length === 0) {
      alert('Your cart is empty. Please add items before proceeding to checkout.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const authToken = await getToken();

      // Step 1: Create booking for each cart item
      console.log('🛒 Cart: Creating bookings...');
      console.log('🛒 Cart: Cart items structure:', cart.items);
      
      const bookingPromises = cart.items.map(async (item) => {
        // Debug the item structure
        console.log('🛒 Cart: Item structure:', item);
        console.log('🛒 Cart: Item packageId:', item.packageId);
        console.log('🛒 Cart: Item package:', item.package);
        
        const packageId = item.packageId?._id || item.packageId;
        
        if (!packageId) {
          throw new Error(`Package ID not found for cart item: ${item._id}`);
        }
        
        const bookingData = {
          packageId: packageId,
          eventDate: item.eventDate,
          location: item.location,
          guests: item.guests,
          customization: item.customization || '',
          paymentPercentage: paymentPercentage // Include payment percentage
        };

        console.log('🛒 Cart: Creating booking for item:', bookingData);
        
        const response = await fetch('http://localhost:5001/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();
        console.log('🛒 Cart: Booking creation response:', result);
        
        if (!response.ok) {
          console.error('🛒 Cart: Booking creation failed:', result);
          throw new Error(result.message || 'Failed to create booking');
        }

        console.log('🛒 Cart: Booking created successfully:', result.data);
        console.log('🛒 Cart: Booking data structure:', result.data.booking);
        console.log('🛒 Cart: Booking ID:', result.data.booking._id);
        console.log('🛒 Cart: Booking partial amount:', result.data.booking.partialAmount);
        return result.data;
      });

      const bookingResponses = await Promise.all(bookingPromises);
      console.log('🛒 Cart: Created booking responses:', bookingResponses);

      // Extract actual booking data from responses
      const bookings = bookingResponses.map(response => response.booking);
      console.log('🛒 Cart: Extracted bookings:', bookings);

      // Step 2: Process partial payment for each booking
      const paymentPromises = bookings.map(async (booking) => {
        // Validate booking data
        if (!booking || !booking._id) {
          throw new Error('Invalid booking data received');
        }
        
        const partialAmount = booking.partialAmount;
        console.log('🛒 Cart: Processing partial payment for booking:', booking._id, 'Amount:', partialAmount);
        
        // Validate amount
        if (!partialAmount || partialAmount <= 0) {
          throw new Error(`Invalid partial amount: ${partialAmount}`);
        }

        // Create partial payment order
        console.log('🛒 Cart: Creating payment order for booking:', booking._id, 'Amount:', partialAmount);
        
        const requestData = {
          bookingId: booking._id,
          amount: partialAmount
        };
        
        console.log('🛒 Cart: Sending payment order request:', requestData);
        
        const orderResponse = await paymentAPI.createPartialPaymentOrder(requestData, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('🛒 Cart: Payment order response:', orderResponse);

        if (!orderResponse.data.success) {
          console.error('🛒 Cart: Payment order creation failed:', orderResponse);
          console.error('🛒 Cart: Booking ID used:', booking._id);
          console.error('🛒 Cart: Amount used:', partialAmount);
          throw new Error(orderResponse.data.message || 'Failed to create payment order');
        }

        const orderData = orderResponse.data.data;
        console.log('🛒 Cart: Created payment order:', orderData);

        // Open Razorpay checkout
        const paymentResult = await paymentService.openCheckout(
          orderData.order.id,
          partialAmount,
          'INR',
          `SnapFest - ${booking.packageId?.title || 'Photography Package'}`,
          `Initial payment (${paymentPercentage}%) for ${booking.packageId?.title || 'Photography Package'}`,
          {
            name: user?.fullName || 'Customer',
            email: user?.primaryEmailAddress?.emailAddress || '',
            contact: user?.phoneNumbers?.[0]?.phoneNumber || ''
          }
        );

        console.log('🛒 Cart: Payment result:', paymentResult);

        // Verify payment
        const verifyResponse = await paymentAPI.verifyPayment({
          bookingId: booking._id,
          paymentId: paymentResult.razorpay_payment_id,
          orderId: paymentResult.razorpay_order_id,
          signature: paymentResult.razorpay_signature
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!verifyResponse.data.success) {
          throw new Error(verifyResponse.data.message || 'Payment verification failed');
        }

        console.log('🛒 Cart: Payment verified successfully for booking:', booking._id);
        return verifyResponse.data.data;
      });

      const paymentResults = await Promise.all(paymentPromises);
      console.log('🛒 Cart: All payments processed successfully:', paymentResults);

      // Step 3: Clear cart and show success
      await clearCart();
      
      alert('Payment successful! Your bookings have been confirmed. You will receive an email confirmation shortly.');
      
      // Navigate to bookings page
      navigate('/bookings');

    } catch (error) {
      console.error('🛒 Cart: Payment error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
      alert(`Payment failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatPrice = (amount) => {
    try {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return '₹0';
      }
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      console.error('🛒 Cart: Error formatting price:', error);
      return '₹0';
    }
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
            <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Cart</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Debug components removed - cart is now working */}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-xl text-gray-600 mb-8">
              Add some photography packages to get started
            </p>
            <Link to="/packages">
              <Button size="lg" className="px-8 py-4">
                <Package className="w-5 h-5 mr-2" />
                Browse Packages
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Use database values for cart total instead of recalculating
  const cartTotal = {
    itemCount: cart?.itemCount || cart?.items?.length || 0,
    total: cart?.totalAmount || 0,
    subtotal: cart?.totalAmount || 0,
    addOnsTotal: 0,
    travelFee: 0,
    tax: (cart?.totalAmount || 0) * 0.18,
  };
  const { itemCount, total } = cartTotal;
  
  console.log('🛒 Cart: Cart total calculation:', cartTotal);
  console.log('🛒 Cart: Item count:', itemCount);
  console.log('🛒 Cart: Total:', total);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug components removed - cart is now working */}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart?.items?.length > 0 ? (
              <>
                {console.log('🛒 Cart: Rendering cart items:', cart.items)}
                {cart.items.map((item) => {
              try {
                // Check if package data exists and is valid
                if (!item.packageId || !item.packageId.title) {
                  console.warn('🛒 Cart: Invalid package data for item:', item._id);
                  return null; // Skip rendering this item
                }
                
                const packageData = item.packageId;
                
                // Calculate item pricing using database values with null checks
                const basePrice = packageData.basePrice || 0;
                const perGuestPrice = packageData.perGuestPrice || 0;
                const guests = item.guests || 1;
                const itemTotal = basePrice + (perGuestPrice * guests);

              return (
                <Card key={item._id} className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Package Image */}
                    <div className="md:w-48 flex-shrink-0">
                      <img
                        src={packageData.images?.[0] || '/api/placeholder/300/200'}
                        alt={packageData.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>

                    {/* Package Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {packageData.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {packageData.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              Max {packageData.maxGuests || 50} guests
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {packageData.features?.[0] || 'Professional service'}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Item Details Display */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <strong>Guests:</strong> {item.guests || 1}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <strong>Date:</strong> {item.eventDate ? new Date(item.eventDate).toLocaleDateString() : 'Not set'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <strong>Location:</strong> {item.location || 'Not set'}
                          </span>
                        </div>
                      </div>

                      {/* Special Requests Display */}
                      {item.specialRequests && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            <strong>Special Requests:</strong> {item.specialRequests}
                          </p>
                        </div>
                      )}

                      {/* Price Display */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Base: {formatPrice(basePrice || 0)} + Per Guest: {formatPrice(perGuestPrice || 0)} × {item.guests || 1}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary-600">
                            {formatPrice(itemTotal || 0)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Total for {item.guests || 1} guests
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
              } catch (error) {
                console.error('🛒 Cart: Error rendering item:', error);
                return (
                  <Card key={item._id} className="p-6">
                    <div className="text-center text-red-600">
                      <p>Error loading cart item</p>
                      <p className="text-sm">{error.message}</p>
                    </div>
                  </Card>
                );
              }
            })}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Package className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Add some packages to get started!</p>
                  <Link to="/packages">
                    <Button variant="primary" className="px-6 py-3">
                      Browse Packages
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              {cart?.items?.length > 0 ? (
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                    <span>{formatPrice(cartTotal.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (18%)</span>
                    <span>{formatPrice(cartTotal.tax)}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-primary-600">{formatPrice(cartTotal.total + cartTotal.tax)}</span>
                  </div>
                  
                  {/* Payment Percentage Selector */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Initial Payment Percentage: <span className="text-primary-600 font-semibold">{paymentPercentage}%</span>
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      step="5"
                      value={paymentPercentage}
                      onChange={(e) => setPaymentPercentage(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>20%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <div className="font-semibold mb-1">Payment Summary:</div>
                      <div className="flex justify-between">
                        <span>Initial Payment ({paymentPercentage}%):</span>
                        <span className="font-semibold">
                          {formatPrice((cartTotal.total + cartTotal.tax) * (paymentPercentage / 100))}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-blue-600 mt-1">
                        <span>Remaining ({100 - paymentPercentage}%):</span>
                        <span>
                          {formatPrice((cartTotal.total + cartTotal.tax) * ((100 - paymentPercentage) / 100))}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        * Remaining amount to be paid later
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No items in cart</p>
                </div>
              )}

              {cart?.items?.length > 0 && (
                <div className="space-y-3">
                  <Button
                    onClick={handleCheckout}
                    className="w-full"
                    size="lg"
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay {paymentPercentage}% (₹{formatPrice((cartTotal.total + cartTotal.tax) * (paymentPercentage / 100))})
                      </>
                    )}
                  </Button>
                  
                  {paymentError && (
                    <div className="text-red-600 text-sm text-center">
                      {paymentError}
                    </div>
                  )}
                  
                  <Link to="/packages">
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              )}

              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t">
                <div className="text-center text-sm text-gray-600">
                  <div className="flex items-center justify-center space-x-4 mb-2">
                    <span>🔒 Secure Payment</span>
                    <span>📱 Mobile Friendly</span>
                  </div>
                  <p>Your payment information is secure and encrypted</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;