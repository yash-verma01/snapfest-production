import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Camera,
  Heart,
  Share2,
  Download,
  Eye,
  Star,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { publicAPI } from '../services/api';
import { Card, Button, Badge } from '../components/ui';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getEventById(id);
        
        if (response.data.success && response.data.data) {
          setEvent(response.data.data.item);
        } else {
          throw new Error('Event not found');
        }
      } catch (err) {
        console.error('Error loading event:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEvent();
    }
  }, [id]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const nextImage = () => {
    if (event?.images && event.images.length > 0) {
      setSelectedImageIndex((prev) => 
        prev === event.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (event?.images && event.images.length > 0) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? event.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-600 mb-4">
            <Camera className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Event Not Found</h3>
            <p className="text-gray-600">{error || 'The event you are looking for does not exist.'}</p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => navigate('/events')}>
              Back to Events
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
                onClick={() => navigate('/events')}
                variant="ghost"
                className="text-pink-600 hover:text-pink-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Events
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-pink-600 text-white">
                    {event.type}
                  </Badge>
                  {event.isFeatured && (
                    <Badge className="bg-yellow-500 text-white">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="text-gray-400 hover:text-pink-600">
                <Heart className="w-4 h-4 mr-2" />
                {event.likes || 0}
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-pink-600">
                <Share2 className="w-4 h-4 mr-2" />
                {event.shares || 0}
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-pink-600">
                <Eye className="w-4 h-4 mr-2" />
                {event.views || 0}
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
                src={event.image || '/api/placeholder/800/400'}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                <p className="text-lg">{event.location?.city || event.location}</p>
              </div>
            </div>

            {/* Event Details */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-pink-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">{event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-pink-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{event.location?.name || event.location || 'TBD'}</p>
                      {event.location?.fullAddress && (
                        <p className="text-sm text-gray-500">{event.location.fullAddress}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-pink-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Guests</p>
                      <p className="font-medium">{event.guestCount || 0} people</p>
                    </div>
                  </div>
                  
                  {event.duration && (
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-pink-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium">{event.duration}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {event.budget && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Budget Range</p>
                      <p className="font-medium text-lg text-pink-600">
                        {formatPrice(event.budget.min)} - {formatPrice(event.budget.max)}
                      </p>
                    </div>
                  )}
                  
                  {event.photographer?.name && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Photographer</p>
                      <p className="font-medium">{event.photographer.name}</p>
                      {event.photographer.contact && (
                        <p className="text-sm text-gray-500">{event.photographer.contact}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h3>
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </Card>

            {/* Highlights */}
            {event.highlights && event.highlights.length > 0 && (
              <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Event Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {event.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-2" />
                      <span className="text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Photo Gallery */}
            {event.images && event.images.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Photo Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {event.images.map((image, index) => (
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
                        alt={`${event.title} - Photo ${index + 1}`}
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
              {/* Contact Info */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                {event.photographer?.name && (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Camera className="w-4 h-4 text-pink-600 mr-3" />
                      <span className="text-gray-700">{event.photographer.name}</span>
                    </div>
                    {event.photographer.contact && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-pink-600 mr-3" />
                        <span className="text-gray-700">{event.photographer.contact}</span>
                      </div>
                    )}
                  </div>
                )}
                <Button className="w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white">
                  Contact Photographer
                </Button>
              </Card>

              {/* Event Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views</span>
                    <span className="font-medium">{event.views || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Likes</span>
                    <span className="font-medium">{event.likes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shares</span>
                    <span className="font-medium">{event.shares || 0}</span>
                  </div>
                </div>
              </Card>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
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
              src={event.images[selectedImageIndex]}
              alt={`${event.title} - Photo ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {event.images.length > 1 && (
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
              {selectedImageIndex + 1} of {event.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;