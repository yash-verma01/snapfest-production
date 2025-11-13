import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Upload,
  X
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';
import ImageUpload from './ImageUpload';

// Package Form Component - Defined outside to prevent recreation on parent re-renders
const PackageForm = ({ package: pkg, onSave, onCancel, onReload, validationErrors = {} }) => {
  // File upload state for new packages
  const [selectedPrimaryFile, setSelectedPrimaryFile] = useState(null);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // State for dynamic arrays (only these need state management)
  const [includedFeatures, setIncludedFeatures] = useState([]);
  const [customizationOptions, setCustomizationOptions] = useState([]);
  
  // Local state to track current images (synced with pkg prop and image operations)
  const [currentPrimaryImage, setCurrentPrimaryImage] = useState('');
  const [currentImages, setCurrentImages] = useState([]);

  // Initialize dynamic arrays only when package ID changes
  useEffect(() => {
    if (pkg?._id) {
      setIncludedFeatures(pkg.includedFeatures || []);
      setCustomizationOptions(pkg.customizationOptions || []);
      // Clear file uploads when editing existing package
      setSelectedPrimaryFile(null);
      setSelectedGalleryFiles([]);
      setPrimaryPreview(null);
      setGalleryPreviews([]);
    } else {
      // Reset arrays when creating new package
      setIncludedFeatures([]);
      setCustomizationOptions([]);
      // Clear file uploads
      setSelectedPrimaryFile(null);
      setSelectedGalleryFiles([]);
      setPrimaryPreview(null);
      setGalleryPreviews([]);
    }
  }, [pkg?._id]); // Only re-sync when package ID changes

  // Sync images with pkg prop whenever it changes
  useEffect(() => {
    if (pkg) {
      setCurrentPrimaryImage(pkg.primaryImage || '');
      setCurrentImages(pkg.images || []);
    } else {
      setCurrentPrimaryImage('');
      setCurrentImages([]);
    }
  }, [pkg?.primaryImage, pkg?.images, pkg?._id]); // Sync when images or ID changes

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
      category: formData.get('category'),
      basePrice: Number(formData.get('basePrice')),
      description: formData.get('description'),
      highlights: formData.get('highlights')?.split(',').map(item => item.trim()).filter(item => item) || [],
      tags: formData.get('tags')?.split(',').map(item => item.trim()).filter(item => item) || [],
      includedFeatures: includedFeatures,
      customizationOptions: customizationOptions,
      rating: Number(formData.get('rating')) || 0,
      isPremium: formData.get('isPremium') === 'on',
      isActive: formData.get('isActive') === 'on',
      metaDescription: formData.get('metaDescription') || '',
      images: currentImages,
      primaryImage: currentPrimaryImage
    };
    
    // For existing packages, save normally
    if (pkg?._id) {
      onSave(data);
      return;
    }
    
    // For new packages, pass files along with form data
    onSave({
      ...data,
      _files: {
        primary: selectedPrimaryFile,
        gallery: selectedGalleryFiles
      }
    });
  };

  // Add included feature
  const addIncludedFeature = () => {
    setIncludedFeatures(prev => [...prev, {
      name: '',
      description: '',
      icon: '',
      price: 0,
      isRemovable: false,
      isRequired: true
    }]);
  };

  // Update included feature
  const updateIncludedFeature = (index, field, value) => {
    setIncludedFeatures(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Remove included feature
  const removeIncludedFeature = (index) => {
    setIncludedFeatures(prev => prev.filter((_, i) => i !== index));
  };

  // Add customization option
  const addCustomizationOption = () => {
    setCustomizationOptions(prev => [...prev, {
      name: '',
      description: '',
      price: 0,
      category: 'OTHER',
      isRequired: false,
      maxQuantity: 1
    }]);
  };

  // Update customization option
  const updateCustomizationOption = (index, field, value) => {
    setCustomizationOptions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Remove customization option
  const removeCustomizationOption = (index) => {
    setCustomizationOptions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {pkg ? 'Edit Package' : 'Create New Package'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              defaultValue={pkg?.title || ''}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              defaultValue={pkg?.category || 'WEDDING'}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="WEDDING">Wedding</option>
              <option value="BIRTHDAY">Birthday</option>
              <option value="BABY_SHOWER">Baby Shower</option>
              <option value="DEMISE">Demise</option>
              <option value="HALDI_MEHNDI">Haldi Mehndi</option>
              <option value="CAR_DIGGI_CELEBRATION">Car Diggi Celebration</option>
              <option value="CORPORATE">Corporate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
            <input
              type="number"
              name="basePrice"
              defaultValue={pkg?.basePrice || 0}
              required
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                validationErrors.basePrice ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'
              }`}
            />
            {validationErrors.basePrice && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.basePrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              defaultValue={pkg?.description || ''}
              required
              rows="3"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                validationErrors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'
              }`}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            )}
          </div>

          {/* Primary Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Image</label>
            {pkg?._id ? (
              // For existing packages, use ImageUpload component
              <ImageUpload
                entityType="package"
                entityId={pkg._id}
                maxImages={1}
                isPrimary={true}
                existingImages={
                  // Only show primaryImage if it exists and is NOT in the gallery images array
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
              // For new packages, use file input
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePrimaryFileSelect}
                  className="hidden"
                  id="primary-image-upload"
                />
                <label
                  htmlFor="primary-image-upload"
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
            {pkg?._id ? (
              // For existing packages, use ImageUpload component
              <ImageUpload
                entityType="package"
                entityId={pkg._id}
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
              // For new packages, use file input
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFilesSelect}
                  className="hidden"
                  id="gallery-images-upload"
                />
                <label
                  htmlFor="gallery-images-upload"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Highlights (comma-separated)</label>
            <input
              type="text"
              name="highlights"
              defaultValue={pkg?.highlights?.join(', ') || ''}
              placeholder="Premium catering, Live music, Photography"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              defaultValue={pkg?.tags?.join(', ') || ''}
              placeholder="popular, trending, featured"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
              <input
                type="number"
                name="rating"
                defaultValue={pkg?.rating || 0}
                min="0"
                max="5"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                name="isPremium"
                defaultChecked={pkg?.isPremium || false}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Premium Package</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description (SEO - max 160 chars)</label>
            <textarea
              name="metaDescription"
              defaultValue={pkg?.metaDescription || ''}
              maxLength={160}
              rows="2"
              placeholder="SEO description for search engines"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Included Features Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Included Features</label>
              <button
                type="button"
                onClick={addIncludedFeature}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Add Feature
              </button>
            </div>
            
            {includedFeatures.map((feature, index) => (
              <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Feature Name *</label>
                    <input
                      type="text"
                      value={feature.name}
                      onChange={(e) => updateIncludedFeature(index, 'name', e.target.value)}
                      required
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Photography"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={feature.price}
                      onChange={(e) => updateIncludedFeature(index, 'price', parseFloat(e.target.value) || 0)}
                      min="0"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    value={feature.description}
                    onChange={(e) => updateIncludedFeature(index, 'description', e.target.value)}
                    rows="2"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    placeholder="Feature description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Icon URL</label>
                    <input
                      type="text"
                      value={feature.icon}
                      onChange={(e) => updateIncludedFeature(index, 'icon', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                      placeholder="Icon URL (optional)"
                    />
                  </div>
                  <div className="flex items-center space-x-4 mt-5">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={feature.isRemovable}
                        onChange={(e) => updateIncludedFeature(index, 'isRemovable', e.target.checked)}
                        className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-1 text-xs text-gray-600">Removable</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={feature.isRequired}
                        onChange={(e) => updateIncludedFeature(index, 'isRequired', e.target.checked)}
                        className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-1 text-xs text-gray-600">Required</span>
                    </label>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeIncludedFeature(index)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove Feature
                </button>
              </div>
            ))}
          </div>

          {/* Customization Options Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Customization Options (Add-ons)</label>
              <button
                type="button"
                onClick={addCustomizationOption}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Add Option
              </button>
            </div>
            
            {customizationOptions.map((option, index) => (
              <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Option Name *</label>
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) => updateCustomizationOption(index, 'name', e.target.value)}
                      required
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Extra Photography"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      value={option.price}
                      onChange={(e) => updateCustomizationOption(index, 'price', parseFloat(e.target.value) || 0)}
                      required
                      min="0"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    value={option.description}
                    onChange={(e) => updateCustomizationOption(index, 'description', e.target.value)}
                    rows="2"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    placeholder="Option description"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                    <select
                      value={option.category}
                      onChange={(e) => updateCustomizationOption(index, 'category', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="PHOTOGRAPHY">Photography</option>
                      <option value="VIDEOGRAPHY">Videography</option>
                      <option value="DECORATION">Decoration</option>
                      <option value="CATERING">Catering</option>
                      <option value="ENTERTAINMENT">Entertainment</option>
                      <option value="TRANSPORTATION">Transportation</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max Quantity</label>
                    <input
                      type="number"
                      value={option.maxQuantity}
                      onChange={(e) => updateCustomizationOption(index, 'maxQuantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-5">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={option.isRequired}
                        onChange={(e) => updateCustomizationOption(index, 'isRequired', e.target.checked)}
                        className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-1 text-xs text-gray-600">Required</span>
                    </label>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeCustomizationOption(index)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove Option
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={pkg?.isActive !== false}
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
              {pkg ? 'Update Package' : 'Create Package'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PackageManagement = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    loadPackages();
  }, [currentPage, searchTerm, selectedCategory]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { q: searchTerm }),
        ...(selectedCategory && { category: selectedCategory })
      };
      
      const response = await adminAPI.getPackages(params);
      const loadedPackages = response.data.data.packages;
      setPackages(loadedPackages);
      setTotalPages(response.data.data.pagination.pages);
      
      // Return packages so onReload can use them
      return loadedPackages;
    } catch (error) {
      console.error('Error loading packages:', error);
      return []; // Return empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (packageId) => {
    try {
      await adminAPI.togglePackageStatus(packageId);
      loadPackages();
    } catch (error) {
      console.error('Error toggling package status:', error);
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (window.confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      try {
        await adminAPI.deletePackage(packageId);
        loadPackages();
        alert('Package deleted successfully');
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Error deleting package: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleViewPackage = (packageId) => {
    const pkg = packages.find(p => p._id === packageId);
    if (pkg) {
      alert(`Package Details:\nTitle: ${pkg.title}\nCategory: ${pkg.category}\nBase Price: ₹${pkg.basePrice}\nRating: ${pkg.rating || 0}\nDescription: ${pkg.description}\nStatus: ${pkg.isActive ? 'Active' : 'Inactive'}`);
    }
  };

  const handleEditPackage = (packageId) => {
    const pkg = packages.find(p => p._id === packageId);
    if (pkg) {
      setEditingPackage(pkg);
      setShowCreateForm(true);
    }
  };

  const handleCreatePackage = async (packageData) => {
    try {
      // Clear previous errors
      setValidationErrors({});
      
      // Extract files from packageData
      const { _files, ...packagePayload } = packageData;
      
      // Step 1: Create the package
      const response = await adminAPI.createPackage(packagePayload);
      const newPackageId = response.data.data.package._id;
      
      // Step 2: Upload images if any files were selected
      if (_files) {
        const uploadPromises = [];
        
        // Upload primary image if selected
        if (_files.primary) {
          const primaryFormData = new FormData();
          primaryFormData.append('images', _files.primary);
          primaryFormData.append('isPrimary', 'true'); // Mark as primary image
          uploadPromises.push(
            adminAPI.uploadPackageImages(newPackageId, primaryFormData)
            // Primary image is now set directly by the backend, no need for updatePackage call
          );
        }
        
        // Upload gallery images if selected
        if (_files.gallery && _files.gallery.length > 0) {
          const galleryFormData = new FormData();
          _files.gallery.forEach(file => {
            galleryFormData.append('images', file);
          });
          uploadPromises.push(
            adminAPI.uploadPackageImages(newPackageId, galleryFormData)
          );
        }
        
        // Wait for all uploads to complete
        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }
      }
      
      setShowCreateForm(false);
      setEditingPackage(null);
      setValidationErrors({});
      loadPackages();
      alert('Package created successfully with images!');
    } catch (error) {
      console.error('Error creating package:', error);
      
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
        alert('Error creating package: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleUpdatePackage = async (packageId, packageData) => {
    try {
      // Clear previous errors
      setValidationErrors({});
      
      await adminAPI.updatePackage(packageId, packageData);
      setShowCreateForm(false);
      setEditingPackage(null);
      setValidationErrors({});
      loadPackages();
      alert('Package updated successfully');
    } catch (error) {
      console.error('Error updating package:', error);
      
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
        alert('Error updating package: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      'WEDDING': 'bg-pink-100 text-pink-800',
      'BIRTHDAY': 'bg-blue-100 text-blue-800',
      'BABY_SHOWER': 'bg-yellow-100 text-yellow-800',
      'DEMISE': 'bg-gray-100 text-gray-800',
      'HALDI_MEHNDI': 'bg-orange-100 text-orange-800',
      'CAR_DIGGI_CELEBRATION': 'bg-purple-100 text-purple-800',
      'CORPORATE': 'bg-green-100 text-green-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
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
          <h2 className="text-2xl font-bold text-gray-900">Package Management</h2>
          <p className="text-gray-600">Manage event packages and services</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Package
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
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              <option value="WEDDING">Wedding</option>
              <option value="BIRTHDAY">Birthday</option>
              <option value="BABY_SHOWER">Baby Shower</option>
              <option value="DEMISE">Demise</option>
              <option value="HALDI_MEHNDI">Haldi Mehndi</option>
              <option value="CAR_DIGGI_CELEBRATION">Car Diggi Celebration</option>
              <option value="CORPORATE">Corporate</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={loadPackages}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Packages Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {packages.map((pkg) => (
                <tr key={pkg._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{pkg.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{pkg.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getCategoryBadgeColor(pkg.category)}>
                      {pkg.category.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{pkg.basePrice}</div>
                    {pkg.rating > 0 && (
                      <div className="text-sm text-gray-500">Rating: {pkg.rating}/5</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusBadgeColor(pkg.isActive)}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(pkg._id)}
                        title={pkg.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {pkg.isActive ? (
                          <ToggleLeft className="w-4 h-4" />
                        ) : (
                          <ToggleRight className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewPackage(pkg._id)}
                        title="View Package Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditPackage(pkg._id)}
                        title="Edit Package"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePackage(pkg._id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Package"
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

      {/* Package Form Modal */}
      {showCreateForm && (
        <PackageForm
          package={editingPackage}
          validationErrors={validationErrors}
          onSave={(data) => {
            if (editingPackage) {
              handleUpdatePackage(editingPackage._id, data);
            } else {
              handleCreatePackage(data);
            }
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingPackage(null);
            setValidationErrors({});
          }}
          onReload={async () => {
            const loadedPackages = await loadPackages();
            // Update editingPackage with fresh data if we're in edit mode
            if (editingPackage?._id) {
              const updatedPkg = loadedPackages.find(p => p._id === editingPackage._id);
              if (updatedPkg) {
                setEditingPackage(updatedPkg);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default PackageManagement;
