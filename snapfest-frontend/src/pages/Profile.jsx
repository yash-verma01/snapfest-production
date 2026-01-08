import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Save, 
  X,
  Star,
  Package,
  CreditCard,
  Sparkles,
  Award,
  TrendingUp
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { userAPI } from '../services/api';
import { showErrorToast, showValidationErrors } from '../utils/errorMessageHandler';
import toast from 'react-hot-toast';
import { GlassCard, ScrollReveal } from '../components/enhanced';

const Profile = () => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    rating: 5,
    feedback: ''
  });
  
  // State for backend profile data (phone and address are stored in backend, not Clerk)
  const [backendProfile, setBackendProfile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
  });

  // Memoized display name
  const displayName = useMemo(() => {
    return formData.name || 
           backendProfile?.name || 
           user?.fullName || 
           (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ||
           user?.firstName ||
           user?.lastName ||
           (user?.primaryEmailAddress?.emailAddress?.split('@')[0]) ||
           'User';
  }, [formData.name, backendProfile?.name, user]);

  // Fetch backend profile on mount and when user changes
  useEffect(() => {
    const loadBackendProfile = async () => {
      try {
        const response = await userAPI.getUserProfile();
        const profileData = response.data.data.user;
        
        setBackendProfile(profileData);
        
        // Get name from backend first, then fallback to Clerk
        let displayName = profileData.name;
        
        // If backend name is empty/null/undefined, use Clerk's name
        if (!displayName || displayName.trim() === '') {
          displayName = user?.fullName || 
                       (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ||
                       user?.firstName ||
                       user?.lastName ||
                       '';
          
          // If we got name from Clerk but backend doesn't have it, update backend
          if (displayName && displayName.trim() !== '') {
            try {
              await userAPI.updateUserProfile({ name: displayName });
              // Reload profile after update
              const updatedResponse = await userAPI.getUserProfile();
              const updatedProfileData = updatedResponse.data.data.user;
              setBackendProfile(updatedProfileData);
            } catch (updateError) {
              // Silent fail - not critical
            }
          }
        }
        
        setFormData(prev => ({
          name: displayName || prev.name || '',
          email: profileData.email || user?.primaryEmailAddress?.emailAddress || prev.email || '',
          phone: profileData.phone || prev.phone || '',
          address: profileData.address || prev.address || {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
          },
        }));
      } catch (error) {
        // Fallback to Clerk data if backend fetch fails
        if (user) {
          setFormData({
            name: user.fullName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            phone: user.phoneNumbers?.[0]?.phoneNumber || '',
            address: {
              street: '',
              city: '',
              state: '',
              pincode: '',
              country: 'India'
            },
          });
        }
      }
    };

    if (user) {
      loadBackendProfile();
    }
  }, [user]);

  // Lazy load stats - only fetch when component is visible
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setStatsLoading(true);
        const response = await userAPI.getUserStats();
        setUserStats(response.data.data);
      } catch (error) {
        // Silent fail - stats are not critical
      } finally {
        setStatsLoading(false);
      }
    };

    const loadTestimonials = async () => {
      try {
        const response = await userAPI.getTestimonials();
        setTestimonials(response.data.data.testimonials);
      } catch (error) {
        // Silent fail
      }
    };

    if (user) {
      loadUserStats();
      loadTestimonials();
    }
  }, [user]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleAddressChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  }, []);

  const handleTestimonialChange = useCallback((e) => {
    const { name, value } = e.target;
    setTestimonialForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation with clear error messages
    const validationErrors = [];
    
    if (!testimonialForm.rating || testimonialForm.rating < 1 || testimonialForm.rating > 5) {
      validationErrors.push({
        field: 'rating',
        message: 'Please select a rating between 1 and 5 stars'
      });
    }
    
    if (!testimonialForm.feedback || testimonialForm.feedback.trim().length === 0) {
      validationErrors.push({
        field: 'feedback',
        message: 'Please provide your feedback. This field is required.'
      });
    } else if (testimonialForm.feedback.trim().length < 10) {
      validationErrors.push({
        field: 'feedback',
        message: 'Your feedback must be at least 10 characters long. Please provide more details about your experience.'
      });
    } else if (testimonialForm.feedback.trim().length > 1000) {
      validationErrors.push({
        field: 'feedback',
        message: 'Your feedback is too long. Please keep it under 1000 characters.'
      });
    }
    
    // Show client-side validation errors
    if (validationErrors.length > 0) {
      showValidationErrors(validationErrors);
      return;
    }
    
    try {
      setLoading(true);
      const response = await userAPI.createReview({
        rating: testimonialForm.rating,
        feedback: testimonialForm.feedback
      });
      
      if (response.data.success) {
        toast.success('Review submitted successfully! It will be visible in the Reviews section immediately.', {
          duration: 4000,
          style: {
            background: '#d1fae5',
            color: '#065f46',
            padding: '16px',
            borderRadius: '8px',
            borderLeft: '4px solid #10b981'
          }
        });
        setTestimonialForm({ rating: 5, feedback: '' });
        setShowTestimonialForm(false);
        
        // Reload testimonials to show the new one
        const testimonialsResponse = await userAPI.getTestimonials();
        if (testimonialsResponse.data.success) {
          setTestimonials(testimonialsResponse.data.data.testimonials || []);
        }
      }
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await userAPI.updateUserProfile(formData);
      
      // Update backend profile state with the response data
      setBackendProfile(response.data.data.user);
      
      setIsEditing(false);
      toast.success('Profile updated successfully!', {
        icon: '✅',
        duration: 3000
      });
    } catch (error) {
      toast.error('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = useCallback(() => {
    // Reset formData to current backend profile or Clerk user data
    setFormData({
      name: backendProfile?.name || user?.fullName || '',
      email: backendProfile?.email || user?.primaryEmailAddress?.emailAddress || '',
      phone: backendProfile?.phone || '',
      address: backendProfile?.address || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      }
    });
    setIsEditing(false);
  }, [backendProfile, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your profile.</p>
          <Button onClick={() => window.location.href = '/sign-in'}>
            Go to Login
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      {/* Enhanced Header */}
      <ScrollReveal direction="down">
        <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <ScrollReveal direction="up">
              <GlassCard className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white border-0"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">Address Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address
                          </label>
                          <input
                            type="text"
                            name="street"
                            value={formData.address.street}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.address.city}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.address.state}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pincode
                          </label>
                          <input
                            type="text"
                            name="pincode"
                            value={formData.address.pincode}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={formData.address.country}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-6 pb-6 border-b border-gray-200">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {displayName}
                        </h3>
                        <p className="text-gray-600">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-br from-pink-50 to-red-50 rounded-lg border border-pink-100">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Mail className="w-5 h-5 text-pink-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-1">Email</p>
                          <p className="font-medium text-gray-900 break-all">
                            {backendProfile?.email || user.primaryEmailAddress?.emailAddress || user.email || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-1">Phone</p>
                          <p className="font-medium text-gray-900">
                            {backendProfile?.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100 md:col-span-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MapPin className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-1">Address</p>
                          {(() => {
                            const address = backendProfile?.address;
                            return address && (address.street || address.city || address.state) ? (
                              <div className="text-sm">
                                {address.street && <p className="font-medium text-gray-900">{address.street}</p>}
                                <p className="text-gray-600">
                                  {[address.city, address.state, address.pincode].filter(Boolean).join(', ')}
                                </p>
                                {address.country && <p className="text-gray-600">{address.country}</p>}
                              </div>
                            ) : (
                              <p className="font-medium text-gray-900">Not provided</p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Stats */}
            <ScrollReveal direction="right" delay={0.1}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-pink-600" />
                    Your Activity
                  </h3>
                </div>
                {statsLoading ? (
                  <div className="space-y-4">
                    <div className="h-16 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="h-16 bg-gray-200 animate-pulse rounded-lg"></div>
                  </div>
                ) : userStats ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-lg border border-pink-100">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Package className="w-5 h-5 text-pink-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Total Bookings</span>
                      </div>
                      <span className="font-bold text-2xl text-pink-600">{userStats.bookings?.total || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Reviews Given</span>
                      </div>
                      <span className="font-bold text-2xl text-yellow-600">{userStats.reviews?.total || 0}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No activity data available</p>
                )}
              </GlassCard>
            </ScrollReveal>

            {/* Reviews Section */}
            <ScrollReveal direction="right" delay={0.2}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Your Reviews
                  </h3>
                  <Button
                    onClick={() => setShowTestimonialForm(!showTestimonialForm)}
                    className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white text-sm px-3 py-1.5"
                    size="sm"
                  >
                    Add Review
                  </Button>
                </div>

                {showTestimonialForm && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-pink-50 to-red-50 rounded-lg border border-pink-200">
                    <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating
                        </label>
                        <select
                          name="rating"
                          value={testimonialForm.rating}
                          onChange={handleTestimonialChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          <option value={5}>5 Stars - Excellent</option>
                          <option value={4}>4 Stars - Very Good</option>
                          <option value={3}>3 Stars - Good</option>
                          <option value={2}>2 Stars - Fair</option>
                          <option value={1}>1 Star - Poor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Feedback
                        </label>
                        <textarea
                          name="feedback"
                          value={testimonialForm.feedback}
                          onChange={handleTestimonialChange}
                          rows={4}
                          placeholder="Share your experience with SnapFest..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white flex-1"
                          size="sm"
                        >
                          {loading ? 'Submitting...' : 'Submit Review'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowTestimonialForm(false)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {testimonials.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No reviews yet. Share your experience!</p>
                  ) : (
                    testimonials.map((testimonial) => (
                      <div key={testimonial._id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          {testimonial.isApproved && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              Published
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm">{testimonial.feedback}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(testimonial.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* Quick Actions */}
            <ScrollReveal direction="right" delay={0.3}>
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:bg-pink-50 hover:border-pink-300 transition-all"
                    onClick={() => window.location.href = '/user/bookings'}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    View Bookings
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:bg-pink-50 hover:border-pink-300 transition-all"
                    onClick={() => window.location.href = '/cart'}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    View Cart
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:bg-pink-50 hover:border-pink-300 transition-all"
                    onClick={() => window.location.href = '/packages'}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Browse Packages
                  </Button>
                </div>
              </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Profile);
