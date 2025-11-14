import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, Heart, Share2, CheckCircle, ShoppingCart, Calendar, Phone, Mail, ArrowRight } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { publicAPI } from '../services/api';
import { useAuth } from '@clerk/clerk-react';

const BeatBloomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [beatBloom, setBeatBloom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);

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

  const handleAddToCart = () => {
    if (!isSignedIn) {
      navigate('/login');
      return;
    }
    // Implement add to cart functionality
    console.log('Adding to cart:', { beatBloomId: id, quantity });
  };

  const handleBookNow = () => {
    if (!isSignedIn) {
      navigate('/login');
      return;
    }
    setShowBookingModal(true);
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
            <Card className="sticky top-8 p-6">
              {/* Price */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-pink-600 mb-2">
                  {formatPrice(beatBloom.price)}
                </div>
                <p className="text-gray-600">Starting price</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 text-lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                
                <Button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-3 text-lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
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
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
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
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Book This Service</h3>
            <p className="text-gray-600 mb-6">
              You are about to book <strong>{beatBloom.title}</strong> for <strong>{formatPrice(beatBloom.price)}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Time</label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                <textarea
                  placeholder="Any special requirements or notes..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowBookingModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Implement booking logic
                  console.log('Booking service:', { beatBloomId: id, date: '', time: '' });
                  setShowBookingModal(false);
                }}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeatBloomDetail;

