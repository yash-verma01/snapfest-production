import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Users, 
  Clock, 
  MapPin, 
  Camera, 
  Heart, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Check,
  ShoppingCart,
  Calendar,
  Plus,
  Minus,
  Crown,
  Award,
  Sparkles,
  Video,
  Music,
  Car,
  Utensils,
  Palette
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { useUser } from '@clerk/clerk-react';
import { useCart } from '../hooks';
import { publicAPI } from '../services/api';
import toast from 'react-hot-toast';

const PackageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { addToCart, loading: cartLoading } = useCart();
  
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [guests, setGuests] = useState(1);
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCustomizations, setSelectedCustomizations] = useState({});
  const [removedFeatures, setRemovedFeatures] = useState({});
  const [customization, setCustomization] = useState({});

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getPackageById(id);
        
        if (response.data.success) {
          setPackageData(response.data.data.package);
        } else {
          setError('Package not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch package details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPackage();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!isSignedIn) {
      toast.error('Please login to add items to cart');
      navigate('/sign-in');
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
      // Prepare customization data for backend
      const customizationData = {
        selectedCustomizations,
        customizations: Object.keys(selectedCustomizations).map(key => ({
          optionId: key,
          quantity: selectedCustomizations[key].quantity,
          price: selectedCustomizations[key].price
        })),
        removedFeatures: Object.keys(removedFeatures).map(key => ({
          name: removedFeatures[key].name,
          price: removedFeatures[key].price
        }))
      };

      // Send data in the format expected by backend
      await addToCart(id, customizationData, { 
        guests,
        eventDate,
        location: location.trim()
      });
      toast.success('Package added to cart successfully!');
    } catch (err) {
      console.error('Add to cart error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Handle specific error types
      if (err.response?.status === 400) {
        toast.error(err.response?.data?.message || 'Invalid request. Please check your input.');
      } else if (err.response?.status === 401) {
        toast.error('Please login to add items to cart');
        navigate('/login');
      } else if (err.response?.status === 404) {
        toast.error('Package not found. Please try again.');
      } else if (err.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(err.message || 'Failed to add to cart');
      }
    }
  };

  const handleBookNow = () => {
    if (!isSignedIn) {
      toast.error('Please login to book packages');
      navigate('/sign-in');
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
    
    // Add to cart first, then redirect to checkout
    handleAddToCart().then(() => {
      navigate('/checkout');
    });
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % packageData.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + packageData.images.length) % packageData.images.length);
  };

  const openImageModal = (index) => {
    setSelectedImage(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const calculateTotal = () => {
    if (!packageData) return 0;
    const baseTotal = packageData.basePrice + (packageData.perGuestPrice * guests);
    const customizationTotal = Object.values(selectedCustomizations).reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    const removedFeaturesTotal = Object.values(removedFeatures).reduce((sum, item) => {
      return sum + item.price;
    }, 0);
    return baseTotal + customizationTotal - removedFeaturesTotal;
  };

  const calculateCustomizationTotal = () => {
    return Object.values(selectedCustomizations).reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  };

  const calculateRemovedFeaturesTotal = () => {
    return Object.values(removedFeatures).reduce((sum, item) => {
      return sum + item.price;
    }, 0);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'WEDDING': <Crown className="w-5 h-5" />,
      'BIRTHDAY': <Sparkles className="w-5 h-5" />,
      'BABY_SHOWER': <Heart className="w-5 h-5" />,
      'DEMISE': <Award className="w-5 h-5" />,
      'HALDI_MEHNDI': <Star className="w-5 h-5" />,
      'CAR_DIGGI_CELEBRATION': <Crown className="w-5 h-5" />,
      'CORPORATE': <Award className="w-5 h-5" />
    };
    return icons[category] || <Camera className="w-5 h-5" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'WEDDING': 'from-pink-500 to-red-500',
      'BIRTHDAY': 'from-blue-500 to-purple-500',
      'BABY_SHOWER': 'from-pink-400 to-blue-400',
      'DEMISE': 'from-gray-500 to-slate-500',
      'HALDI_MEHNDI': 'from-yellow-500 to-orange-500',
      'CAR_DIGGI_CELEBRATION': 'from-purple-500 to-indigo-500',
      'CORPORATE': 'from-gray-600 to-blue-600'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const handleCustomizationToggle = (option) => {
    setSelectedCustomizations(prev => {
      if (prev[option._id]) {
        const newState = { ...prev };
        delete newState[option._id];
        return newState;
      } else {
        return {
          ...prev,
          [option._id]: {
            name: option.name,
            price: option.price,
            quantity: 1
          }
        };
      }
    });
  };

  const handleCustomizationQuantity = (optionId, change) => {
    setSelectedCustomizations(prev => {
      if (!prev[optionId]) return prev;
      
      const newQuantity = Math.max(1, prev[optionId].quantity + change);
      const maxQuantity = packageData?.customizationOptions?.find(opt => opt._id === optionId)?.maxQuantity || 1;
      
      if (newQuantity > maxQuantity) return prev;
      
      return {
        ...prev,
        [optionId]: {
          ...prev[optionId],
          quantity: newQuantity
        }
      };
    });
  };

  const getCustomizationIcon = (category) => {
    const icons = {
      'PHOTOGRAPHY': <Camera className="w-4 h-4" />,
      'VIDEOGRAPHY': <Video className="w-4 h-4" />,
      'DECORATION': <Palette className="w-4 h-4" />,
      'CATERING': <Utensils className="w-4 h-4" />,
      'ENTERTAINMENT': <Music className="w-4 h-4" />,
      'TRANSPORTATION': <Car className="w-4 h-4" />,
      'OTHER': <Star className="w-4 h-4" />
    };
    return icons[category] || <Star className="w-4 h-4" />;
  };

  const handleFeatureToggle = (feature) => {
    setRemovedFeatures(prev => {
      if (prev[feature.name]) {
        const newState = { ...prev };
        delete newState[feature.name];
        return newState;
      } else {
        return {
          ...prev,
          [feature.name]: {
            name: feature.name,
            price: feature.price
          }
        };
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pearl-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pearl-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The package you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/packages')} className="bg-pink-500 hover:bg-pink-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/packages')}
              variant="ghost"
              className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-pink-600">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-pink-600">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Package Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Badge className={`bg-gradient-to-r ${getCategoryColor(packageData.category)} text-white px-3 py-1 text-xs`}>
              {getCategoryIcon(packageData.category)}
              <span className="ml-1">{packageData.category.replace('_', ' ')}</span>
            </Badge>
            {packageData.isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{packageData.title}</h1>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="font-semibold">{packageData.rating.toFixed(1)}</span>
              <span className="ml-1">({packageData.reviewCount})</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 text-blue-500 mr-1" />
              <span>{packageData.bookingCount} bookings</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-green-500 mr-1" />
              <span>{packageData.duration || 'Flexible'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative group">
                <img
                  src={packageData.images[selectedImage] || packageData.primaryImage}
                  alt={packageData.title}
                  className="w-full h-80 object-cover rounded-xl shadow-lg cursor-pointer transition-all duration-200 group-hover:shadow-xl"
                  onClick={() => openImageModal(selectedImage)}
                />
                
                {/* Navigation Arrows */}
                {packageData.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Images */}
              {packageData.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {packageData.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${packageData.title} ${index + 1}`}
                      className={`w-full h-16 object-cover rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedImage === index 
                          ? 'ring-2 ring-pink-500 shadow-md' 
                          : 'hover:opacity-80'
                      }`}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                  {packageData.images.length > 4 && (
                    <div className="w-full h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                      +{packageData.images.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Description Section */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Package</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{packageData.description}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Booking & Customization */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Pricing Card */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Package Pricing</h3>
                  <div className="text-2xl font-bold text-pink-600">
                    {formatPrice(calculateTotal())}
                  </div>
                  <p className="text-gray-500 text-sm">for {guests} guest{guests > 1 ? 's' : ''}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base:</span>
                    <span className="font-medium">{formatPrice(packageData.basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guests ({guests}):</span>
                    <span className="font-medium">{formatPrice(packageData.perGuestPrice * guests)}</span>
                  </div>
                  {calculateCustomizationTotal() > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Add-ons:</span>
                      <span className="font-medium text-pink-600">+{formatPrice(calculateCustomizationTotal())}</span>
                    </div>
                  )}
                  {calculateRemovedFeaturesTotal() > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Savings:</span>
                      <span className="font-medium text-green-600">-{formatPrice(calculateRemovedFeaturesTotal())}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-pink-600">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Date Selection */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guests
                    </label>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        variant="outline"
                        size="sm"
                        disabled={guests <= 1}
                        className="w-8 h-8 rounded-full p-0"
                      >
                        -
                      </Button>
                      <span className="w-12 text-center font-semibold">{guests}</span>
                      <Button
                        onClick={() => setGuests(guests + 1)}
                        variant="outline"
                        size="sm"
                        disabled={guests >= packageData.maxGuests}
                        className="w-8 h-8 rounded-full p-0"
                      >
                        +
                      </Button>
                      {packageData.maxGuests > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                          Max: {packageData.maxGuests}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>


              {/* Customization Options */}
              {packageData.customizationOptions && packageData.customizationOptions.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Add-ons</h3>
                  <div className="space-y-3">
                    {packageData.customizationOptions.map((option) => (
                      <div key={option._id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                              {getCustomizationIcon(option.category)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{option.name}</h4>
                              <p className="text-xs text-gray-600">{option.description}</p>
                              <div className="flex items-center space-x-1 mt-1">
                                <Badge className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5">
                                  {option.category}
                                </Badge>
                                {option.isRequired && (
                                  <Badge className="bg-red-100 text-red-700 text-xs px-2 py-0.5">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 text-sm">
                              {formatPrice(option.price)}
                            </span>
                            {selectedCustomizations[option._id] ? (
                              <div className="flex items-center space-x-1">
                                <Button
                                  onClick={() => handleCustomizationQuantity(option._id, -1)}
                                  variant="outline"
                                  size="sm"
                                  disabled={selectedCustomizations[option._id].quantity <= 1}
                                  className="w-6 h-6 rounded-full p-0"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center text-xs font-bold">
                                  {selectedCustomizations[option._id].quantity}
                                </span>
                                <Button
                                  onClick={() => handleCustomizationQuantity(option._id, 1)}
                                  variant="outline"
                                  size="sm"
                                  disabled={selectedCustomizations[option._id].quantity >= option.maxQuantity}
                                  className="w-6 h-6 rounded-full p-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleCustomizationToggle(option)}
                                variant="outline"
                                size="sm"
                                className="text-pink-600 border-pink-300 hover:bg-pink-50 px-2 py-1 text-xs"
                              >
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                        {selectedCustomizations[option._id] && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">
                                {selectedCustomizations[option._id].quantity} × {formatPrice(option.price)}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-pink-600 text-sm">
                                  {formatPrice(selectedCustomizations[option._id].price * selectedCustomizations[option._id].quantity)}
                                </span>
                                <Button
                                  onClick={() => handleCustomizationToggle(option)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  disabled={cartLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Package Features Section */}
        {packageData.includedFeatures && packageData.includedFeatures.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {packageData.includedFeatures.map((feature, index) => (
                <div key={index} className={`bg-white rounded-lg p-3 border transition-all duration-200 ${
                  removedFeatures[feature.name] 
                    ? 'bg-gray-50 border-gray-200 opacity-60' 
                    : 'border-gray-200 hover:shadow-sm'
                }`}>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        removedFeatures[feature.name] 
                          ? 'bg-gray-200' 
                          : 'bg-pink-100'
                      }`}>
                        {removedFeatures[feature.name] ? (
                          <X className="w-3 h-3 text-gray-500" />
                        ) : (
                          <Check className="w-3 h-3 text-pink-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium text-sm ${
                          removedFeatures[feature.name] 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-900'
                        }`}>
                          {feature.name}
                        </h3>
                        {feature.price > 0 && (
                          <span className={`text-xs font-semibold ${
                            removedFeatures[feature.name] 
                              ? 'text-gray-500' 
                              : 'text-pink-600'
                          }`}>
                            {formatPrice(feature.price)}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${
                        removedFeatures[feature.name] 
                          ? 'text-gray-400' 
                          : 'text-gray-600'
                      }`}>
                        {feature.description}
                      </p>
                      {feature.isRemovable && (
                        <div className="mt-2">
                          <Button
                            onClick={() => handleFeatureToggle(feature)}
                            variant={removedFeatures[feature.name] ? "outline" : "ghost"}
                            size="sm"
                            className={`text-xs px-2 py-1 ${
                              removedFeatures[feature.name]
                                ? 'text-green-600 border-green-300 hover:bg-green-50'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {removedFeatures[feature.name] ? 'Add Back' : 'Remove'}
                          </Button>
                        </div>
                      )}
                      {!feature.isRemovable && (
                        <div className="mt-1">
                          <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                            Required
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {calculateRemovedFeaturesTotal() > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-green-800 font-medium text-sm">You're saving money!</span>
                  </div>
                  <span className="text-green-600 font-bold">
                    -{formatPrice(calculateRemovedFeaturesTotal())}
                  </span>
                </div>
                <p className="text-green-700 text-xs mt-1">
                  Removed optional features to reduce package cost
                </p>
              </div>
            )}
          </div>
        )}

        {/* Package Highlights */}
        {packageData.highlights && packageData.highlights.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Highlights</h2>
            <div className="flex flex-wrap gap-2">
              {packageData.highlights.map((highlight, index) => (
                <Badge key={index} className="bg-pink-100 text-pink-800 text-sm px-3 py-1">
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={packageData.images[selectedImage]}
              alt={packageData.title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {packageData.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageDetail;