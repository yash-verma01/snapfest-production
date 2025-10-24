import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Clock,
  Star,
  Building2
} from 'lucide-react';
import { Card, Button, Badge } from '../ui';
import { adminAPI } from '../../services/api';

const VendorAssignmentModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  onAssign, 
  loading = false 
}) => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadVendors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVendors(vendors);
    } else {
      const filtered = vendors.filter(vendor => 
        vendor.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.businessType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVendors(filtered);
    }
  }, [searchQuery, vendors]);

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      setError(null);
      const response = await adminAPI.getVendors({ limit: 100 });
      setVendors(response.data.data.vendors || []);
    } catch (err) {
      console.error('Error loading vendors:', err);
      setError('Failed to load vendors. Please try again.');
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
  };

  const handleAssign = async () => {
    if (!selectedVendor || !booking) {
      console.log('❌ Missing data:', { selectedVendor: !!selectedVendor, booking: !!booking });
      return;
    }

    console.log('🔍 Modal Debug - Booking object:', booking);
    console.log('🔍 Modal Debug - Booking ID:', booking._id);
    console.log('🔍 Modal Debug - Selected Vendor:', selectedVendor);
    console.log('🔍 Modal Debug - Vendor User ID:', selectedVendor.userId._id);

    try {
      await onAssign(booking._id, selectedVendor._id);
      onClose();
    } catch (err) {
      console.error('Error assigning vendor:', err);
    }
  };

  const getAvailabilityBadge = (availability) => {
    switch (availability) {
      case 'AVAILABLE':
        return <Badge variant="success" size="sm">Available</Badge>;
      case 'BUSY':
        return <Badge variant="warning" size="sm">Busy</Badge>;
      case 'UNAVAILABLE':
        return <Badge variant="danger" size="sm">Unavailable</Badge>;
      default:
        return <Badge variant="default" size="sm">Unknown</Badge>;
    }
  };

  const formatServices = (services) => {
    if (!services || services.length === 0) return 'No services specified';
    return services.slice(0, 3).join(', ') + (services.length > 3 ? '...' : '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Assign Vendor to Booking
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Booking #{booking?._id?.slice(-8)} - {booking?.packageId?.title}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors by name, business, email, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingVendors ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Loading vendors...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">{error}</div>
              <Button onClick={loadVendors} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No vendors found</p>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search terms' : 'No vendors available'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVendors.map((vendor) => (
                <Card
                  key={vendor._id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedVendor?._id === vendor._id
                      ? 'ring-2 ring-primary-500 bg-primary-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleVendorSelect(vendor)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {vendor.userId?.name || 'Unknown Vendor'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {vendor.businessName || 'No business name'}
                          </p>
                        </div>
                        {selectedVendor?._id === vendor._id && (
                          <CheckCircle className="w-5 h-5 text-primary-600" />
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          <span>{vendor.userId?.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{vendor.userId?.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{vendor.location || 'No location'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="w-4 h-4 mr-2" />
                          <span>{vendor.experience || 0} years experience</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Services:</span>
                          <span className="text-sm text-gray-900">
                            {formatServices(vendor.servicesOffered)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          {getAvailabilityBadge(vendor.availability)}
                        </div>
                        {vendor.businessType && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Type:</span>
                            <span className="text-sm text-gray-900">
                              {vendor.businessType}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedVendor ? (
              <span>
                Selected: <strong>{selectedVendor.userId?.name}</strong>
              </span>
            ) : (
              <span>Please select a vendor to assign</span>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedVendor || loading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                'Assign Vendor'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAssignmentModal;
