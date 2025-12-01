import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Settings,
  Award,
  Users,
  TrendingUp
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { vendorAPI } from '../services/api';

const VendorProfileNew = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
    availability: 'AVAILABLE',
    portfolio: [],
    pricing: {
      basePrice: 0,
      perHourRate: 0,
      packagePricing: []
    }
  });

  useEffect(() => {
    loadVendorProfile();
  }, []);

  const loadVendorProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vendorAPI.getVendorProfile();
      if (response.data.success) {
        const data = response.data.data;
        setVendorData(data);
      
        setFormData({
          name: data.user?.name || data.vendor?.name || '',
          email: data.user?.email || data.vendor?.email || '',
          phone: data.user?.phone || data.vendor?.phone || '',
          businessName: data.vendor.businessName || '',
          businessType: data.vendor.businessType || '',
          servicesOffered: data.vendor.servicesOffered || [],
          experience: data.vendor.experience || 0,
          location: data.vendor.location || '',
          bio: data.vendor.bio || '',
          availability: data.vendor.availability || 'AVAILABLE',
          portfolio: data.vendor.portfolio || [],
          pricing: data.vendor.pricing || {
            basePrice: 0,
            perHourRate: 0,
            packagePricing: []
          }
        });
      }
    } catch (error) {
      console.error('Error loading vendor profile:', error);
      setError(error.response?.data?.message || 'Failed to load vendor profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter(s => s !== service)
        : [...prev.servicesOffered, service]
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
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviceOptions = [
    'PHOTOGRAPHY', 'VIDEOGRAPHY', 'CATERING', 'DECORATION', 
    'ENTERTAINMENT', 'VENUE', 'LIGHTING', 'SOUND', 
    'TRANSPORTATION', 'SECURITY'
  ];

  if (loading && !vendorData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !vendorData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadVendorProfile} className="bg-blue-600 hover:bg-blue-700">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!vendorData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Profile Data</h2>
          <p className="text-gray-600 mb-4">Unable to load vendor profile. Please try refreshing the page.</p>
          <Button onClick={loadVendorProfile} className="bg-blue-600 hover:bg-blue-700">
            Reload Profile
          </Button>
        </Card>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{vendorData.user?.name || vendorData.vendor?.name || 'Vendor'}</h2>
                  <p className="text-gray-600 text-sm mb-3">{vendorData.user?.email || vendorData.vendor?.email || ''}</p>
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

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                        <p className="text-sm text-gray-600">Your basic contact details</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <User className="w-4 h-4 inline mr-2" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <Phone className="w-4 h-4 inline mr-2" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  {/* Business Information Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <Building className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                        <p className="text-sm text-gray-600">Your business details and services</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Business Type
                        </label>
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        >
                          <option value="">Select Business Type</option>
                          <option value="PHOTOGRAPHY">Photography</option>
                          <option value="CATERING">Catering</option>
                          <option value="DECORATION">Decoration</option>
                          <option value="ENTERTAINMENT">Entertainment</option>
                          <option value="VENUE">Venue</option>
                          <option value="LIGHTING">Lighting</option>
                          <option value="SOUND">Sound</option>
                          <option value="TRANSPORTATION">Transportation</option>
                          <option value="SECURITY">Security</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <MapPin className="w-4 h-4 inline mr-2" />
                          Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="City, State, Country"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <Briefcase className="w-4 h-4 inline mr-2" />
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Business Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows={4}
                        placeholder="Tell us about your business, your expertise, and what makes you unique..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all resize-none"
                      />
                      <p className="text-xs text-gray-500">Maximum 500 characters</p>
                    </div>
                  </div>

                  {/* Services Section */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Services Offered</h3>
                        <p className="text-sm text-gray-600">Select the services you provide</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {serviceOptions.map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => handleServiceToggle(service)}
                          disabled={!isEditing}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.servicesOffered.includes(service)
                              ? 'border-purple-500 bg-purple-100 text-purple-800'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                          } ${!isEditing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-medium">{service}</span>
                            {formData.servicesOffered.includes(service) && (
                              <CheckCircle className="w-4 h-4 ml-2" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                        <DollarSign className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Pricing Information</h3>
                        <p className="text-sm text-gray-600">Set your service rates</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Base Price (₹)
                        </label>
                        <input
                          type="number"
                          name="basePrice"
                          value={formData.pricing.basePrice}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, basePrice: parseInt(e.target.value) }
                          }))}
                          disabled={!isEditing}
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Per Hour Rate (₹)
                        </label>
                        <input
                          type="number"
                          name="perHourRate"
                          value={formData.pricing.perHourRate}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, perHourRate: parseInt(e.target.value) }
                          }))}
                          disabled={!isEditing}
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex items-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
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

export default VendorProfileNew;

