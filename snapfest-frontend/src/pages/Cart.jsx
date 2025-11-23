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
import { GlassCard, ScrollReveal, LoadingSkeleton, StepWizard } from '../components/enhanced';
import { priceCalculator } from '../utils';
import { paymentAPI } from '../services/api';
import { paymentService } from '../services/paymentService';
import toast from 'react-hot-toast';
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
      
      // Process all items (both packages and BeatBloom)
      const allItems = cart.items;
      
      if (allItems.length === 0) {
        toast.error('Your cart is empty. Please add items before proceeding to checkout.');
        setIsProcessingPayment(false);
        return;
      }
      
      const bookingPromises = allItems.map(async (item) => {
        // Debug the item structure
        console.log('🛒 Cart: Item structure:', item);
        console.log('🛒 Cart: Item type:', item.itemType || 'package');
        console.log('🛒 Cart: Item packageId:', item.packageId);
        console.log('🛒 Cart: Item beatBloomId:', item.beatBloomId);
        
        const itemType = item.itemType || 'package';
        let bookingData;
        
        if (itemType === 'beatbloom') {
          // Handle BeatBloom items
          const beatBloomId = item.beatBloomId?._id || item.beatBloomId;
          
          if (!beatBloomId) {
            throw new Error(`BeatBloom ID not found for cart item: ${item._id}`);
          }
          
          bookingData = {
            beatBloomId: beatBloomId,
            eventDate: item.eventDate,
            location: item.location,
            guests: item.guests || 1,
            customization: item.customization || '',
            paymentPercentage: paymentPercentage // Include payment percentage
          };
        } else {
          // Handle package items (existing functionality)
          const packageId = item.packageId?._id || item.packageId;
          
          if (!packageId) {
            throw new Error(`Package ID not found for cart item: ${item._id}`);
          }
          
          bookingData = {
            packageId: packageId,
            eventDate: item.eventDate,
            location: item.location,
            guests: item.guests,
            customization: item.customization || '',
            paymentPercentage: paymentPercentage // Include payment percentage
          };
        }

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
        console.log('🛒 Cart: Booking remaining amount:', result.data.booking.remainingAmount);
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
        
        // Calculate initial payment amount based on paymentPercentage
        const initialPaymentAmount = Math.round(booking.totalAmount * (paymentPercentage / 100));
        console.log('🛒 Cart: Processing initial payment for booking:', booking._id, 'Amount:', initialPaymentAmount);
        
        // Validate amount
        if (!initialPaymentAmount || initialPaymentAmount <= 0) {
          throw new Error(`Invalid initial payment amount: ${initialPaymentAmount}`);
        }

        // Create partial payment order
        console.log('🛒 Cart: Creating payment order for booking:', booking._id, 'Amount:', initialPaymentAmount);
        
        const requestData = {
          bookingId: booking._id,
          amount: initialPaymentAmount
        };
        
        console.log('🛒 Cart: Sending payment order request:', requestData);
        
        const orderResponse = await paymentAPI.createPartialPaymentOrder(requestData, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('🛒 Cart: Payment order response:', orderResponse);

        if (!orderResponse.data.success) {
          console.error('🛒 Cart: Payment order creation failed:', orderResponse);
          console.error('🛒 Cart: Booking ID used:', booking._id);
          console.error('🛒 Cart: Amount used:', initialPaymentAmount);
          throw new Error(orderResponse.data.message || 'Failed to create payment order');
        }

        const orderData = orderResponse.data.data;
        console.log('🛒 Cart: Created payment order:', orderData);

        // Open Razorpay checkout
        const paymentResult = await paymentService.openCheckout(
          orderData.order.id,
          initialPaymentAmount,
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

      // Step 3: Clear cart
      await clearCart();
      
      // Navigate to payment success page (same as Book Now flow)
      // Use first booking data for success page display
      if (paymentResults && paymentResults.length > 0) {
        const firstResult = paymentResults[0];
        // verifyResponse.data.data contains { payment, booking, remainingAmount }
        const booking = firstResult.booking;
        const remainingAmount = firstResult.remainingAmount || booking?.remainingAmount || 0;
        const amount = firstResult.payment?.amount || booking?.amountPaid || (booking?.totalAmount * (paymentPercentage / 100));
        
        if (booking && booking._id) {
          navigate('/payment/success', { 
            state: { 
              bookingId: booking._id,
              amount: amount,
              remainingAmount: remainingAmount
            }
          });
        } else {
          // Fallback to bookings page if booking data is missing
          navigate('/user/bookings');
        }
      } else {
        // Fallback to bookings page if no payment results
        navigate('/user/bookings');
      }

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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSkeleton type="card" count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <div className="text-red-600 mb-4">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Cart</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600">
            Try Again
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ScrollReveal direction="up">
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-200 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <ShoppingCart className="w-16 h-16 text-pink-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-4">Your Cart is Empty</h1>
              <p className="text-xl text-gray-600 mb-8">
                Add some photography packages to get started
              </p>
              <Link to="/packages">
                <Button size="lg" className="px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Package className="w-5 h-5 mr-2" />
                  Browse Packages
                </Button>
              </Link>
            </div>
          </ScrollReveal>
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      {/* Enhanced Header */}
      <ScrollReveal direction="down">
        <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">Shopping Cart</h1>
                <p className="text-gray-600 mt-1">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 transition-all duration-300 hover:scale-105"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart?.items?.length > 0 ? (
              <>
                {console.log('🛒 Cart: Rendering cart items:', cart.items)}
                {cart.items.map((item) => {
              try {
                // Determine item type (backward compatible: default to 'package')
                const itemType = item.itemType || 'package';
                
                // Get item data based on type
                let itemData, itemTitle, itemDescription, itemImage, itemPrice;
                
                if (itemType === 'package') {
                  if (!item.packageId || !item.packageId.title) {
                    console.warn('🛒 Cart: Invalid package data for item:', item._id);
                    return null; // Skip rendering this item
                  }
                  itemData = item.packageId;
                  itemTitle = itemData.title;
                  itemDescription = itemData.description;
                  itemImage = itemData.images?.[0];
                  const basePrice = itemData.basePrice || 0;
                  const perGuestPrice = itemData.perGuestPrice || 0;
                  itemPrice = basePrice + (perGuestPrice * (item.guests || 1));
                } else if (itemType === 'beatbloom') {
                  if (!item.beatBloomId || !item.beatBloomId.title) {
                    console.warn('🛒 Cart: Invalid beatbloom data for item:', item._id);
                    return null; // Skip rendering this item
                  }
                  itemData = item.beatBloomId;
                  itemTitle = itemData.title;
                  itemDescription = itemData.description;
                  itemImage = itemData.primaryImage || itemData.images?.[0];
                  itemPrice = itemData.price || 0;
                } else {
                  return null; // Unknown item type
                }

              return (
                <ScrollReveal key={item._id} direction="up" delay={0.1}>
                  <GlassCard className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                    {/* Item Image */}
                    <div className="md:w-48 flex-shrink-0">
                      <img
                        src={itemImage || '/api/placeholder/300/200'}
                        alt={itemTitle}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {itemTitle}
                            </h3>
                            <Badge variant="secondary" size="sm">
                              {itemType === 'beatbloom' ? 'Service' : 'Package'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {itemDescription}
                          </p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                          {itemType === 'package' ? (
                            <>
                              Base: {formatPrice(itemData.basePrice || 0)}
                              {itemData.perGuestPrice > 0 && (
                                <>
                                  <span className="mx-2">+</span>
                                  <span>Per Guest: {formatPrice(itemData.perGuestPrice)} × {item.guests || 1}</span>
                                </>
                              )}
                            </>
                          ) : (
                            <span>Service Price: {formatPrice(itemData.price || 0)}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary-600">
                            {formatPrice(itemPrice)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
                </ScrollReveal>
              );
              } catch (error) {
                console.error('🛒 Cart: Error rendering item:', error);
                return (
                  <ScrollReveal key={item._id} direction="up" delay={0.1}>
                    <GlassCard className="p-6">
                      <div className="text-center text-red-600">
                        <p>Error loading cart item</p>
                        <p className="text-sm">{error.message}</p>
                      </div>
                    </GlassCard>
                  </ScrollReveal>
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
            <ScrollReveal direction="left" delay={0.2}>
              <GlassCard className="p-6 sticky top-8">
                <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-4">Order Summary</h3>
              
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

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <div className="text-sm text-blue-900">
                      <div className="font-bold mb-2 text-blue-800">Payment Summary:</div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Initial Payment ({paymentPercentage}%):</span>
                        <span className="font-bold text-lg text-pink-600">
                          {formatPrice((cartTotal.total + cartTotal.tax) * (paymentPercentage / 100))}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-blue-700 mt-2 pt-2 border-t border-blue-200">
                        <span>Remaining ({100 - paymentPercentage}%):</span>
                        <span className="font-semibold">
                          {formatPrice((cartTotal.total + cartTotal.tax) * ((100 - paymentPercentage) / 100))}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mt-2 italic">
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
                        Pay {paymentPercentage}% ({formatPrice((cartTotal.total + cartTotal.tax) * (paymentPercentage / 100))})
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
            </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;