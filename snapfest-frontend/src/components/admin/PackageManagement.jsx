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
  Users
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';

const PackageManagement = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

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
      setPackages(response.data.data.packages);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error loading packages:', error);
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
      await adminAPI.createPackage(packageData);
      setShowCreateForm(false);
      setEditingPackage(null);
      loadPackages();
      alert('Package created successfully');
    } catch (error) {
      console.error('Error creating package:', error);
      alert('Error creating package: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdatePackage = async (packageId, packageData) => {
    try {
      await adminAPI.updatePackage(packageId, packageData);
      setShowCreateForm(false);
      setEditingPackage(null);
      loadPackages();
      alert('Package updated successfully');
    } catch (error) {
      console.error('Error updating package:', error);
      alert('Error updating package: ' + (error.response?.data?.message || error.message));
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

  // Package Form Component
  const PackageForm = ({ package: pkg, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      title: pkg?.title || '',
      category: pkg?.category || 'WEDDING',
      basePrice: pkg?.basePrice || 0,
      description: pkg?.description || '',
      images: pkg?.images || [],
      primaryImage: pkg?.primaryImage || '',
      highlights: pkg?.highlights || [],
      tags: pkg?.tags || [],
      includedFeatures: pkg?.includedFeatures || [],
      customizationOptions: pkg?.customizationOptions || [],
      rating: pkg?.rating || 0,
      isPremium: pkg?.isPremium || false,
      isActive: pkg?.isActive !== undefined ? pkg.isActive : true,
      metaDescription: pkg?.metaDescription || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    };

    const handleArrayChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value.split(',').map(item => item.trim()).filter(item => item)
      }));
    };

    // Add included feature
    const addIncludedFeature = () => {
      setFormData(prev => ({
        ...prev,
        includedFeatures: [...prev.includedFeatures, {
          name: '',
          description: '',
          icon: '',
          price: 0,
          isRemovable: false,
          isRequired: true
        }]
      }));
    };

    // Update included feature
    const updateIncludedFeature = (index, field, value) => {
      setFormData(prev => {
        const updated = [...prev.includedFeatures];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, includedFeatures: updated };
      });
    };

    // Remove included feature
    const removeIncludedFeature = (index) => {
      setFormData(prev => ({
        ...prev,
        includedFeatures: prev.includedFeatures.filter((_, i) => i !== index)
      }));
    };

    // Add customization option
    const addCustomizationOption = () => {
      setFormData(prev => ({
        ...prev,
        customizationOptions: [...prev.customizationOptions, {
          name: '',
          description: '',
          price: 0,
          category: 'OTHER',
          isRequired: false,
          maxQuantity: 1
        }]
      }));
    };

    // Update customization option
    const updateCustomizationOption = (index, field, value) => {
      setFormData(prev => {
        const updated = [...prev.customizationOptions];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, customizationOptions: updated };
      });
    };

    // Remove customization option
    const removeCustomizationOption = (index) => {
      setFormData(prev => ({
        ...prev,
        customizationOptions: prev.customizationOptions.filter((_, i) => i !== index)
      }));
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
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
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
                value={formData.basePrice}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Image URL</label>
              <input
                type="text"
                name="primaryImage"
                value={formData.primaryImage}
                onChange={handleChange}
                placeholder="https://example.com/primary-image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Images (comma-separated URLs)</label>
              <input
                type="text"
                value={formData.images.join(', ')}
                onChange={(e) => handleArrayChange('images', e.target.value)}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Highlights (comma-separated)</label>
              <input
                type="text"
                value={formData.highlights.join(', ')}
                onChange={(e) => handleArrayChange('highlights', e.target.value)}
                placeholder="Premium catering, Live music, Photography"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => handleArrayChange('tags', e.target.value)}
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
                  value={formData.rating}
                  onChange={handleChange}
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
                  checked={formData.isPremium}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Premium Package</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description (SEO - max 160 chars)</label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                maxLength={160}
                rows="2"
                placeholder="SEO description for search engines"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.metaDescription.length}/160 characters</p>
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
              
              {formData.includedFeatures.map((feature, index) => (
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
              
              {formData.customizationOptions.map((option, index) => (
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
                {pkg ? 'Update Package' : 'Create Package'}
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
          }}
        />
      )}
    </div>
  );
};

export default PackageManagement;
