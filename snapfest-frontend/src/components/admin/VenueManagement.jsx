import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Filter,
  Users,
  DollarSign,
  Star,
  Upload,
  X
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';
import ImageUpload from './ImageUpload';

const VenueManagement = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  
  // File upload state for new venues
  const [selectedPrimaryFile, setSelectedPrimaryFile] = useState(null);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  useEffect(() => {
    loadVenues();
  }, [currentPage, searchTerm, selectedType]);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { q: searchTerm }),
        ...(selectedType && { type: selectedType })
      };
      
      const response = await adminAPI.getVenues(params);
      setVenues(response.data.data.venues);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (venueId) => {
    try {
      await adminAPI.toggleVenueStatus(venueId);
      loadVenues();
    } catch (error) {
      console.error('Error toggling venue status:', error);
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      try {
        await adminAPI.deleteVenue(venueId);
        loadVenues();
        alert('Venue deleted successfully');
      } catch (error) {
        console.error('Error deleting venue:', error);
        alert('Error deleting venue: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleViewVenue = (venueId) => {
    const venue = venues.find(v => v._id === venueId);
    if (venue) {
      alert(`Venue Details:\nName: ${venue.name}\nLocation: ${venue.location}\nCapacity: ${venue.capacity}\nPrice: ₹${venue.pricePerDay}/day\nRating: ${venue.rating}/5\nAmenities: ${venue.amenities.join(', ')}\nStatus: ${venue.isActive ? 'Active' : 'Inactive'}`);
    }
  };

  const handleEditVenue = (venueId) => {
    const venue = venues.find(v => v._id === venueId);
    if (venue) {
      setEditingVenue(venue);
      setShowCreateForm(true);
      // Clear file uploads when editing
      setSelectedPrimaryFile(null);
      setPrimaryPreview(null);
      setSelectedGalleryFiles([]);
      setGalleryPreviews([]);
    }
  };

  // File handlers
  const handlePrimaryFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Max size is 10MB.');
      return;
    }
    
    setSelectedPrimaryFile(file);
    if (primaryPreview) {
      URL.revokeObjectURL(primaryPreview);
    }
    setPrimaryPreview(URL.createObjectURL(file));
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

  const handleCreateVenue = async (venueData) => {
    try {
      // Extract files from venueData
      const { _files, ...venuePayload } = venueData;
      
      // Step 1: Create the venue
      const response = await adminAPI.createVenue(venuePayload);
      const newVenueId = response.data.data.venue._id;
      
      // Step 2: Upload primary image if selected
      if (_files && _files.primary) {
        const primaryFormData = new FormData();
        primaryFormData.append('images', _files.primary);
        const primaryRes = await adminAPI.uploadVenueImages(newVenueId, primaryFormData);
        // Set the newly uploaded image as primary (use newImages, not images)
        await adminAPI.updateVenue(newVenueId, {
          primaryImage: primaryRes.data.data.newImages[0]
        });
      }
      
      // Step 3: Upload gallery images if any files were selected
      if (_files && _files.gallery && _files.gallery.length > 0) {
        const galleryFormData = new FormData();
        _files.gallery.forEach(file => {
          galleryFormData.append('images', file);
        });
        await adminAPI.uploadVenueImages(newVenueId, galleryFormData);
      }
      
      // Clear file uploads
      setSelectedPrimaryFile(null);
      if (primaryPreview) {
        URL.revokeObjectURL(primaryPreview);
      }
      setPrimaryPreview(null);
      setSelectedGalleryFiles([]);
      setGalleryPreviews([]);
      
      setShowCreateForm(false);
      setEditingVenue(null);
      loadVenues();
      alert('Venue created successfully with images!');
    } catch (error) {
      console.error('Error creating venue:', error);
      alert('Error creating venue: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateVenue = async (venueId, venueData) => {
    try {
      await adminAPI.updateVenue(venueId, venueData);
      setShowCreateForm(false);
      setEditingVenue(null);
      loadVenues();
      alert('Venue updated successfully');
    } catch (error) {
      console.error('Error updating venue:', error);
      alert('Error updating venue: ' + (error.response?.data?.message || error.message));
    }
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      'WEDDING_HALL': 'bg-pink-100 text-pink-800',
      'BANQUET_HALL': 'bg-blue-100 text-blue-800',
      'GARDEN': 'bg-green-100 text-green-800',
      'HOTEL': 'bg-purple-100 text-purple-800',
      'RESORT': 'bg-orange-100 text-orange-800',
      'CONVENTION_CENTER': 'bg-gray-100 text-gray-800',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Venue Management</h2>
          <p className="text-gray-600">Manage event venues and locations</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Venue
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
                placeholder="Search venues..."
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
              <option value="WEDDING_HALL">Wedding Hall</option>
              <option value="BANQUET_HALL">Banquet Hall</option>
              <option value="GARDEN">Garden</option>
              <option value="HOTEL">Hotel</option>
              <option value="RESORT">Resort</option>
              <option value="CONVENTION_CENTER">Convention Center</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={loadVenues}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Venues Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {venues.map((venue) => (
                <tr key={venue._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{venue.name}</div>
                        <div className="text-sm text-gray-500">{venue.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getTypeBadgeColor(venue.type)}>
                      {venue.type?.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="w-4 h-4 mr-1" />
                      {venue.capacity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ₹{venue.pricePerDay}/day
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      {venue.rating}/5
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusBadgeColor(venue.isActive)}>
                      {venue.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(venue._id)}
                        title={venue.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {venue.isActive ? (
                          <ToggleLeft className="w-4 h-4" />
                        ) : (
                          <ToggleRight className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewVenue(venue._id)}
                        title="View Venue Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditVenue(venue._id)}
                        title="Edit Venue"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVenue(venue._id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Venue"
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

      {/* Venue Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingVenue ? 'Edit Venue' : 'Create New Venue'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                name: formData.get('name'),
                location: formData.get('location'),
                capacity: Number(formData.get('capacity')),
                pricePerDay: Number(formData.get('pricePerDay')),
                amenities: formData.get('amenities').split(',').map(item => item.trim()).filter(item => item),
                features: formData.get('features').split(',').map(item => item.trim()).filter(item => item),
                services: formData.get('services').split(',').map(item => item.trim()).filter(item => item),
                images: editingVenue ? (formData.get('images')?.split(',').map(item => item.trim()).filter(item => item) || []) : [],
                description: formData.get('description'),
                contactInfo: {
                  phone: formData.get('phone'),
                  email: formData.get('email'),
                  website: formData.get('website')
                },
                isActive: formData.get('isActive') === 'on'
              };
              
              if (editingVenue) {
                handleUpdateVenue(editingVenue._id, data);
              } else {
                // For new venues, pass files along with data
                handleCreateVenue({
                  ...data,
                  _files: {
                    primary: selectedPrimaryFile,
                    gallery: selectedGalleryFiles
                  }
                });
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" name="name" defaultValue={editingVenue?.name || ''} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" name="location" defaultValue={editingVenue?.location || ''} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input type="number" name="capacity" defaultValue={editingVenue?.capacity || 0} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Day (₹)</label>
                  <input type="number" name="pricePerDay" defaultValue={editingVenue?.pricePerDay || 0} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" defaultValue={editingVenue?.description || ''} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
                <input type="text" name="amenities" defaultValue={editingVenue?.amenities?.join(', ') || ''} placeholder="Parking, AC, WiFi" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                <input type="text" name="features" defaultValue={editingVenue?.features?.join(', ') || ''} placeholder="Stage, Dance floor, Garden" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Services (comma-separated)</label>
                <input type="text" name="services" defaultValue={editingVenue?.services?.join(', ') || ''} placeholder="Catering, Photography, Decoration" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              
              {/* Primary Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Image</label>
                {editingVenue?._id ? (
                  // For existing venues, use ImageUpload component
                  <ImageUpload
                    entityType="venue"
                    entityId={editingVenue._id}
                    maxImages={1}
                    isPrimary={true}
                    existingImages={editingVenue.primaryImage ? [editingVenue.primaryImage] : []}
                    onImagesUploaded={async (newImageUrl) => {
                      // Update primary image after upload
                      try {
                        await adminAPI.updateVenue(editingVenue._id, {
                          primaryImage: newImageUrl
                        });
                        // Reload venues to reflect changes
                        loadVenues();
                      } catch (error) {
                        console.error('Error updating primary image:', error);
                        alert('Failed to update primary image');
                      }
                    }}
                    onImageRemove={async (imageUrl) => {
                      // Primary image removal is handled by backend
                      // Just reload to reflect changes
                      loadVenues();
                    }}
                  />
                ) : (
                  // For new venues, use file input
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePrimaryFileSelect}
                      className="hidden"
                      id="primary-image-upload-venue"
                    />
                    <label
                      htmlFor="primary-image-upload-venue"
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
                {editingVenue?._id ? (
                  // For existing venues, use ImageUpload component
                  <ImageUpload
                    entityType="venue"
                    entityId={editingVenue._id}
                    maxImages={10}
                    isPrimary={false}
                    existingImages={editingVenue.images || []}
                    onImagesUploaded={(images) => {
                      // Update venue with new images
                      loadVenues();
                    }}
                    onImageRemove={(imageUrl) => {
                      // Images are removed via ImageUpload component
                      loadVenues();
                    }}
                  />
                ) : (
                  // For new venues, use file input
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryFilesSelect}
                      className="hidden"
                      id="gallery-images-upload-venue"
                    />
                    <label
                      htmlFor="gallery-images-upload-venue"
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
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" name="phone" defaultValue={editingVenue?.contactInfo?.phone || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="email" defaultValue={editingVenue?.contactInfo?.email || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" name="website" defaultValue={editingVenue?.contactInfo?.website || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              
              <div className="flex items-center">
                <input type="checkbox" name="isActive" defaultChecked={editingVenue?.isActive !== false} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                <label className="ml-2 block text-sm text-gray-900">Active</label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { 
                  setShowCreateForm(false); 
                  setEditingVenue(null);
                  // Clear file uploads on cancel
                  setSelectedPrimaryFile(null);
                  if (primaryPreview) {
                    URL.revokeObjectURL(primaryPreview);
                  }
                  setPrimaryPreview(null);
                  setSelectedGalleryFiles([]);
                  setGalleryPreviews([]);
                }}>Cancel</Button>
                <Button type="submit" className="bg-primary-600 hover:bg-primary-700">{editingVenue ? 'Update Venue' : 'Create Venue'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueManagement;
