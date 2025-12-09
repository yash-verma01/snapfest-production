import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Eye,
  Star,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';
import VendorLocationMap from './VendorLocationMap';
import { useVendorLocationUpdates } from '../../hooks/useVendorLocationUpdates';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [vendorLocations, setVendorLocations] = useState({});

  useEffect(() => {
    loadVendors();
  }, []);

  // Listen for real-time vendor location updates
  useVendorLocationUpdates(null, (data) => {
    // Update vendor location in state
    setVendorLocations(prev => ({
      ...prev,
      [data.vendorId]: data.location
    }));
    
    // If viewing this vendor's details, update the selected vendor
    if (selectedVendor && selectedVendor._id === data.vendorId) {
      setSelectedVendor(prev => ({
        ...prev,
        currentLocation: data.location
      }));
    }
    
    // Also update in vendors list if vendor exists
    setVendors(prev => prev.map(vendor => {
      if (vendor._id === data.vendorId) {
        return {
          ...vendor,
          currentLocation: data.location
        };
      }
      return vendor;
    }));
  });

  // Helper function to get vendor location (real-time or stored)
  const getVendorLocation = (vendor) => {
    // Use real-time location if available, otherwise use stored location
    return vendorLocations[vendor._id] || vendor.currentLocation;
  };

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getVendors({ page: 1, limit: 50 });
      setVendors(response.data.data.vendors);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (vendorId) => {
    try {
      setError(null);
      setActionLoading(prev => ({ ...prev, [vendorId]: true }));
      const response = await adminAPI.toggleVendorStatus(vendorId);
      console.log('Toggle response:', response.data);
      await loadVendors();
      alert('Vendor status updated successfully!');
    } catch (err) {
      console.error('Toggle error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to toggle vendor status');
      alert('Failed to update vendor status. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      try {
        setError(null);
        setActionLoading(prev => ({ ...prev, [vendorId]: true }));
        await adminAPI.deleteVendor(vendorId);
        await loadVendors();
        alert('Vendor deleted successfully!');
      } catch (err) {
        console.error('Delete error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to delete vendor');
        alert('Failed to delete vendor. Please try again.');
      } finally {
        setActionLoading(prev => ({ ...prev, [vendorId]: false }));
      }
    }
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = !searchTerm || 
      vendor.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage photographers and vendors</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto text-xs sm:text-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </Card>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredVendors.map((vendor) => (
          <Card key={vendor._id} className="p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                </div>
                <div className="ml-2 sm:ml-3 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{vendor.userId?.name || 'N/A'}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{vendor.businessName}</p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                {getStatusBadge(vendor.userId?.isActive)}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs sm:text-sm text-gray-600 min-w-0">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{vendor.userId?.email || 'N/A'}</span>
              </div>
              {vendor.userId?.phone && (
                <div className="flex items-center text-xs sm:text-sm text-gray-600 min-w-0">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{vendor.userId.phone}</span>
                </div>
              )}
              {vendor.location && (
                <div className="flex items-center text-xs sm:text-sm text-gray-600 min-w-0">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{vendor.location}</span>
                </div>
              )}
              {/* GPS Location Indicator */}
              {(() => {
                const location = getVendorLocation(vendor);
                return location?.latitude && location?.longitude ? (
                  <div className="flex items-center text-xs sm:text-sm text-green-600 min-w-0">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {location.isTrackingEnabled ? '📍 Live Tracking Active' : '📍 Location Available'}
                    </span>
                    {location.isTrackingEnabled && (
                      <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                ) : null;
              })()}
              {vendor.rating && (
                <div className="flex items-center text-xs sm:text-sm text-gray-600 min-w-0">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{vendor.rating} ({vendor.reviewCount || 0} reviews)</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setShowDetails(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-primary-600 hover:text-primary-900 border-primary-200 hover:border-primary-300 text-xs flex-1 sm:flex-none"
                  title="View Details"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">View</span>
                </Button>
                <Button
                  onClick={() => handleToggleStatus(vendor._id)}
                  variant="outline"
                  size="sm"
                  disabled={actionLoading[vendor._id]}
                  className={`text-xs flex-1 sm:flex-none ${
                    vendor.userId?.isActive 
                      ? 'text-red-600 hover:text-red-900 border-red-200 hover:border-red-300' 
                      : 'text-green-600 hover:text-green-900 border-green-200 hover:border-green-300'
                  }`}
                  title={vendor.userId?.isActive ? 'Deactivate Vendor' : 'Activate Vendor'}
                >
                  {actionLoading[vendor._id] ? (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    vendor.userId?.isActive ? <ToggleRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <ToggleLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  )}
                  <span className="hidden sm:inline">{actionLoading[vendor._id] ? 'Processing...' : (vendor.userId?.isActive ? 'Deactivate' : 'Activate')}</span>
                  <span className="sm:hidden">{actionLoading[vendor._id] ? '...' : (vendor.userId?.isActive ? 'Off' : 'On')}</span>
                </Button>
                <Button
                  onClick={() => handleDeleteVendor(vendor._id)}
                  variant="outline"
                  size="sm"
                  disabled={actionLoading[vendor._id]}
                  className="text-red-600 hover:text-red-900 border-red-200 hover:border-red-300 text-xs flex-1 sm:flex-none"
                  title="Delete Vendor"
                >
                  {actionLoading[vendor._id] ? (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  )}
                  <span className="hidden sm:inline">{actionLoading[vendor._id] ? 'Processing...' : 'Delete'}</span>
                  <span className="sm:hidden">{actionLoading[vendor._id] ? '...' : 'Del'}</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Vendor Details Modal */}
      {showDetails && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold truncate">
                Vendor Details - {selectedVendor.userId?.name || selectedVendor.businessName}
              </h3>
              <Button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-xs sm:text-sm"
                size="sm"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Name</label>
                    <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedVendor.userId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Business Name</label>
                    <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedVendor.businessName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Email</label>
                    <p className="text-xs sm:text-sm text-gray-900 break-all">{selectedVendor.userId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-xs sm:text-sm text-gray-900">{selectedVendor.userId?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Location</label>
                    <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedVendor.location || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedVendor.userId?.isActive)}</div>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Business Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Business Type</label>
                    <p className="text-xs sm:text-sm text-gray-900">{selectedVendor.businessType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Experience</label>
                    <p className="text-xs sm:text-sm text-gray-900">{selectedVendor.experience || 0} years</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Availability</label>
                    <p className="text-xs sm:text-sm text-gray-900">{selectedVendor.availability || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Profile Complete</label>
                    <p className="text-xs sm:text-sm text-gray-900">{selectedVendor.profileComplete ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Services Offered */}
              {selectedVendor.servicesOffered && selectedVendor.servicesOffered.length > 0 && (
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Services Offered</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendor.servicesOffered.map((service, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedVendor.bio && (
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">About</h4>
                  <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedVendor.bio}</p>
                </div>
              )}

              {/* Location Map */}
              {(() => {
                const location = getVendorLocation(selectedVendor);
                return location?.latitude && location?.longitude ? (
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      Current Location
                      {location.isTrackingEnabled && (
                        <Badge className="bg-green-100 text-green-800">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Live Tracking
                          </div>
                        </Badge>
                      )}
                    </h4>
                    <VendorLocationMap
                      latitude={location.latitude}
                      longitude={location.longitude}
                      vendorName={selectedVendor.userId?.name || selectedVendor.businessName}
                      address={location.address}
                      lastUpdated={location.lastUpdated}
                    />
                  </div>
                ) : null;
              })()}

              {/* Account Information */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Account Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Member Since</label>
                    <p className="text-sm text-gray-900">
                      {selectedVendor.createdAt ? new Date(selectedVendor.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Login</label>
                    <p className="text-sm text-gray-900">
                      {selectedVendor.userId?.lastLogin ? new Date(selectedVendor.userId.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
