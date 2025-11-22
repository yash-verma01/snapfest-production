import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, Heart, Share2, CheckCircle, ShoppingCart, Calendar, Phone, Mail, ArrowRight, X } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { publicAPI, bookingAPI, paymentAPI } from '../services/api';
import { useUser } from '@clerk/clerk-react';
import { useCart } from '../hooks';
import toast from 'react-hot-toast';

const BeatBloomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const [beatBloom, setBeatBloom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentPercentageModal, setShowPaymentPercentageModal] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [paymentPercentage, setPaymentPercentage] = useState(20); // Default 20%
  const { addToCart, loading: cartLoading } = useCart();

  useEffect(() => {
    loadBeatBloom();
  }, [id]);

  const loadBeatBloom = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.getBeatBloomById(id);
      
      if (response.data.success) {
        setBeatBloom(response.data.data.item);
      } else {
        throw new Error('Failed to load Beat & Bloom service');
      }
    } catch (err) {
      console.error('Error loading Beat & Bloom service:', err);
      setError(err.message);
      // Fallback to dummy data
      setBeatBloom({
        _id: id,
        title: 'DJ Setup & Sound',
        description: 'Professional DJ services with premium sound systems for your special events. Our experienced DJs bring the perfect music to make your celebration unforgettable.',
        price: 15000,
        category: 'ENTERTAINMENT',
        features: [
          'Professional DJ with 5+ years experience',
          'Premium Sound System (JBL/Behringer)',
          'Extensive Music Library (Hindi, English, Regional)',
          'LED Lighting Effects',
          'Wireless Microphone',
          'Sound Check & Setup',
          '6 Hours of Service',
          'Backup Equipment'
        ],
        images: [
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571266028243-e68c766b6900?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
        ],
        rating: 4.8,
        reviewCount: 24,
        isActive: true
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!isSignedIn) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!eventDate) {
      toast.error('Please select an event date');
      return;
    }

    if (!location || location.trim().length < 5) {
      toast.error('Please enter a valid event location (minimum 5 characters)');
      return;
    }

    try {
      await addToCart(beatBloom._id, {}, {
        guests: 1,
        eventDate,
        location: location.trim()
      }, 'beatbloom'); // Pass 'beatbloom' as itemType
      toast.success('Service added to cart successfully!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error(err.response?.data?.message || 'Failed to add service to cart. Please try again.');
    }
  };

  const handleBookNow = () => {
    if (!isSignedIn) {
      toast.error('Please login to book services');
      navigate('/login');
      return;
    }
    
    if (!eventDate) {
      toast.error('Please select an event date before booking');
      return;
    }
    
    if (!location || location.trim().length < 5) {
      toast.error('Please enter a valid event location (minimum 5 characters)');
      return;
    }
    
    // Open payment percentage modal instead of booking modal
    setShowPaymentPercentageModal(true);
  };

  const handleConfirmBooking = async () => {
    // Close modal first
    setShowPaymentPercentageModal(false);
    
    // Create booking directly (not add to cart)
    try {
      // Prepare customization data for backend
      const customizationData = {
        eventTime,
        specialRequirements
      };

      // Step 1: Create booking directly
      const bookingResponse = await bookingAPI.createBooking({
        beatBloomId: id,
        eventDate,
        location: location.trim(),
        guests: 1,
        customization: JSON.stringify(customizationData),
        paymentPercentage: paymentPercentage // Use selected percentage
      });

      if (!bookingResponse.data.success) {
        throw new Error(bookingResponse.data.message || 'Failed to create booking');
      }

      const booking = bookingResponse.data.data.booking;
      console.log('📅 BeatBloomDetail: Booking created:', booking._id);

      // Step 2: Create partial payment order (same as checkout flow)
      const paymentResponse = await paymentAPI.createPartialPaymentOrder({
        bookingId: booking._id
      });

      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.message || 'Failed to create payment order');
      }

      const paymentData = paymentResponse.data.data;
      console.log('💳 BeatBloomDetail: Payment order created:', paymentData.order.id);

      // Step 3: Open Razorpay checkout (same as checkout flow)
      const amountInPaise = paymentData.amount * 100;
      
      const options = {
        key: 'rzp_test_RWpCivnUSkVbTS', // Use same Razorpay key as checkout
        amount: amountInPaise,
        currency: 'INR',
        name: 'SnapFest',
        description: `Partial payment for ${beatBloom.title}`,
        order_id: paymentData.order.id,
        handler: async (response) => {
          console.log('💳 BeatBloomDetail: Payment successful:', response);
          
          try {
            // Step 4: Verify payment (same as checkout - this generates payment ID)
            const verifyResponse = await paymentAPI.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful! Booking confirmed.');
              // Redirect to payment success page (same as checkout)
              navigate('/payment/success', { 
                state: { 
                  bookingId: booking._id,
                  amount: paymentData.amount,
                  remainingAmount: verifyResponse.data.data.remainingAmount
                }
              });
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (verifyError) {
            console.error('💳 BeatBloomDetail: Payment verification error:', verifyError);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.fullName || user?.firstName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
          contact: user?.phoneNumbers?.[0]?.phoneNumber || ''
        },
        theme: {
          color: '#e91e63'
        },
        notes: {
          source: 'snapfest_web'
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        modal: {
          ondismiss: () => {
            console.log('💳 BeatBloomDetail: Payment modal dismissed');
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

    } catch (err) {
      console.error('Error in Book Now:', err);
      
      // Handle specific error types
      if (err.response?.status === 400) {
        toast.error(err.response?.data?.message || 'Invalid request. Please check your input.');
      } else if (err.response?.status === 401) {
        toast.error('Please login to book services');
        navigate('/login');
      } else if (err.response?.status === 404) {
        toast.error('Service not found. Please try again.');
      } else if (err.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(err.message || 'Failed to create booking. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !beatBloom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The service you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/beatbloom')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/beatbloom')}
              variant="outline"
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative">
                <img
                  src={beatBloom.images?.[selectedImage] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'}
                  alt={beatBloom.title}
                  className="w-full h-96 object-cover rounded-2xl shadow-xl"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-pink-500 text-white text-sm px-3 py-1">
                    {beatBloom.category}
                  </Badge>
                </div>
              </div>
              
              {/* Thumbnail Images */}
              {beatBloom.images && beatBloom.images.length > 1 && (
                <div className="flex space-x-2 mt-4">
                  {beatBloom.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? 'border-pink-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${beatBloom.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="space-y-8">
              {/* Title and Rating */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{beatBloom.title}</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-lg font-semibold">{beatBloom.rating}</span>
                    <span className="ml-1 text-gray-600">({beatBloom.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    2-4 hours
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">About This Service</h2>
                <p className="text-gray-700 leading-relaxed">{beatBloom.description}</p>
              </div>

              {/* Features */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {beatBloom.features?.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Pricing Card */}
              <Card className="p-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Service Pricing</h3>
                  <div className="text-2xl font-bold text-pink-600">
                    {formatPrice(beatBloom.price)}
                  </div>
                </div>
              </Card>

              {/* Event Details Card */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Location *
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter event location (e.g., Hotel Grand, Mumbai)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 5 characters required</p>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {cartLoading ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Now
                </Button>
              </div>

              {/* Contact Info */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-3" />
                    <span>+91 98765 43210</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-3" />
                    <span>support@snapfest.com</span>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link to="/beatbloom" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Browse More Services
                    </Button>
                  </Link>
                  <Link to="/packages" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View Complete Packages
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Percentage Modal */}
      {showPaymentPercentageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Payment Percentage</h3>
              <button
                onClick={() => setShowPaymentPercentageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Initial Payment Percentage: <span className="text-pink-600 font-semibold">{paymentPercentage}%</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={paymentPercentage}
                  onChange={(e) => setPaymentPercentage(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>20%</span>
                  <span>100%</span>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <div className="font-semibold mb-1">Payment Summary:</div>
                    <div className="flex justify-between">
                      <span>Initial Payment ({paymentPercentage}%):</span>
                      <span className="font-semibold">
                        {formatPrice((beatBloom.price * paymentPercentage) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Remaining ({100 - paymentPercentage}%):</span>
                      <span className="font-semibold">
                        {formatPrice((beatBloom.price * (100 - paymentPercentage)) / 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentPercentageModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeatBloomDetail;

