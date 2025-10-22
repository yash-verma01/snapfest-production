import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Calendar, 
  MapPin,
  CreditCard,
  Package,
  Users,
  Shield,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';

const CartFallback = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart from localStorage as fallback
    const loadCartFromStorage = () => {
      try {
        const storedCart = localStorage.getItem('snapfest_cart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartItems(parsedCart.items || []);
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCartFromStorage();
  }, []);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const removeItem = (itemId) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    
    // Update localStorage
    localStorage.setItem('snapfest_cart', JSON.stringify({ items: updatedItems }));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = (item.basePrice || 0) + ((item.perGuestPrice || 0) * (item.guests || 1));
      return total + itemTotal;
    }, 0);
  };

  const handleCheckout = () => {
    // Navigate to checkout with cart data
    navigate('/checkout', { state: { cartItems } });
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-xl text-gray-600 mb-8">
              Add some packages to get started
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Offline Mode</h3>
                <p className="text-sm text-yellow-700">
                  Cart is loaded from local storage. Some features may be limited.
                </p>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Shopping Cart</h1>
          <p className="text-gray-600">Review your selected packages and proceed to checkout</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-6">
                    {/* Package Image */}
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.title}
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
                            {item.title || 'Package'}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {item.description || 'No description available'}
                          </p>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="secondary" size="sm">
                              {item.category || 'GENERAL'}
                            </Badge>
                            {item.isPremium && (
                              <Badge variant="primary" size="sm">
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
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

                      {/* Price Details */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          <span>Base Price: {formatPrice(item.basePrice || 0)}</span>
                          <span className="mx-2">+</span>
                          <span>Per Guest: {formatPrice(item.perGuestPrice || 0)}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatPrice((item.basePrice || 0) + ((item.perGuestPrice || 0) * (item.guests || 1)))}
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
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-gray-500">{item.guests || 1} guests</p>
                    </div>
                    <span className="font-medium">
                      {formatPrice((item.basePrice || 0) + ((item.perGuestPrice || 0) * (item.guests || 1)))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-6 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatPrice(calculateTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee (5%):</span>
                  <span className="font-medium">{formatPrice(calculateTotal() * 0.05)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%):</span>
                  <span className="font-medium">{formatPrice(calculateTotal() * 0.18)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotal() * 1.23)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
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

export default CartFallback;


