import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
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
  Star,
  Package,
  CreditCard
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { userAPI } from '../services/api';

const Profile = () => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
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

  // Fetch backend profile on mount and when user changes
  useEffect(() => {
    const loadBackendProfile = async () => {
      try {
        const response = await userAPI.getUserProfile();
        const profileData = response.data.data.user;
        console.log('🔍 Backend profile loaded:', profileData);
        console.log('🔍 Backend profile name:', profileData.name);
        console.log('🔍 Backend profile name type:', typeof profileData.name);
        console.log('🔍 Backend profile name length:', profileData.name?.length);
        console.log('🔍 Clerk user fullName:', user?.fullName);
        console.log('🔍 Clerk user firstName:', user?.firstName);
        console.log('🔍 Clerk user lastName:', user?.lastName);
        
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
            console.log('🔍 Backend name is empty, updating from Clerk:', displayName);
            try {
              await userAPI.updateUserProfile({ name: displayName });
              // Reload profile after update
              const updatedResponse = await userAPI.getUserProfile();
              const updatedProfileData = updatedResponse.data.data.user;
              setBackendProfile(updatedProfileData);
              console.log('🔍 Backend profile updated with name:', updatedProfileData.name);
            } catch (updateError) {
              console.error('Error updating name in backend:', updateError);
            }
          }
        }
        
        console.log('🔍 Final displayName:', displayName);
        
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
        console.error('Error loading backend profile:', error);
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

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const response = await userAPI.getUserStats();
        setUserStats(response.data.data);
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    };

    const loadTestimonials = async () => {
      try {
        const response = await userAPI.getTestimonials();
        setTestimonials(response.data.data.testimonials);
      } catch (error) {
        console.error('Error loading testimonials:', error);
      }
    };

    if (user) {
      loadUserStats();
      loadTestimonials();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    console.log('🔍 Frontend: Address change:', name, value);
    setFormData(prev => {
      const newFormData = {
        ...prev,
        address: {
          ...prev.address,
          [name]: value
        }
      };
      console.log('🔍 Frontend: New form data after address change:', newFormData);
      return newFormData;
    });
  };

  const handleTestimonialChange = (e) => {
    const { name, value } = e.target;
    setTestimonialForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Create review (without bookingId) - this will also create a testimonial entry for admin approval
      const response = await userAPI.createReview({
        rating: testimonialForm.rating,
        feedback: testimonialForm.feedback
        // No bookingId - this is a general review from profile
      });
      
      if (response.data.success) {
        alert('Review submitted successfully! It will be visible in the Reviews section immediately. If approved by admin, it will also appear in the Testimonials section.');
        setTestimonialForm({ rating: 5, feedback: '' });
        setShowTestimonialForm(false);
        
        // Reload testimonials to show the new one
        const testimonialsResponse = await userAPI.getTestimonials();
        if (testimonialsResponse.data.success) {
          setTestimonials(testimonialsResponse.data.data.testimonials || []);
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || 'Error submitting review. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log('🔍 Frontend: Sending profile data:', formData);
      console.log('🔍 Frontend: Address being sent:', formData.address);
      const response = await userAPI.updateUserProfile(formData);
      console.log('🔍 Frontend: Profile update response:', response.data);
      console.log('🔍 Frontend: User data from response:', response.data.data.user);
      console.log('🔍 Frontend: Address from response:', response.data.data.user.address);
      
      // Update backend profile state with the response data
      setBackendProfile(response.data.data.user);
      
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
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
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your profile.</p>
          <Button onClick={() => window.location.href = '/sign-in'}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center gap-2"
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
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {(() => {
                          const name = formData.name || 
                                      backendProfile?.name || 
                                      user?.fullName || 
                                      (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ||
                                      user?.firstName ||
                                      user?.lastName ||
                                      (user?.primaryEmailAddress?.emailAddress?.split('@')[0]) ||
                                      'User';
                          console.log('🔍 Display name check:', {
                            formDataName: formData.name,
                            backendProfileName: backendProfile?.name,
                            userFullName: user?.fullName,
                            finalName: name
                          });
                          return name;
                        })()}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">
                          {backendProfile?.email || user.primaryEmailAddress?.emailAddress || user.email || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">
                          {backendProfile?.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        {(() => {
                          const address = backendProfile?.address;
                          console.log('🔍 Frontend: Address display check:', {
                            hasAddress: !!address,
                            address: address,
                            hasStreet: address?.street,
                            hasCity: address?.city,
                            hasState: address?.state
                          });
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
            </Card>
          </div>

          {/* Stats and Quick Actions */}
          <div className="space-y-6">
            {/* User Stats */}
            {userStats && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-600">Total Bookings</span>
                    </div>
                    <span className="font-semibold text-gray-900">{userStats.bookings?.total || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-gray-600">Reviews Given</span>
                    </div>
                    <span className="font-semibold text-gray-900">{userStats.reviews?.total || 0}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Reviews Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Reviews</h3>
                <Button
                  onClick={() => setShowTestimonialForm(!showTestimonialForm)}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  Add Review
                </Button>
              </div>

              {showTestimonialForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <select
                        name="rating"
                        value={testimonialForm.rating}
                        onChange={handleTestimonialChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-primary-600 hover:bg-primary-700 text-white"
                      >
                        {loading ? 'Submitting...' : 'Submit Review'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowTestimonialForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {testimonials.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No reviews yet. Share your experience!</p>
                ) : (
                  testimonials.map((testimonial) => (
                    <div key={testimonial._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
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
                          <Badge className="bg-green-100 text-green-800">
                            Published in Testimonials
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700">{testimonial.feedback}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(testimonial.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/user/profile'}
                >
                  <Package className="w-4 h-4 mr-2" />
                  View Bookings
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/cart'}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  View Cart
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/packages'}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Browse Packages
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
