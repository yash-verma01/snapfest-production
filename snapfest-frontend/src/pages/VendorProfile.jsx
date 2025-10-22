import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  X,
  Camera,
  Shield,
  Star,
  Package,
  CreditCard,
  Building,
  Briefcase,
  DollarSign,
  Image,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Settings
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { vendorAPI } from '../services/api';

const VendorProfile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    servicesOffered: [],
    experience: 0,
    location: '',
    bio: '',
    pricing: {
      basePrice: 0,
      perHourRate: 0,
      packagePricing: []
    },
    portfolio: []
  });

  const serviceOptions = [
    'CATERING', 'DECORATION', 'PHOTOGRAPHY', 'VIDEOGRAPHY', 
    'ENTERTAINMENT', 'VENUE', 'LIGHTING', 'SOUND', 
    'TRANSPORTATION', 'SECURITY'
  ];

  const businessTypeOptions = [
    'PHOTOGRAPHY', 'CATERING', 'DECORATION', 'ENTERTAINMENT', 
    'VENUE', 'LIGHTING', 'SOUND', 'TRANSPORTATION', 'SECURITY', 'OTHER'
  ];

  useEffect(() => {
    const loadVendorProfile = async () => {
      try {
        setLoading(true);
        const response = await vendorAPI.getVendorProfile();
        if (response.data.success) {
          const { user: userData, vendor } = response.data.data;
          setVendorData({ user: userData, vendor });
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            businessName: vendor.businessName || '',
            businessType: vendor.businessType || '',
            servicesOffered: vendor.servicesOffered || [],
            experience: vendor.experience || 0,
            location: vendor.location || '',
            bio: vendor.bio || '',
            pricing: vendor.pricing || { basePrice: 0, perHourRate: 0, packagePricing: [] },
            portfolio: vendor.portfolio || []
          });
        }
      } catch (error) {
        console.error('Error loading vendor profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVendorProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (service) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter(s => s !== service)
        : [...prev.servicesOffered, service]
    }));
  };

  const handlePricingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }));
  };

  const handlePortfolioChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.map((item, i) => i === index ? value : item)
    }));
  };

  const addPortfolioItem = () => {
    setFormData(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, '']
    }));
  };

  const removePortfolioItem = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await vendorAPI.updateVendorProfile(formData);
      if (response.data.success) {
        setVendorData(response.data.data);
        setIsEditing(false);
        // Show success message
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  if (loading && !vendorData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/vendor/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
                className="flex items-center"
              >
                {isEditing ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    View Mode
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {vendorData && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Profile Overview Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white shadow-lg border-0">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <User className="w-12 h-12 text-white" />
                    </div>
                    {vendorData.vendor.profileComplete && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{vendorData.user.name}</h2>
                  <p className="text-gray-600 text-sm mb-3">{vendorData.user.email}</p>
                  <Badge 
                    className={`px-3 py-1 text-xs font-medium ${
                      vendorData.vendor.profileComplete 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}
                  >
                    {vendorData.vendor.profileComplete ? 'Profile Complete' : 'Complete Profile'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Building className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{vendorData.vendor.businessName}</p>
                      <p className="text-xs text-gray-500">Business Name</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{vendorData.vendor.location || 'Not specified'}</p>
                      <p className="text-xs text-gray-500">Location</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{vendorData.vendor.experience} years</p>
                      <p className="text-xs text-gray-500">Experience</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{vendorData.vendor.rating || 0}/5</p>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Profile Form */}
            <div className="lg:col-span-3">
              <Card className="p-8 bg-white shadow-lg border-0">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
                    <p className="text-gray-600 mt-1">Manage your business information and services</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Profile Settings</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      >
                        <option value="">Select Business Type</option>
                        {businessTypeOptions.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Services Offered */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {serviceOptions.map(service => (
                        <label key={service} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.servicesOffered.includes(service)}
                            onChange={() => handleServiceChange(service)}
                            disabled={!isEditing}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      placeholder="Tell us about your business..."
                    />
                  </div>

                  {/* Pricing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pricing</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Base Price (₹)</label>
                        <input
                          type="number"
                          value={formData.pricing.basePrice}
                          onChange={(e) => handlePricingChange('basePrice', parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Per Hour Rate (₹)</label>
                        <input
                          type="number"
                          value={formData.pricing.perHourRate}
                          onChange={(e) => handlePricingChange('perHourRate', parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Links</label>
                    {formData.portfolio.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="url"
                          value={item}
                          onChange={(e) => handlePortfolioChange(index, e.target.value)}
                          disabled={!isEditing}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          placeholder="Portfolio URL"
                        />
                        {isEditing && (
                          <Button
                            type="button"
                            onClick={() => removePortfolioItem(index)}
                            variant="outline"
                            size="sm"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <Button
                        type="button"
                        onClick={addPortfolioItem}
                        variant="outline"
                        size="sm"
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Add Portfolio Item
                      </Button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProfile;
