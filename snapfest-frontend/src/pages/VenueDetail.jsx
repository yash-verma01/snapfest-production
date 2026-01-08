import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Star,
  Heart,
  Share2,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  Clock,
  Wifi,
  Car,
  Utensils,
  Music,
  Camera,
  Shield
} from 'lucide-react';
import { publicAPI, userAPI } from '../services/api';
import { Card, Button, Badge } from '../components/ui';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const VenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const { user, isSignedIn, getToken } = useAuth();
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    message: ''
  });
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

  useEffect(() => {
    const loadVenue = async () => {
      try {
        setLoading(true);
        console.log('Loading venue with ID:', id);
        const response = await publicAPI.getVenueById(id);
        console.log('Venue API response:', response.data);
        
        if (response.data.success && response.data.data) {
          setVenue(response.data.data.item);
        } else {
          throw new Error('Venue not found');
        }
      } catch (err) {
        console.error('Error loading venue:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVenue();
    }
  }, [id]);

  // Fetch user profile from backend if logged in
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isSignedIn) {
        try {
          // Fetch user profile from backend
          const response = await userAPI.getUserProfile();
          const profileData = response.data.data.user;
          
          // Populate form with backend data
          setEnquiryForm(prev => ({
            ...prev,
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || ''
          }));
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Fallback to Clerk data if backend fails
          if (user) {
            setEnquiryForm(prev => ({
              ...prev,
              name: user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.firstName || user.username || user.fullName || '',
              email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || ''
            }));
          }
        }
      }
    };

    loadUserProfile();
  }, [isSignedIn, user]);

  // Handle enquiry form submission
  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingEnquiry(true);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if user is signed in
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      const response = await fetch('http://localhost:5001/api/enquiries', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: enquiryForm.name,
          email: enquiryForm.email,
          phone: enquiryForm.phone,
          enquiryType: 'venue',
          relatedId: venue?._id,
          relatedModel: 'Venue',
          subject: 'Enquiry',
          message: enquiryForm.message,
          eventDate: enquiryForm.eventDate || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Enquiry sent successfully! We\'ll get back to you soon.');
        
        // Reload user profile to reset form with correct values
        if (isSignedIn) {
          try {
            const response = await userAPI.getUserProfile();
            const profileData = response.data.data.user;
            setEnquiryForm({
              name: profileData.name || '',
              email: profileData.email || '',
              phone: profileData.phone || '',
              eventDate: '',
              message: ''
            });
          } catch (error) {
            // Fallback to Clerk data or empty form
            if (user) {
              setEnquiryForm({
                name: user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.firstName || user.username || '',
                email: user.primaryEmailAddress?.emailAddress || '',
                phone: '',
                eventDate: '',
                message: ''
              });
            } else {
              setEnquiryForm({
                name: '',
                email: '',
                phone: '',
                eventDate: '',
                message: ''
              });
            }
          }
        } else {
          setEnquiryForm({
            name: '',
            email: '',
            phone: '',
            eventDate: '',
            message: ''
          });
        }
      } else {
        toast.error(data.message || 'Failed to send enquiry');
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast.error('Failed to send enquiry. Please try again.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const nextImage = () => {
    if (venue?.images && venue.images.length > 0) {
      setSelectedImageIndex((prev) => 
        prev === venue.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (venue?.images && venue.images.length > 0) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? venue.images.length - 1 : prev - 1
      );
    }
  };

  const getAmenityIcon = (amenity) => {
    const iconMap = {
      'Parking': Car,
      'WiFi': Wifi,
      'Catering': Utensils,
      'DJ Setup': Music,
      'Photography': Camera,
      'AC': Shield,
      'Garden': Eye,
      'Outdoor': Eye,
      'Beach View': Eye,
      'Lighting': Eye
    };
    return iconMap[amenity] || Eye;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-600 mb-4">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Venue Not Found</h3>
            <p className="text-gray-600">{error || 'The venue you are looking for does not exist.'}</p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => navigate('/venues')}>
              Back to Venues
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/venues')}
                variant="ghost"
                className="text-pink-600 hover:text-pink-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Venues
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{venue.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{venue.rating}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="text-gray-400 hover:text-pink-600">
                <Heart className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-pink-600">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hero Image */}
            <div className="relative h-96 overflow-hidden rounded-lg mb-6">
              <img
                src={venue.primaryImage || venue.images?.[0] || '/api/placeholder/800/400'}
                alt={venue.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold mb-2">{venue.name}</h2>
                <p className="text-lg">{venue.location}</p>
              </div>
              {venue.isPremium && (
                <Badge className="absolute top-4 left-4 bg-yellow-500 text-white">
                  Premium
                </Badge>
              )}
            </div>

            {/* Venue Details */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Venue Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-pink-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Capacity</p>
                      <p className="font-medium">{venue.capacity} guests</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-pink-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{venue.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-pink-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="font-medium">{venue.rating}/5.0</p>
                    </div>
                  </div>
                  
                  {venue.type && (
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-pink-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium">{venue.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {venue.pricePerDay && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Price per Day</p>
                      <p className="font-medium text-lg text-pink-600">
                        {formatPrice(venue.pricePerDay)}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Availability</p>
                    <Badge className={venue.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                      {venue.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  
                  {venue.isPremium && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <Badge className="bg-yellow-500 text-white">
                        Premium
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Description */}
            {venue.description && (
              <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Venue</h3>
                <p className="text-gray-700 leading-relaxed">{venue.description}</p>
              </Card>
            )}

            {/* Services */}
            {venue.services && venue.services.length > 0 && (
              <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Services</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.services.map((service, index) => (
                    <div key={index} className="flex items-center">
                      <Utensils className="w-4 h-4 text-pink-600 mr-2" />
                      <span className="text-gray-700">{service}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Address */}
            {venue.address && (venue.address.fullAddress || venue.address.street || venue.address.city) && (
              <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Address</h3>
                <div className="space-y-2 text-gray-700">
                  {venue.address.street && <p>{venue.address.street}</p>}
                  {(venue.address.city || venue.address.state || venue.address.pincode) && (
                    <p>
                      {venue.address.city}
                      {venue.address.city && venue.address.state && ', '}
                      {venue.address.state}
                      {venue.address.pincode && ` ${venue.address.pincode}`}
                    </p>
                  )}
                  {venue.address.fullAddress && (
                    <p className="mt-2 font-medium">{venue.address.fullAddress}</p>
                  )}
                </div>
              </Card>
            )}

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.amenities.map((amenity, index) => {
                    const IconComponent = getAmenityIcon(amenity);
                    return (
                      <div key={index} className="flex items-center">
                        <IconComponent className="w-4 h-4 text-pink-600 mr-2" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Photo Gallery */}
            {venue.images && venue.images.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Photo Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setShowImageModal(true);
                      }}
                    >
                      <img
                        src={image}
                        alt={`${venue.name} - Photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Enquiry Form */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Make an Enquiry</h3>
                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={enquiryForm.name}
                      onChange={(e) => setEnquiryForm({...enquiryForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter your name"
                      required
                      disabled={isSignedIn}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={enquiryForm.email}
                      onChange={(e) => setEnquiryForm({...enquiryForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter your email"
                      required
                      disabled={isSignedIn}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={enquiryForm.phone}
                      onChange={(e) => setEnquiryForm({...enquiryForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                    <input
                      type="date"
                      value={enquiryForm.eventDate}
                      onChange={(e) => setEnquiryForm({...enquiryForm, eventDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      rows={3}
                      value={enquiryForm.message}
                      onChange={(e) => setEnquiryForm({...enquiryForm, message: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Tell us about your event..."
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={isSubmittingEnquiry}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingEnquiry ? 'Sending...' : 'Send Enquiry'}
                  </Button>
                </form>
              </Card>

              {/* Venue Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-medium">{venue.capacity} guests</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-medium">{venue.rating}/5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge className={venue.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                      {venue.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  {venue.pricePerDay && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price</span>
                      <span className="font-medium text-pink-600">{formatPrice(venue.pricePerDay)}/day</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={venue.images[selectedImageIndex]}
              alt={`${venue.name} - Photo ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {venue.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {selectedImageIndex + 1} of {venue.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueDetail;
