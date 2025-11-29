import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Camera,
  Star,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md shadow-xl">
          <div className="text-red-600 mb-4">
            <Camera className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Event Not Found</h3>
            <p className="text-gray-600">{error || 'The event you are looking for does not exist.'}</p>
          </div>
          <div className="space-y-3 mt-6">
            <Button 
              onClick={() => navigate('/events')}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
            >
              Back to Events
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      {/* Elegant Header with Back Button */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            onClick={() => navigate('/events')}
            variant="ghost"
            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image Section - Redesigned */}
            <div className="relative h-[500px] overflow-hidden rounded-2xl shadow-2xl group">
              <img
                src={event.image || '/api/placeholder/800/400'}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-pink-600/90 backdrop-blur-sm text-white border-0 px-4 py-1.5 text-sm font-semibold">
                    {event.type}
                  </Badge>
                  {event.isFeatured && (
                    <Badge className="bg-yellow-500/90 backdrop-blur-sm text-white border-0 px-4 py-1.5 text-sm font-semibold">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
                  {event.title}
                </h1>
                {event.location && (
                  <div className="flex items-center text-white/90">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span className="text-lg">
                      {typeof event.location === 'string' 
                        ? event.location 
                        : event.location?.name || event.location?.city || 'Location TBD'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Details Card - Redesigned */}
            <Card className="p-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-red-500 rounded-full mr-4"></div>
                Event Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                      <Calendar className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {event.date ? new Date(event.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'Date TBD'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                      <MapPin className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Location</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {event.location?.name || (typeof event.location === 'string' ? event.location : 'TBD')}
                      </p>
                      {event.location?.fullAddress && (
                        <p className="text-sm text-gray-600 mt-1">{event.location.fullAddress}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                      <Users className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Expected Guests</p>
                      <p className="text-lg font-semibold text-gray-900">{event.guestCount || 0} people</p>
                    </div>
                  </div>
                  
                  {event.duration && (
                    <div className="flex items-start group">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                        <Clock className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                        <p className="text-lg font-semibold text-gray-900">{event.duration}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  {event.budget && (
                    <div className="p-5 rounded-xl bg-gradient-to-br from-pink-50 to-red-50 border border-pink-100">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Budget Range</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                        {formatPrice(event.budget.min)} - {formatPrice(event.budget.max)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Description Card - Redesigned */}
            <Card className="p-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-red-500 rounded-full mr-4"></div>
                About This Event
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>
            </Card>

            {/* Highlights Card - Redesigned */}
            {event.highlights && event.highlights.length > 0 && (
              <Card className="p-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-red-500 rounded-full mr-4"></div>
                  Event Highlights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.highlights.map((highlight, index) => (
                    <div 
                      key={index} 
                      className="flex items-start p-4 rounded-xl bg-gradient-to-br from-pink-50 to-red-50 border border-pink-100 hover:shadow-md transition-shadow duration-200"
                    >
                      <Star className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{highlight}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Photo Gallery - Redesigned */}
            {event.images && event.images.length > 0 && (
              <Card className="p-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-red-500 rounded-full mr-4"></div>
                  Photo Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {event.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-xl cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-300"
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setShowImageModal(true);
                      }}
                    >
                      <img
                        src={image}
                        alt={`${event.title} - Photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <div className="text-white text-sm font-medium">View Full Size</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Redesigned */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Contact Information Card - Updated */}
              <Card className="p-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-red-500 rounded-full mr-3"></div>
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center p-4 rounded-xl bg-gradient-to-br from-pink-50 to-red-50 border border-pink-100">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center mr-3">
                      <Camera className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
                      <p className="font-semibold text-gray-900">Snapfest India</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 rounded-xl bg-gradient-to-br from-pink-50 to-red-50 border border-pink-100">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center mr-3">
                      <Phone className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                      <a href="tel:9129956955" className="font-semibold text-gray-900 hover:text-pink-600 transition-colors">
                        912-995-6955
                      </a>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 text-base font-semibold"
                >
                  Contact Us
                </Button>
              </Card>

              {/* Tags Card - Redesigned */}
              {event.tags && event.tags.length > 0 && (
                <Card className="p-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-red-500 rounded-full mr-3"></div>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        className="bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 border border-pink-200 hover:from-pink-200 hover:to-red-200 transition-colors px-3 py-1.5 text-sm font-medium"
                      >
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

      {/* Enhanced Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div 
            className="relative max-w-6xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={event.images[selectedImageIndex]}
              alt={`${event.title} - Photo ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            
            {event.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium">
              {selectedImageIndex + 1} of {event.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
