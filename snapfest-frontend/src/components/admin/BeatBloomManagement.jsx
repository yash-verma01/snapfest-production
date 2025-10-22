import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Filter,
  Star,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';

const BeatBloomManagement = () => {
  const [beatBlooms, setBeatBlooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBeatBloom, setEditingBeatBloom] = useState(null);

  useEffect(() => {
    loadBeatBlooms();
  }, [currentPage, searchTerm, selectedCategory]);

  const loadBeatBlooms = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { q: searchTerm }),
        ...(selectedCategory && { category: selectedCategory })
      };
      
      const response = await adminAPI.getBeatBlooms(params);
      setBeatBlooms(response.data.data.beatBlooms);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error loading beat blooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (beatBloomId) => {
    try {
      await adminAPI.toggleBeatBloomStatus(beatBloomId);
      loadBeatBlooms();
    } catch (error) {
      console.error('Error toggling beat bloom status:', error);
    }
  };

  const handleDeleteBeatBloom = async (beatBloomId) => {
    if (window.confirm('Are you sure you want to delete this Beat & Bloom service? This action cannot be undone.')) {
      try {
        await adminAPI.deleteBeatBloom(beatBloomId);
        loadBeatBlooms();
        alert('Beat & Bloom service deleted successfully');
      } catch (error) {
        console.error('Error deleting beat bloom:', error);
        alert('Error deleting beat bloom: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleViewBeatBloom = (beatBloomId) => {
    const beatBloom = beatBlooms.find(b => b._id === beatBloomId);
    if (beatBloom) {
      alert(`Beat & Bloom Details:\nTitle: ${beatBloom.title}\nCategory: ${beatBloom.category}\nPrice: ₹${beatBloom.price}\nRating: ${beatBloom.rating}/5\nFeatures: ${beatBloom.features.join(', ')}\nStatus: ${beatBloom.isActive ? 'Active' : 'Inactive'}`);
    }
  };

  const handleEditBeatBloom = (beatBloomId) => {
    const beatBloom = beatBlooms.find(b => b._id === beatBloomId);
    if (beatBloom) {
      setEditingBeatBloom(beatBloom);
      setShowCreateForm(true);
    }
  };

  const handleCreateBeatBloom = async (beatBloomData) => {
    try {
      await adminAPI.createBeatBloom(beatBloomData);
      setShowCreateForm(false);
      setEditingBeatBloom(null);
      loadBeatBlooms();
      alert('Beat & Bloom service created successfully');
    } catch (error) {
      console.error('Error creating beat bloom:', error);
      alert('Error creating beat bloom: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateBeatBloom = async (beatBloomId, beatBloomData) => {
    try {
      await adminAPI.updateBeatBloom(beatBloomId, beatBloomData);
      setShowCreateForm(false);
      setEditingBeatBloom(null);
      loadBeatBlooms();
      alert('Beat & Bloom service updated successfully');
    } catch (error) {
      console.error('Error updating beat bloom:', error);
      alert('Error updating beat bloom: ' + (error.response?.data?.message || error.message));
    }
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      'ENTERTAINMENT': 'bg-purple-100 text-purple-800',
      'DECOR': 'bg-pink-100 text-pink-800',
      'PHOTOGRAPHY': 'bg-blue-100 text-blue-800',
      'CATERING': 'bg-orange-100 text-orange-800',
      'LIGHTING': 'bg-yellow-100 text-yellow-800',
      'OTHER': 'bg-gray-100 text-gray-800'
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
          <h2 className="text-2xl font-bold text-gray-900">Beat & Bloom Management</h2>
          <p className="text-gray-600">Manage individual services and entertainment</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
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
                placeholder="Search services..."
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
              <option value="ENTERTAINMENT">Entertainment</option>
              <option value="DECOR">Decor</option>
              <option value="PHOTOGRAPHY">Photography</option>
              <option value="CATERING">Catering</option>
              <option value="LIGHTING">Lighting</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={loadBeatBlooms}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Beat & Bloom Services Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {beatBlooms.map((beatBloom) => (
                <tr key={beatBloom._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Music className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{beatBloom.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{beatBloom.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getCategoryBadgeColor(beatBloom.category)}>
                      {beatBloom.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ₹{beatBloom.price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      {beatBloom.rating}/5
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusBadgeColor(beatBloom.isActive)}>
                      {beatBloom.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(beatBloom._id)}
                        title={beatBloom.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {beatBloom.isActive ? (
                          <ToggleLeft className="w-4 h-4" />
                        ) : (
                          <ToggleRight className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewBeatBloom(beatBloom._id)}
                        title="View Service Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditBeatBloom(beatBloom._id)}
                        title="Edit Service"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBeatBloom(beatBloom._id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Service"
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

      {/* Beat & Bloom Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingBeatBloom ? 'Edit Beat & Bloom Service' : 'Create New Beat & Bloom Service'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                title: formData.get('title'),
                category: formData.get('category'),
                description: formData.get('description'),
                price: Number(formData.get('price')),
                features: formData.get('features').split(',').map(item => item.trim()).filter(item => item),
                images: formData.get('images').split(',').map(item => item.trim()).filter(item => item),
                rating: Number(formData.get('rating')),
                isActive: formData.get('isActive') === 'on'
              };
              
              if (editingBeatBloom) {
                handleUpdateBeatBloom(editingBeatBloom._id, data);
              } else {
                handleCreateBeatBloom(data);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" name="title" defaultValue={editingBeatBloom?.title || ''} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category" defaultValue={editingBeatBloom?.category || 'ENTERTAINMENT'} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="DECOR">Decor</option>
                  <option value="PHOTOGRAPHY">Photography</option>
                  <option value="CATERING">Catering</option>
                  <option value="LIGHTING">Lighting</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" defaultValue={editingBeatBloom?.description || ''} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" name="price" defaultValue={editingBeatBloom?.price || 0} min="0" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
                  <input type="number" name="rating" defaultValue={editingBeatBloom?.rating || 0} min="0" max="5" step="0.1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                <input type="text" name="features" defaultValue={editingBeatBloom?.features?.join(', ') || ''} placeholder="Live music, Professional sound, LED lights" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Images (comma-separated URLs)</label>
                <input type="text" name="images" defaultValue={editingBeatBloom?.images?.join(', ') || ''} placeholder="https://example.com/image1.jpg" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              
              <div className="flex items-center">
                <input type="checkbox" name="isActive" defaultChecked={editingBeatBloom?.isActive !== false} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                <label className="ml-2 block text-sm text-gray-900">Active</label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); setEditingBeatBloom(null); }}>Cancel</Button>
                <Button type="submit" className="bg-primary-600 hover:bg-primary-700">{editingBeatBloom ? 'Update Service' : 'Create Service'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeatBloomManagement;
