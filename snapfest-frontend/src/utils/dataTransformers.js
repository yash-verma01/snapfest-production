// Data transformation utilities to handle backend-frontend data structure mismatches

// Transform package data to match frontend expectations
export const transformPackage = (packageData) => {
  return {
    id: packageData._id,
    title: packageData.title,
    description: packageData.description,
    price: packageData.basePrice,
    images: packageData.images || [packageData.primaryImage].filter(Boolean),
    features: packageData.highlights || packageData.features || [],
    category: packageData.category,
    rating: packageData.rating || 0,
    reviews: packageData.reviews || 0,
    location: packageData.location,
    vendor: packageData.vendor,
    isActive: packageData.isActive,
    createdAt: packageData.createdAt,
    updatedAt: packageData.updatedAt
  };
};

// Transform event data to match frontend expectations
export const transformEvent = (eventData) => {
  return {
    id: eventData._id,
    title: eventData.title,
    description: eventData.description,
    date: eventData.date,
    time: eventData.time,
    location: typeof eventData.location === 'string' 
      ? eventData.location 
      : eventData.location?.fullAddress || eventData.location?.name || '',
    type: eventData.type,
    images: eventData.images || [],
    price: eventData.price,
    capacity: eventData.capacity,
    organizer: eventData.organizer,
    isActive: eventData.isActive,
    createdAt: eventData.createdAt
  };
};

// Transform venue data to match frontend expectations
export const transformVenue = (venueData) => {
  return {
    id: venueData._id,
    name: venueData.name,
    description: venueData.description,
    location: venueData.location,
    capacity: venueData.capacity,
    price: venueData.price,
    images: venueData.images || [],
    amenities: venueData.amenities || [],
    rating: venueData.rating || 0,
    reviews: venueData.reviews || 0,
    isActive: venueData.isActive,
    createdAt: venueData.createdAt
  };
};

// Transform booking data to match frontend expectations
export const transformBooking = (bookingData) => {
  return {
    id: bookingData._id,
    packageId: bookingData.packageId,
    userId: bookingData.userId,
    vendorId: bookingData.vendorId,
    eventDate: bookingData.eventDate,
    totalAmount: bookingData.totalAmount,
    status: bookingData.status,
    paymentStatus: bookingData.paymentStatus,
    createdAt: bookingData.createdAt,
    updatedAt: bookingData.updatedAt
  };
};

// Transform user data to match frontend expectations
export const transformUser = (userData) => {
  return {
    id: userData._id,
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    role: userData.role,
    profileImage: userData.profileImage,
    address: userData.address || {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    isActive: userData.isActive,
    isEmailVerified: userData.isEmailVerified,
    isPhoneVerified: userData.isPhoneVerified,
    createdAt: userData.createdAt
  };
};

// Transform vendor data to match frontend expectations
export const transformVendor = (vendorData) => {
  return {
    id: vendorData._id,
    userId: vendorData.userId,
    businessName: vendorData.businessName,
    businessType: vendorData.businessType,
    servicesOffered: vendorData.servicesOffered || [],
    location: vendorData.location,
    bio: vendorData.bio,
    experience: vendorData.experience || 0,
    portfolio: vendorData.portfolio || [],
    pricing: vendorData.pricing || {},
    availability: vendorData.availability || 'AVAILABLE',
    profileComplete: vendorData.profileComplete || false,
    earningsSummary: vendorData.earningsSummary || {
      totalEarnings: 0,
      thisMonthEarnings: 0,
      totalBookings: 0
    },
    rating: vendorData.rating || 0,
    totalBookings: vendorData.totalBookings || 0,
    totalEarnings: vendorData.totalEarnings || 0,
    createdAt: vendorData.createdAt
  };
};

// Transform testimonial data to match frontend expectations
export const transformTestimonial = (testimonialData) => {
  return {
    id: testimonialData._id,
    name: testimonialData.userId?.name || 'Anonymous',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    rating: testimonialData.rating,
    review: testimonialData.feedback,
    event: 'Testimonial',
    date: new Date(testimonialData.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    }),
    location: 'India'
  };
};

// Transform dashboard data to match frontend expectations
export const transformDashboardData = (dashboardData) => {
  return {
    totalUsers: dashboardData.totalUsers || 0,
    totalVendors: dashboardData.totalVendors || 0,
    totalBookings: dashboardData.totalBookings || 0,
    totalPackages: dashboardData.totalPackages || 0,
    monthlyRevenue: dashboardData.monthlyRevenue || 0,
    pendingVendors: dashboardData.pendingVendors || 0,
    pendingBookings: dashboardData.pendingBookings || 0,
    recentBookings: dashboardData.recentBookings || [],
    recentUsers: dashboardData.recentUsers || [],
    recentVendors: dashboardData.recentVendors || []
  };
};

// Transform vendor dashboard data
export const transformVendorDashboard = (dashboardData) => {
  return {
    totalBookings: dashboardData.totalBookings || 0,
    pendingBookings: dashboardData.pendingBookings || 0,
    completedBookings: dashboardData.completedBookings || 0,
    totalEarnings: dashboardData.totalEarnings || 0,
    thisMonthEarnings: dashboardData.thisMonthEarnings || 0,
    averageRating: dashboardData.averageRating || 0
  };
};

// Generic API response transformer
export const transformApiResponse = (response, transformer = null) => {
  if (!response?.data?.success) {
    throw new Error(response?.data?.message || 'API request failed');
  }

  const data = response.data.data;
  
  if (transformer && Array.isArray(data)) {
    return data.map(transformer);
  } else if (transformer && data) {
    return transformer(data);
  }
  
  return data;
};

// Handle paginated responses
export const transformPaginatedResponse = (response, transformer = null) => {
  if (!response?.data?.success) {
    throw new Error(response?.data?.message || 'API request failed');
  }

  const data = response.data.data;
  const items = data.items || data.packages || data.events || data.venues || data.bookings || [];
  const pagination = data.pagination || {};

  return {
    items: transformer ? items.map(transformer) : items,
    pagination: {
      current: pagination.current || 1,
      pages: pagination.pages || 1,
      total: pagination.total || items.length
    }
  };
};

