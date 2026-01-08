import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Filter,
  MapPin,
  Users,
  DollarSign,
  Upload,
  X
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';
import ImageUpload from './ImageUpload';

// Event Form Component - Defined outside to prevent recreation on parent re-renders
const EventForm = ({ event: evt, onSave, onCancel, onReload, validationErrors = {} }) => {
  // File upload state for new events
  const [selectedPrimaryFile, setSelectedPrimaryFile] = useState(null);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  
  // Local state to track current images (synced with evt prop and image operations)
  const [currentPrimaryImage, setCurrentPrimaryImage] = useState('');
  const [currentImages, setCurrentImages] = useState([]);

  // Clear file uploads when editing or creating
  useEffect(() => {
    if (evt?._id) {
      // Clear file uploads when editing existing event
      setSelectedPrimaryFile(null);
      setSelectedGalleryFiles([]);
      setPrimaryPreview(null);
      setGalleryPreviews([]);
    } else {
      // Clear file uploads when creating new event
      setSelectedPrimaryFile(null);
      setSelectedGalleryFiles([]);
      setPrimaryPreview(null);
      setGalleryPreviews([]);
    }
  }, [evt?._id]); // Only clear when event ID changes

  // Sync images with evt prop whenever it changes
  useEffect(() => {
    if (evt) {
      setCurrentPrimaryImage(evt.image || '');
      setCurrentImages(evt.images || []);
    } else {
      setCurrentPrimaryImage('');
      setCurrentImages([]);
    }
  }, [evt?.image, evt?.images, evt?._id]); // Sync when images or ID changes

  // File handlers
  const handlePrimaryFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedPrimaryFile(file);
      if (primaryPreview) {
        URL.revokeObjectURL(primaryPreview);
      }
      setPrimaryPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Max size is 10MB.`);
        return false;
      }
      return true;
    });
    
    const newFiles = [...selectedGalleryFiles, ...imageFiles].slice(0, 10);
    setSelectedGalleryFiles(newFiles);
    
    // Create previews for new files
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setGalleryPreviews(prev => [...prev, ...newPreviews].slice(0, 10));
  };

  const removeGalleryFile = (index) => {
    setSelectedGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Read form data from FormData
    const data = {
      title: formData.get('title'),
      type: formData.get('type'),
      description: formData.get('description'),
      shortDescription: formData.get('shortDescription'),
      date: formData.get('date') ? new Date(formData.get('date')) : null,
      location: {
        name: formData.get('location.name') || '',
        city: formData.get('location.city') || '',
        state: formData.get('location.state') || '',
        fullAddress: formData.get('location.fullAddress') || ''
      },
      guestCount: Number(formData.get('guestCount')) || 0,
      duration: formData.get('duration') || '',
      budget: {
        min: Number(formData.get('budget.min')) || 0,
        max: Number(formData.get('budget.max')) || 0
      },
      isActive: formData.get('isActive') === 'on',
      image: currentPrimaryImage,
      images: currentImages
    };
    
    // For existing events, save normally
    if (evt?._id) {
      onSave(data);
      return;
    }
    
    // For new events, pass files along with form data
    onSave({
      ...data,
      _files: {
        primary: selectedPrimaryFile,
        gallery: selectedGalleryFiles
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-base sm:text-lg font-semibold mb-4">
          {evt ? 'Edit Event' : 'Create New Event'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              defaultValue={evt?.title || ''}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                validationErrors.title ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'
              }`}
            />
            {validationErrors.title && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="type"
              defaultValue={evt?.type || 'WEDDING'}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="WEDDING">Wedding</option>
              <option value="BIRTHDAY">Birthday</option>
              <option value="HALDI">Haldi</option>
              <option value="CORPORATE">Corporate</option>
              <option value="BABY_SHOWER">Baby Shower</option>
              <option value="ANNIVERSARY">Anniversary</option>
              <option value="FESTIVAL">Festival</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <input
              type="text"
              name="shortDescription"
              defaultValue={evt?.shortDescription || ''}
              maxLength="150"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              defaultValue={evt?.description || ''}
              rows="3"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                validationErrors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'
              }`}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                defaultValue={evt?.date ? new Date(evt.date).toISOString().split('T')[0] : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
              <input
                type="number"
                name="guestCount"
                defaultValue={evt?.guestCount || 0}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <input
              type="text"
              name="duration"
              defaultValue={evt?.duration || ''}
              placeholder="e.g., 6 hours, Full day"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget (₹)</label>
              <input
                type="number"
                name="budget.min"
                defaultValue={evt?.budget?.min || 0}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget (₹)</label>
              <input
                type="number"
                name="budget.max"
                defaultValue={evt?.budget?.max || 0}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
            <input
              type="text"
              name="location.name"
              defaultValue={evt?.location?.name || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="location.city"
                defaultValue={evt?.location?.city || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="location.state"
                defaultValue={evt?.location?.state || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
            <textarea
              name="location.fullAddress"
              defaultValue={evt?.location?.fullAddress || ''}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Primary Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Image</label>
            {evt?._id ? (
              // For existing events, use ImageUpload component
              <ImageUpload
                entityType="event"
                entityId={evt._id}
                maxImages={1}
                isPrimary={true}
                existingImages={
                  // Only show image if it exists and is NOT in the gallery images array
                  currentPrimaryImage && 
                  currentPrimaryImage.trim() !== '' && 
                  !currentImages.includes(currentPrimaryImage)
                    ? [currentPrimaryImage] 
                    : []
                }
                onImagesUploaded={async (newImageUrl) => {
                  // Update local state immediately
                  setCurrentPrimaryImage(newImageUrl);
                  // Reload to get fresh data from backend
                  onReload?.();
                }}
                onImageRemove={async (imageUrl) => {
                  // Update local state immediately
                  if (imageUrl === currentPrimaryImage) {
                    setCurrentPrimaryImage('');
                  }
                  // Reload to get fresh data from backend
                  onReload?.();
                }}
              />
            ) : (
              // For new events, use file input
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePrimaryFileSelect}
                  className="hidden"
                  id="primary-image-upload-event"
                />
                <label
                  htmlFor="primary-image-upload-event"
                  className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors block"
                >
                  {primaryPreview ? (
                    <div className="relative">
                      <img src={primaryPreview} alt="Preview" className="w-full h-32 object-cover rounded" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedPrimaryFile(null);
                          if (primaryPreview) {
                            URL.revokeObjectURL(primaryPreview);
                          }
                          setPrimaryPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to select primary image</p>
                      <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Gallery Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gallery Images</label>
            {evt?._id ? (
              // For existing events, use ImageUpload component
              <ImageUpload
                entityType="event"
                entityId={evt._id}
                maxImages={10}
                isPrimary={false}
                existingImages={currentImages}
                onImagesUploaded={(images) => {
                  // Update local state with all images
                  setCurrentImages(images);
                  // Reload to reflect changes
                  onReload?.();
                }}
                onImageRemove={(imageUrl) => {
                  // Update local state immediately
                  setCurrentImages(prev => prev.filter(img => img !== imageUrl));
                  // Reload to reflect changes
                  onReload?.();
                }}
              />
            ) : (
              // For new events, use file input
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFilesSelect}
                  className="hidden"
                  id="gallery-images-upload-event"
                />
                <label
                  htmlFor="gallery-images-upload-event"
                  className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors block mb-2"
                >
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Click to select gallery images</p>
                  <p className="text-xs text-gray-500 mt-1">Max 10 images, 10MB each</p>
                </label>
                
                {/* Preview selected gallery images */}
                {galleryPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {galleryPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeGalleryFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={evt?.isActive !== false}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Active</label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sm:space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto text-xs sm:text-sm"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto text-xs sm:text-sm"
              size="sm"
            >
              {evt ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    loadEvents();
  }, [currentPage, searchTerm, selectedType]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { q: searchTerm }),
        ...(selectedType && { type: selectedType })
      };
      
      const response = await adminAPI.getEvents(params);
      const loadedEvents = response.data.data.events;
      setEvents(loadedEvents);
      setTotalPages(response.data.data.pagination.pages);
      return loadedEvents; // Return loaded events for onReload callback
    } catch (error) {
      console.error('Error loading events:', error);
      return []; // Return empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (eventId) => {
    try {
      await adminAPI.toggleEventStatus(eventId);
      loadEvents();
    } catch (error) {
      console.error('Error toggling event status:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await adminAPI.deleteEvent(eventId);
        loadEvents();
        alert('Event deleted successfully');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleViewEvent = (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (event) {
      alert(`Event Details:\nTitle: ${event.title}\nType: ${event.type}\nDate: ${new Date(event.date).toLocaleDateString()}\nLocation: ${event.location.name}\nGuest Count: ${event.guestCount}\nBudget: ₹${event.budget.min} - ₹${event.budget.max}\nStatus: ${event.isActive ? 'Active' : 'Inactive'}`);
    }
  };

  const handleEditEvent = (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (event) {
      setEditingEvent(event);
      setShowCreateForm(true);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      // Clear previous errors
      setValidationErrors({});
      
      // Extract files from eventData
      const { _files, ...eventPayload } = eventData;
      
      // Step 1: Create the event
      const response = await adminAPI.createEvent(eventPayload);
      const newEventId = response.data.data.event._id;
      
      // Step 2: Upload primary image if selected
      if (_files && _files.primary) {
        const primaryFormData = new FormData();
        primaryFormData.append('images', _files.primary);
        primaryFormData.append('isPrimary', 'true');
        await adminAPI.uploadEventImages(newEventId, primaryFormData);
        // Primary image is now set directly by the backend
      }
      
      // Step 3: Upload gallery images if any files were selected
      if (_files && _files.gallery && _files.gallery.length > 0) {
        const galleryFormData = new FormData();
        _files.gallery.forEach(file => {
          galleryFormData.append('images', file);
        });
        await adminAPI.uploadEventImages(newEventId, galleryFormData);
      }
      
      setShowCreateForm(false);
      setEditingEvent(null);
      setValidationErrors({});
      loadEvents();
      alert('Event created successfully with images!');
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Handle validation errors
      if (error.response?.status === 400 && error.response?.data?.errors) {
        // Map errors by field name
        const errorsByField = {};
        error.response.data.errors.forEach(err => {
          errorsByField[err.field] = err.message;
        });
        setValidationErrors(errorsByField);
        
        // Scroll to first error
        const firstErrorField = Object.keys(errorsByField)[0];
        if (firstErrorField) {
          setTimeout(() => {
            const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              errorElement.focus();
            }
          }, 100);
        }
        
        // Show alert with all errors
        const errorMessages = error.response.data.errors.map(err => 
          `• ${err.field}: ${err.message}`
        ).join('\n');
        alert(`Please fix the following errors:\n\n${errorMessages}`);
      } else {
        alert('Error creating event: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      // Clear previous errors
      setValidationErrors({});
      
      await adminAPI.updateEvent(eventId, eventData);
      setShowCreateForm(false);
      setEditingEvent(null);
      setValidationErrors({});
      loadEvents();
      alert('Event updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      
      // Handle validation errors
      if (error.response?.status === 400 && error.response?.data?.errors) {
        // Map errors by field name
        const errorsByField = {};
        error.response.data.errors.forEach(err => {
          errorsByField[err.field] = err.message;
        });
        setValidationErrors(errorsByField);
        
        // Scroll to first error
        const firstErrorField = Object.keys(errorsByField)[0];
        if (firstErrorField) {
          setTimeout(() => {
            const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              errorElement.focus();
            }
          }, 100);
        }
        
        // Show alert with all errors
        const errorMessages = error.response.data.errors.map(err => 
          `• ${err.field}: ${err.message}`
        ).join('\n');
        alert(`Please fix the following errors:\n\n${errorMessages}`);
      } else {
        alert('Error updating event: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      'WEDDING': 'bg-pink-100 text-pink-800',
      'BIRTHDAY': 'bg-blue-100 text-blue-800',
      'HALDI': 'bg-orange-100 text-orange-800',
      'CORPORATE': 'bg-green-100 text-green-800',
      'BABY_SHOWER': 'bg-yellow-100 text-yellow-800',
      'ANNIVERSARY': 'bg-purple-100 text-purple-800',
      'FESTIVAL': 'bg-red-100 text-red-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Event Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage event gallery and listings</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto text-xs sm:text-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="WEDDING">Wedding</option>
              <option value="BIRTHDAY">Birthday</option>
              <option value="HALDI">Haldi</option>
              <option value="CORPORATE">Corporate</option>
              <option value="BABY_SHOWER">Baby Shower</option>
              <option value="ANNIVERSARY">Anniversary</option>
              <option value="FESTIVAL">Festival</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button
              variant="outline"
              onClick={loadEvents}
              className="w-full text-xs sm:text-sm"
              size="sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Events Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-2 sm:px-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-2 sm:ml-4 min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{event.title}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{event.shortDescription || event.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <Badge className={`${getTypeBadgeColor(event.type)} text-xs`}>
                        {event.type}
                      </Badge>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs sm:text-sm text-gray-900">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[100px] sm:max-w-none">{event.location.name || event.location.city || 'Location TBD'}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <Badge className={`${getStatusBadgeColor(event.isActive)} text-xs`}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(event._id)}
                        title={event.isActive ? 'Deactivate' : 'Activate'}
                        className="text-xs"
                      >
                        {event.isActive ? (
                          <ToggleLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <ToggleRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewEvent(event._id)}
                        title="View Event Details"
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditEvent(event._id)}
                        title="Edit Event"
                        className="text-xs"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvent(event._id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 sm:px-6 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-xs"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Event Form Modal */}
      {showCreateForm && (
        <EventForm
          event={editingEvent}
          validationErrors={validationErrors}
          onSave={(data) => {
            if (editingEvent) {
              handleUpdateEvent(editingEvent._id, data);
            } else {
              handleCreateEvent(data);
            }
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingEvent(null);
            setValidationErrors({});
          }}
          onReload={async () => {
            const loadedEvents = await loadEvents();
            // Update editingEvent with fresh data if we're editing
            if (editingEvent?._id) {
              const updatedEvent = loadedEvents.find(e => e._id === editingEvent._id);
              if (updatedEvent) {
                setEditingEvent(updatedEvent);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default EventManagement;
