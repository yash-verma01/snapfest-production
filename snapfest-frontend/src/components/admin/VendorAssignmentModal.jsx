import React, { useState, useEffect } from 'react';
import { X, Search, Filter, UserCheck, Star, MapPin, Briefcase, DollarSign, Clock, Calendar, Users, Mail, Phone, Info, Camera, Utensils, Sparkles, Mic, Video, Sun, Volume2, Car, Shield } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';

const VendorAssignmentModal = ({ isOpen, onClose, booking, onAssignmentSuccess, isEditMode = false, currentVendor = null }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadVendors();
    }
  }, [isOpen, searchQuery, selectedService]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: 1,
        limit: 100, // Fetch enough vendors
        ...(searchQuery && { q: searchQuery }),
        ...(selectedService && { service: selectedService }),
      };
      const response = await adminAPI.getVendors(params);
      setVendors(response.data.data.vendors);
    } catch (err) {
      console.error('Error loading vendors:', err);
      setError('Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVendor = async (vendorId) => {
    if (!booking?._id) {
      setError('No booking selected for assignment.');
      return;
    }
    if (!window.confirm(`Are you sure you want to assign this vendor to booking #${booking._id.slice(-8)}?`)) {
      return;
    }

    try {
      setAssigning(true);
      setError(null);
      await adminAPI.assignVendorToBooking(booking._id, { vendorId });
      alert('Vendor assigned successfully!');
      onAssignmentSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning vendor:', err);
      setError(err.response?.data?.message || 'Failed to assign vendor. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const getServiceIcon = (service) => {
    switch (service) {
      case 'PHOTOGRAPHY': return <Camera className="w-4 h-4" />;
      case 'VIDEOGRAPHY': return <Video className="w-4 h-4" />;
      case 'CATERING': return <Utensils className="w-4 h-4" />;
      case 'DECORATION': return <Sparkles className="w-4 h-4" />;
      case 'ENTERTAINMENT': return <Mic className="w-4 h-4" />;
      case 'VENUE': return <MapPin className="w-4 h-4" />;
      case 'LIGHTING': return <Sun className="w-4 h-4" />;
      case 'SOUND': return <Volume2 className="w-4 h-4" />;
      case 'TRANSPORTATION': return <Car className="w-4 h-4" />;
      case 'SECURITY': return <Shield className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'BUSY': return 'bg-yellow-100 text-yellow-800';
      case 'UNAVAILABLE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? 'Change Vendor for Booking' : 'Assign Vendor to Booking'} #{booking?._id?.slice(-8) || 'N/A'}
          </h2>
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left Panel: Booking Details */}
          <div className="w-full lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Booking Details</h3>
            {booking ? (
              <div className="space-y-3 text-sm text-gray-700">
                <p className="flex items-center"><Users className="w-4 h-4 mr-2 text-primary-500" /> <strong>Customer:</strong> {booking.userId?.name} ({booking.userId?.email})</p>
                <p className="flex items-center"><Mail className="w-4 h-4 mr-2 text-primary-500" /> <strong>Customer Email:</strong> {booking.userId?.email}</p>
                <p className="flex items-center"><Phone className="w-4 h-4 mr-2 text-primary-500" /> <strong>Customer Phone:</strong> {booking.userId?.phone}</p>
                <p className="flex items-center"><Briefcase className="w-4 h-4 mr-2 text-primary-500" /> <strong>Package:</strong> {booking.packageId?.title} ({booking.packageId?.category})</p>
                <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-primary-500" /> <strong>Total Amount:</strong> ₹{booking.totalAmount?.toLocaleString()}</p>
                <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-primary-500" /> <strong>Amount Paid:</strong> ₹{booking.amountPaid?.toLocaleString()}</p>
                <p className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-primary-500" /> <strong>Event Date:</strong> {new Date(booking.eventDate).toLocaleDateString()}</p>
                <p className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-primary-500" /> <strong>Location:</strong> {booking.location}</p>
                <p className="flex items-center"><Info className="w-4 h-4 mr-2 text-primary-500" /> <strong>Status:</strong> <Badge className={`ml-2 ${getStatusBadgeColor(booking.status)}`}>{booking.status}</Badge></p>
                {booking.assignedVendorId && (
                  <p className="flex items-center"><UserCheck className="w-4 h-4 mr-2 text-green-500" /> <strong>Assigned Vendor:</strong> {booking.assignedVendorId?.businessName || booking.assignedVendorId?.name}</p>
                )}
                {isEditMode && currentVendor && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <UserCheck className="w-4 h-4 mr-2 text-blue-500" />
                      <div>
                        <p className="font-semibold text-blue-900">Current Vendor</p>
                        <p className="text-sm text-blue-700">{currentVendor.businessName || currentVendor.name || 'Current Vendor'}</p>
                        <p className="text-xs text-blue-600">Click on a new vendor below to change</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No booking details available.</p>
            )}
          </div>

          {/* Right Panel: Vendor Selection */}
          <div className="w-full lg:w-2/3 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {isEditMode ? 'Select New Vendor' : 'Select Vendor'}
            </h3>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors by name or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Services</option>
                {['PHOTOGRAPHY', 'CATERING', 'DECORATION', 'ENTERTAINMENT', 'VENUE', 'LIGHTING', 'SOUND', 'TRANSPORTATION', 'SECURITY', 'OTHER'].map(service => (
                  <option key={service} value={service}>{service.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="ml-3 text-gray-600">Loading vendors...</p>
              </div>
            ) : vendors.length === 0 ? (
              <p className="text-gray-500 text-center">No vendors found matching your criteria.</p>
            ) : (
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <Card key={vendor._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex-1 mb-3 sm:mb-0">
                      <h4 className="font-semibold text-lg text-gray-900 flex items-center">
                        {vendor.businessName || vendor.userId?.name || 'N/A'}
                        <Badge className={`ml-2 ${getStatusBadgeColor(vendor.availability)}`}>
                          {vendor.availability}
                        </Badge>
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" /> {vendor.rating?.toFixed(1) || 'N/A'} ({vendor.reviewCount || 0} reviews)
                        <MapPin className="w-4 h-4 ml-3 mr-1 text-gray-500" /> {vendor.location || 'N/A'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vendor.servicesOffered?.map(service => (
                          <Badge key={service} variant="outline" className="flex items-center text-blue-700 bg-blue-50 border-blue-200">
                            {getServiceIcon(service)}
                            <span className="ml-1">{service.replace('_', ' ')}</span>
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{vendor.bio || 'No bio provided.'}</p>
                    </div>
                    <Button
                      onClick={() => handleAssignVendor(vendor._id)}
                      disabled={assigning || vendor.availability !== 'AVAILABLE'}
                      className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700"
                    >
                      {assigning ? (isEditMode ? 'Changing...' : 'Assigning...') : (isEditMode ? 'Change Vendor' : 'Assign Vendor')}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAssignmentModal;