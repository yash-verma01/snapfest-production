import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Calendar, 
  MapPin,
  CreditCard,
  ArrowRight,
  Package,
  Users,
  Clock,
  Shield
} from 'lucide-react';
import { useCart } from '../hooks';
import { Card, Button, Badge } from '../components/ui';

const CartTest = () => {
  const navigate = useNavigate();
  const { cart, loading, error, updateCartItem, removeFromCart, clearCart, calculateTotal } = useCart();
  const [customizations, setCustomizations] = useState({});


  useEffect(() => {
    if (cart?.items) {
      const initialCustomizations = {};
      cart.items.forEach(item => {
        initialCustomizations[item._id] = {
          guests: item.guests || 1,
          eventDate: item.eventDate || '',
          location: item.location || '',
          specialRequests: item.specialRequests || '',
          theme: item.theme || '',
          cake: item.cake || '',
          decorations: item.decorations || '',
          music: item.music || '',
          photography: item.photography || ''
        };
      });
      setCustomizations(initialCustomizations);
    }
  }, [cart]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
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
            <p className="text-gray-600 mb-4">{error}</p>
            {error.includes('Too many requests') && (
              <p className="text-sm text-gray-500 mb-4">
                The server is experiencing high traffic. Please wait a moment and try again.
              </p>
            )}
            {error.includes('log in') && (
              <p className="text-sm text-gray-500 mb-4">
                You need to be logged in to view your cart.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/packages')} 
              className="w-full"
            >
              Browse Packages
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
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

  const handleCheckout = () => {
    console.log('Proceeding to checkout...');
    // TODO: Implement checkout flow with payment gateway
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Shopping Cart</h1>
          <p className="text-gray-600">Review your selected packages and proceed to checkout</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {cart.items.map((item) => (
                <Card key={item._id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-6">
                    {/* Package Image */}
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.package?.images?.[0] ? (
                        <img 
                          src={item.package.images[0]} 
                          alt={item.package.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Package Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {item.package?.title || 'Package'}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {item.package?.description || 'No description available'}
                          </p>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="secondary" size="sm">
                              {item.package?.category || 'GENERAL'}
                            </Badge>
                            {item.package?.isPremium && (
                              <Badge variant="primary" size="sm">
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Event Details */}
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
                            <strong>Date:</strong> {item.eventDate || 'Not set'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <strong>Location:</strong> {item.location || 'Not set'}
                          </span>
                        </div>
                      </div>

                      {/* Special Requests */}
                      {item.specialRequests && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            <strong>Special Requests:</strong> {item.specialRequests}
                          </p>
                        </div>
                      )}

                      {/* Package Features */}
                      {item.package?.features && item.package.features.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Package Features:</p>
                          <div className="flex flex-wrap gap-2">
                            {item.package.features.slice(0, 4).map((feature, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                              >
                                {feature}
                              </span>
                            ))}
                            {item.package.features.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{item.package.features.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price Details */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          <span>Base Price: {formatPrice(item.package?.basePrice || 0)}</span>
                          <span className="mx-2">+</span>
                          <span>Per Guest: {formatPrice(item.package?.perGuestPrice || 0)}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatPrice((item.package?.basePrice || 0) + ((item.package?.perGuestPrice || 0) * (item.guests || 1)))}
                          </p>
                          <p className="text-sm text-gray-500">Total for {item.guests || 1} guests</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Items Breakdown */}
              <div className="space-y-3 mb-6">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.package?.title}</p>
                      <p className="text-gray-500">{item.guests || 1} guests</p>
                    </div>
                    <span className="font-medium">
                      {formatPrice((item.package?.basePrice || 0) + ((item.package?.perGuestPrice || 0) * (item.guests || 1)))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-6 border-t border-gray-200 pt-4">
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
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>{formatPrice((cart.totalAmount || 0) * 1.23)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={cart.items.length === 0}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Proceed to Checkout
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

export default CartTest;
