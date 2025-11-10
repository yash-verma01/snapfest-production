import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, ShoppingCart } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ModalPortal from './ModalPortal';
import { toast } from 'react-hot-toast';

const BookingModal = ({ 
  isOpen, 
  onClose, 
  onAddToCart, 
  packageData, 
  loading = false 
}) => {
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || loading) return;
    
    // Reset errors
    setErrors({});
    
    // Validation
    const newErrors = {};
    
    if (!eventDate) {
      newErrors.eventDate = 'Event date is required';
    } else {
      const selectedDate = new Date(eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.eventDate = 'Event date cannot be in the past';
      }
    }
    
    if (!location || location.trim().length < 3) {
      newErrors.location = 'Please enter a valid location (minimum 3 characters)';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onAddToCart(packageData._id, {}, {
        guests: parseInt(guests),
        eventDate: eventDate,
        location: location.trim()
      });
      
      toast.success('Package added to cart successfully!');
      
      // Reset form
      setEventDate('');
      setLocation('');
      setGuests(1);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add package to cart. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || loading) return;
    setEventDate('');
    setLocation('');
    setGuests(1);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting && !loading) {
      handleClose();
    }
  };

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !loading) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, loading]);

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        className="w-full h-full flex items-center justify-center"
        onClick={handleBackdropClick}
      >
        <Card className="w-full max-w-md mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Add to Cart</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Package Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-1">{packageData?.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{packageData?.category}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Base: ₹{packageData?.basePrice?.toLocaleString() || 0}
              </span>
              <span className="text-sm text-gray-600">
                Per Guest: ₹{packageData?.perGuestPrice?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Event Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  errors.eventDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.eventDate && (
                <p className="text-red-500 text-sm mt-1">{errors.eventDate}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Event Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter event location"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>

            {/* Price Preview */}
            {packageData && (
              <div className="p-3 bg-pink-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Base Price:</span>
                  <span>₹{packageData.basePrice?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-pink-200 pt-2 mt-2">
                  <span>Total:</span>
                  <span>₹{packageData.basePrice?.toLocaleString() || 0}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting || loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
        </Card>
      </div>
    </ModalPortal>
  );
};

export default BookingModal;
