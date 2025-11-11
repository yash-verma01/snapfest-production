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

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

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
      setEvents(response.data.data.events);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error loading events:', error);
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
      // Extract files from eventData
      const { _files, ...eventPayload } = eventData;
      
      // Step 1: Create the event
      const response = await adminAPI.createEvent(eventPayload);
      const newEventId = response.data.data.event._id;
      
      // Step 2: Upload images if any files were selected
      if (_files) {
        const uploadPromises = [];
        
        // Upload primary image if selected
        if (_files.primary) {
          const primaryFormData = new FormData();
          primaryFormData.append('images', _files.primary);
          uploadPromises.push(
            adminAPI.uploadEventImages(newEventId, primaryFormData)
              .then(res => {
                // Set first uploaded image as primary
                if (res.data.data.images && res.data.data.images.length > 0) {
                  return adminAPI.updateEvent(newEventId, {
                    image: res.data.data.images[0]
                  });
                }
              })
          );
        }
        
        // Upload gallery images if selected
        if (_files.gallery && _files.gallery.length > 0) {
          const galleryFormData = new FormData();
          _files.gallery.forEach(file => {
            galleryFormData.append('images', file);
          });
          uploadPromises.push(
            adminAPI.uploadEventImages(newEventId, galleryFormData)
          );
        }
        
        // Wait for all uploads to complete
        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }
      }
      
      setShowCreateForm(false);
      setEditingEvent(null);
      loadEvents();
      alert('Event created successfully with images!');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      await adminAPI.updateEvent(eventId, eventData);
      setShowCreateForm(false);
      setEditingEvent(null);
      loadEvents();
      alert('Event updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event: ' + (error.response?.data?.message || error.message));
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

  // Event Form Component
  const EventForm = ({ event: evt, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      title: '',
      type: 'WEDDING',
      description: '',
      shortDescription: '',
      date: '',
      location: {
        name: '',
        city: '',
        state: '',
        fullAddress: ''
      },
      image: '',
      images: [],
      guestCount: 0,
      duration: '',
      budget: {
        min: 0,
        max: 0
      },
      isActive: true
    });

    // File upload state for new events
    const [selectedPrimaryFile, setSelectedPrimaryFile] = useState(null);
    const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);
    const [primaryPreview, setPrimaryPreview] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);

    // Sync form data only when evt prop changes (by ID)
    useEffect(() => {
      if (evt) {
        setFormData({
          title: evt.title || '',
          type: evt.type || 'WEDDING',
          description: evt.description || '',
          shortDescription: evt.shortDescription || '',
          date: evt.date ? new Date(evt.date).toISOString().split('T')[0] : '',
          location: {
            name: evt.location?.name || '',
            city: evt.location?.city || '',
            state: evt.location?.state || '',
            fullAddress: evt.location?.fullAddress || ''
          },
          image: evt.image || '',
          images: evt.images || [],
          guestCount: evt.guestCount || 0,
          duration: evt.duration || '',
          budget: {
            min: evt.budget?.min || 0,
            max: evt.budget?.max || 0
          },
          isActive: evt.isActive !== undefined ? evt.isActive : true
        });
        // Clear file uploads when editing existing event
        setSelectedPrimaryFile(null);
        setSelectedGalleryFiles([]);
        setPrimaryPreview(null);
        setGalleryPreviews([]);
      } else {
        // Reset to defaults when creating new event
        setFormData({
          title: '',
          type: 'WEDDING',
          description: '',
          shortDescription: '',
          date: '',
          location: {
            name: '',
            city: '',
            state: '',
            fullAddress: ''
          },
          image: '',
          images: [],
          guestCount: 0,
          duration: '',
          budget: {
            min: 0,
            max: 0
          },
          isActive: true
        });
        // Clear file uploads
        setSelectedPrimaryFile(null);
        setSelectedGalleryFiles([]);
        setPrimaryPreview(null);
        setGalleryPreviews([]);
      }
    }, [evt?._id]); // Only re-sync when event ID changes

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
      
      // For existing events, save normally
      if (evt?._id) {
        const submitData = {
          ...formData,
          date: formData.date ? new Date(formData.date) : null
        };
        onSave(submitData);
        return;
      }
      
      // For new events, pass files along with form data
      const submitData = {
        ...formData,
        date: formData.date ? new Date(formData.date) : null,
        _files: {
          primary: selectedPrimaryFile,
          gallery: selectedGalleryFiles
        }
      };
      onSave(submitData);
    };

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      if (name.startsWith('location.')) {
        const field = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            [field]: value
          }
        }));
      } else if (name.startsWith('budget.')) {
        const field = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          budget: {
            ...prev.budget,
            [field]: Number(value)
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }));
      }
    };

    const handleArrayChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value.split(',').map(item => item.trim()).filter(item => item)
      }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {evt ? 'Edit Event' : 'Create New Event'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
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
                value={formData.shortDescription}
                onChange={handleChange}
                maxLength="150"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                <input
                  type="number"
                  name="guestCount"
                  value={formData.guestCount}
                  onChange={handleChange}
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
                value={formData.duration}
                onChange={handleChange}
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
                  value={formData.budget.min}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget (₹)</label>
                <input
                  type="number"
                  name="budget.max"
                  value={formData.budget.max}
                  onChange={handleChange}
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
                value={formData.location.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <textarea
                name="location.fullAddress"
                value={formData.location.fullAddress}
                onChange={handleChange}
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
                  existingImages={formData.image ? [formData.image] : []}
                  onImagesUploaded={(images) => {
                    if (images && images.length > 0) {
                      setFormData(prev => ({ ...prev, image: images[0] }));
                    }
                  }}
                  onImageRemove={() => {
                    setFormData(prev => ({ ...prev, image: '' }));
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
                  existingImages={formData.images || []}
                  onImagesUploaded={(images) => {
                    setFormData(prev => ({ ...prev, images }));
                  }}
                  onImageRemove={(imageUrl) => {
                    setFormData(prev => ({
                      ...prev,
                      images: prev.images.filter(img => img !== imageUrl)
                    }));
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
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Active</label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700"
              >
                {evt ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
          <p className="text-gray-600">Manage event gallery and listings</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={loadEvents}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Events Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{event.shortDescription || event.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getTypeBadgeColor(event.type)}>
                      {event.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 mr-1" />
                      {event.location.name || event.location.city || 'Location TBD'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusBadgeColor(event.isActive)}>
                      {event.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(event._id)}
                        title={event.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {event.isActive ? (
                          <ToggleLeft className="w-4 h-4" />
                        ) : (
                          <ToggleRight className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewEvent(event._id)}
                        title="View Event Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditEvent(event._id)}
                        title="Edit Event"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvent(event._id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Event Form Modal */}
      {showCreateForm && (
        <EventForm
          event={editingEvent}
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
          }}
        />
      )}
    </div>
  );
};

export default EventManagement;
