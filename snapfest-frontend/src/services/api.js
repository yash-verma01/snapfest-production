import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - cookie-based authentication
 * 
 * Switched from JWT tokens to Clerk cookie sessions:
 * - Removed getToken() calls and Authorization header injection for Clerk
 * - Session cookies are sent automatically via withCredentials: true
 * - Legacy token support kept for backward compatibility (if needed)
 */
api.interceptors.request.use(
  (config) => {
    // Only add legacy token if explicitly present (for non-Clerk routes)
    // Clerk authentication uses HTTP-only session cookies, not Authorization headers
    const legacyToken = localStorage.getItem('token');
    if (legacyToken && !config.headers.Authorization) {
      // Only add if Authorization header wasn't explicitly set in the request
      config.headers.Authorization = `Bearer ${legacyToken}`;
    }
    // Note: Clerk session cookies are automatically included via withCredentials: true
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('🔗 API: Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('🔗 API: Request failed:', error.response?.status, error.config?.url);
    console.error('🔗 API: Error details:', error.response?.data);
    // Do not force redirect; Clerk handles auth UI and ProtectedRoute gates access
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  // User authentication
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/users/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/users/reset-password', { token, password }),
  
  // Vendor authentication
  registerVendor: (vendorData) => api.post('/vendors/register', vendorData),
  loginVendor: (credentials) => api.post('/vendors/login', credentials),
  logoutVendor: () => api.post('/vendors/logout'),
};

export const userAPI = {
  // Authentication
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/users/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/users/reset-password', { token, password }),
  sendEmailVerification: () => api.post('/users/send-email-verification'),
  verifyEmail: (token) => api.post('/users/verify-email', { token }),
  
  // Profile management
  getUserProfile: () => api.get('/users/profile'),
  updateUserProfile: (data) => api.put('/users/profile', data),
  changeUserPassword: (data) => api.put('/users/change-password', data),
  
  // Stats
  getStats: () => api.get('/users/stats'),
  
  // Bookings
  getUpcomingBookings: () => api.get('/users/bookings/upcoming'),
  getBookingHistory: () => api.get('/users/bookings/history'),
  getBookingDetails: (id) => api.get(`/users/bookings/${id}/details`),
  getBookingInvoice: (id) => api.get(`/users/bookings/${id}/invoice`),
  updateBookingStatus: (id, data) => api.put(`/users/bookings/${id}/status`, data),
  
  // Support
  submitSupportRequest: (data) => api.post('/users/support', data),
  
  // Payments
  getPayments: () => api.get('/users/payments'),
  
  // Reviews
  getReviews: () => api.get('/users/reviews'),
  createReview: (data) => api.post('/users/reviews', data),
  
  // Testimonials
  addTestimonial: (data) => api.post('/users/testimonial', data),
  getTestimonials: () => api.get('/users/testimonials'),
  
  
  // Notifications & Activity
  getNotifications: () => api.get('/users/notifications'),
  getActivity: () => api.get('/users/activity'),
  
  // Search & Preferences
  getSearchHistory: () => api.get('/users/search-history'),
  saveSearch: (data) => api.post('/users/save-search', data),
  
  // Additional missing endpoints
  getUserStats: () => api.get('/users/stats'),
  // Sync Clerk user to backend DB (uses cookie-based authentication)
  // No config needed - cookies are sent automatically
  // role: optional role parameter ('user', 'vendor', 'admin')
  sync: (role) => {
    const url = role ? `/users/sync?role=${role}` : '/users/sync';
    return api.post(url);
  },
};

export const vendorAPI = {
  // Authentication
  registerVendor: (vendorData) => api.post('/vendors/register', vendorData),
  login: (credentials) => api.post('/vendors/login', credentials),
  loginVendor: (credentials) => api.post('/vendors/login', credentials),
  logoutVendor: () => api.post('/vendors/logout'),
  
  // Clerk sync (idempotent - creates/updates vendor in Vendor collection)
  sync: () => api.post('/vendors/sync'),
  
  // Profile management
  getVendorProfile: () => api.get('/vendors/profile'),
  updateVendorProfile: (data) => api.put('/vendors/profile', data),
  changeVendorPassword: (data) => api.put('/vendors/change-password', data),
  
  // Dashboard
  getDashboard: () => api.get('/vendors/dashboard'),
  getStats: () => api.get('/vendors/stats'),
  getPerformance: () => api.get('/vendors/performance'),
  
  // Booking management
  getBookings: (params) => api.get('/vendors/bookings', { params }),
  getBookingById: (id) => api.get(`/vendors/bookings/${id}`),
  getAssignedBookings: (params) => api.get('/vendors/bookings/assigned', { params }),
  updateBookingStatus: (id, data) => api.put(`/vendors/bookings/${id}/status`, data),
  acceptBooking: (id) => api.put(`/vendors/bookings/${id}/accept`),
  rejectBooking: (id, data) => api.put(`/vendors/bookings/${id}/reject`, data),
  startBooking: (id) => api.put(`/vendors/bookings/${id}/start`),
  completeBooking: (id, data) => api.put(`/vendors/bookings/${id}/complete`, data),
  cancelBooking: (id) => api.put(`/vendors/bookings/${id}/cancel`),
  verifyBookingOTP: (bookingId, data) => api.post(`/vendors/bookings/${bookingId}/verify-otp`, data),
  
  // OTP Management
  getPendingOTPs: () => api.get('/vendors/otps/pending'),
  verifyOTP: (data) => api.post('/vendors/verify-otp', data),
  getOTPById: (id) => api.get(`/vendors/otps/${id}`),
  verifySpecificOTP: (id, data) => api.post(`/vendors/otps/${id}/verify`, data),
  getOTPHistory: () => api.get('/vendors/otp/history'),
  requestNewOTP: (data) => api.post('/vendors/otp/request', data),
  
  // Payment Management
  confirmCashPayment: (data) => api.post('/vendors/payments/cash-confirm', data),
  getPendingPayments: () => api.get('/vendors/payments/pending'),
  verifyPaymentCompletion: (id, data) => api.put(`/vendors/payments/${id}/verify`, data),
  processPayment: (data) => api.post('/vendors/process-payment', data),
  getPayments: (params) => api.get('/vendors/payments', { params }),
  getPaymentById: (id) => api.get(`/vendors/payments/${id}`),
  getVendorPayments: (params) => api.get('/vendors/payments', { params }),
  
  // Availability & Settings
  getAvailability: () => api.get('/vendors/availability'),
  updateAvailability: (data) => api.put('/vendors/availability', data),
  toggleActive: (data) => api.put('/vendors/toggle-active', data),
  getSettings: () => api.get('/vendors/settings'),
  updateSettings: (data) => api.put('/vendors/settings', data),
  
  // Notifications & Communication
  getNotifications: (params) => api.get('/vendors/notifications', { params }),
  markNotificationRead: (id) => api.put(`/vendors/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/vendors/notifications/read-all'),
  getMessages: () => api.get('/vendors/messages'),
  sendMessageToAdmin: (data) => api.post('/vendors/messages', data),
  
  // Earnings & Payouts
  getEarnings: () => api.get('/vendors/earnings'),
  getMonthlyEarnings: () => api.get('/vendors/earnings/monthly'),
  getPayoutHistory: () => api.get('/vendors/payouts'),
  getPendingPayouts: () => api.get('/vendors/payouts/pending'),
  requestPayout: (data) => api.post('/vendors/payouts/request', data),
  
  // Workflow Management
  getPreparationTasks: () => api.get('/vendors/preparation'),
  completeTask: (id) => api.post(`/vendors/preparation/${id}/complete`),
  getEventChecklist: () => api.get('/vendors/checklist'),
  startEventExecution: (id) => api.post(`/vendors/events/${id}/start`),
  completeEvent: (id, data) => api.post(`/vendors/events/${id}/complete`, data),
  reportIssues: (id, data) => api.post(`/vendors/events/${id}/issues`, data),
};

export const adminAPI = {
  // Authentication
  login: (credentials) => api.post('/admin/auth/login', credentials),
  logout: () => api.post('/admin/logout'),
  
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getSystemStats: () => api.get('/admin/stats'),
  
  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  
  // Vendor Management
  getVendors: (params) => api.get('/admin/vendors', { params }),
  getVendorById: (id) => api.get(`/admin/vendors/${id}`),
  createVendor: (data) => api.post('/admin/vendors', data),
  updateVendor: (id, data) => api.put(`/admin/vendors/${id}`, data),
  deleteVendor: (id) => api.delete(`/admin/vendors/${id}`),
  toggleVendorStatus: (id) => api.put(`/admin/vendors/${id}/toggle-status`),
  
  // Package Management
  getPackages: (params) => api.get('/admin/packages', { params }),
  getPackageById: (id) => api.get(`/admin/packages/${id}`),
  createPackage: (data) => api.post('/admin/packages', data),
  updatePackage: (id, data) => api.put(`/admin/packages/${id}`, data),
  deletePackage: (id) => api.delete(`/admin/packages/${id}`),
  togglePackageStatus: (id) => api.put(`/admin/packages/${id}/toggle-status`),
  
  // Booking Management
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getBookingById: (id) => api.get(`/admin/bookings/${id}`),
  updateBooking: (id, data) => api.put(`/admin/bookings/${id}`, data),
  assignVendor: (id, data) => api.put(`/admin/bookings/${id}/assign-vendor`, data),
  cancelBooking: (id, data) => api.put(`/admin/bookings/${id}/cancel`, data),
  processBookingRefund: (id, data) => api.post(`/admin/bookings/${id}/refund`, data),
  generateBookingOTP: (bookingId) => api.post(`/admin/bookings/${bookingId}/generate-otp`),
  
  // Payment Management
  getPayments: (params) => api.get('/admin/payments', { params }),
  getPaymentById: (id) => api.get(`/admin/payments/${id}`),
  getPaymentStats: () => api.get('/admin/payments/stats'),
  verifyPayment: (id, data) => api.post(`/admin/payments/${id}/verify`, data),
  processRefund: (id, data) => api.post(`/admin/payments/${id}/refund`, data),
  
  // OTP Management
  getPendingOTPs: () => api.get('/admin/otp/pending'),
  generateOTP: (data) => api.post('/admin/otp/generate', data),
  verifyOTP: (data) => api.post('/admin/otp/verify', data),
  
  // System Management
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getSystemSettings: () => api.get('/admin/settings'),
  updateSystemSettings: (data) => api.put('/admin/settings', data),
  
  // Event Management
  getEvents: (params) => api.get('/admin/events', { params }),
  getEventById: (id) => api.get(`/admin/events/${id}`),
  createEvent: (data) => api.post('/admin/events', data),
  updateEvent: (id, data) => api.put(`/admin/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  toggleEventStatus: (id) => api.put(`/admin/events/${id}/toggle-status`),
  
  // Venue Management
  getVenues: (params) => api.get('/admin/venues', { params }),
  getVenueById: (id) => api.get(`/admin/venues/${id}`),
  createVenue: (data) => api.post('/admin/venues', data),
  updateVenue: (id, data) => api.put(`/admin/venues/${id}`, data),
  deleteVenue: (id) => api.delete(`/admin/venues/${id}`),
  toggleVenueStatus: (id) => api.put(`/admin/venues/${id}/toggle-status`),
  
  // Beat & Bloom Management
  getBeatBlooms: (params) => api.get('/admin/beatbloom', { params }),
  getBeatBloomById: (id) => api.get(`/admin/beatbloom/${id}`),
  createBeatBloom: (data) => api.post('/admin/beatbloom', data),
  updateBeatBloom: (id, data) => api.put(`/admin/beatbloom/${id}`, data),
  deleteBeatBloom: (id) => api.delete(`/admin/beatbloom/${id}`),
  toggleBeatBloomStatus: (id) => api.put(`/admin/beatbloom/${id}/toggle-status`),
  
  // Additional missing admin endpoints
  getSystemStats: () => api.get('/admin/stats'),
  searchUsers: (params) => api.get('/admin/users/search', { params }),
  searchVendors: (params) => api.get('/admin/vendors/search', { params }),
  getUserStats: () => api.get('/admin/users/stats'),
  getPackageStats: () => api.get('/admin/packages/stats'),
  getBookingStats: () => api.get('/admin/bookings/stats'),
  getPaymentStats: () => api.get('/admin/payments/stats'),
  assignVendorToBooking: (id, data) => {
    console.log('🔍 API Debug - assignVendorToBooking called with:', { id, data });
    console.log('🔍 API Debug - URL will be:', `/admin/bookings/${id}/assign-vendor`);
    return api.post(`/admin/bookings/${id}/assign-vendor`, data);
  },
  
  // Testimonial Management
  getTestimonials: (params) => api.get('/admin/testimonials', { params }),
  getTestimonialStats: () => api.get('/admin/testimonials/stats'),
  approveTestimonial: (id) => api.put(`/admin/testimonials/${id}/approve`),
  rejectTestimonial: (id) => api.put(`/admin/testimonials/${id}/reject`),
  
  
  // Admin Profile Management
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),
  
  // Notification Management
  getNotifications: (params) => api.get('/admin/notifications', { params }),
  markNotificationRead: (id) => api.put(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/admin/notifications/read-all'),
  
  // Image Upload Management
  uploadPackageImages: (packageId, formData) => api.post(`/upload/package/${packageId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadEventImages: (eventId, formData) => api.post(`/upload/event/${eventId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadVenueImages: (venueId, formData) => api.post(`/upload/venue/${venueId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadBeatBloomImages: (beatBloomId, formData) => api.post(`/upload/beatbloom/${beatBloomId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (imageUrl, type, id) => api.delete('/upload/image', { data: { imageUrl, type, id } }),
  
  // Enquiry Management
  getEnquiries: (params) => api.get('/admin/enquiries', { params }),
  getEnquiryById: (id) => api.get(`/admin/enquiries/${id}`),
  getEnquiryStats: () => api.get('/admin/enquiries/stats'),
  updateEnquiryStatus: (id, status) => api.put(`/admin/enquiries/${id}/status`, { status }),
  respondToEnquiry: (id, response) => api.post(`/admin/enquiries/${id}/respond`, { response })
};

export const publicAPI = {
  // Package browsing
  getPackages: (params) => api.get('/packages', { params }),
  getPackageById: (id) => api.get(`/packages/${id}`),
  getFeaturedPackages: () => api.get('/packages/featured'),
  getTrendingPackages: () => api.get('/packages/trending'),
  getPopularPackages: () => api.get('/packages/popular'),
  getPackagesByCategory: (category, params) => api.get(`/packages/category/${category}`, { params }),
  searchPackages: (params) => api.get('/packages/search', { params }),
  getPackageFilters: () => api.get('/packages/filters'),
  
  // Event management
  getEvents: (params) => api.get('/events', { params }),
  getUpcomingEvents: () => api.get('/events/upcoming'),
  getRecentEvents: () => api.get('/events/recent'),
  getEventById: (id) => api.get(`/events/${id}`),
  getEventsByCategory: (category, params) => api.get(`/events/category/${category}`, { params }),
  searchEvents: (params) => api.get('/events/search', { params }),
  
  // Beat & Bloom services
  getBeatBlooms: (params) => api.get('/beatbloom', { params }),
  getBeatBloomById: (id) => api.get(`/beatbloom/${id}`),
  getBeatBloomsByCategory: (category, params) => api.get(`/beatbloom/category/${category}`, { params }),
  searchBeatBlooms: (params) => api.get('/beatbloom/search', { params }),
  
  // Global search
  searchAll: (query) => api.get('/search', { params: { q: query } }),
  
  // Venue management
  getVenues: (params) => api.get('/venues', { params }),
  getVenueById: (id) => api.get(`/venues/${id}`),
  searchVenues: (params) => api.get('/venues/search', { params }),
  
  // Recommendations
  getRecommendedPackages: (userId, preferences) => api.get(`/recommendations/packages/${userId}`, { params: preferences }),
  getRecommendedEvents: (userId, preferences) => api.get(`/recommendations/events/${userId}`, { params: preferences }),
  getRecommendedVenues: (userId, preferences) => api.get(`/recommendations/venues/${userId}`, { params: preferences }),
  
  // Additional missing public endpoints
  getTrendingPackages: () => api.get('/packages/trending'),
  getPopularPackages: () => api.get('/packages/popular'),
  getPackageFilters: () => api.get('/packages/filters'),
  getRecentEvents: () => api.get('/events/recent'),
  searchEvents: (params) => api.get('/events/search', { params }),
  
  // Testimonials
  getTestimonials: (params) => api.get('/testimonials', { params }),
};

export const bookingAPI = {
  // User booking management
  getBookings: (params) => api.get('/bookings', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  createBooking: (data) => api.post('/bookings', data),
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
  getBookingStats: () => api.get('/bookings/stats'),
};

export const paymentAPI = {
  // Payment management
  getPayments: (params) => api.get('/payments', { params }),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  createPayment: (data) => api.post('/payments', data),
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getPaymentStats: () => api.get('/payments/stats'),
  
  // Razorpay integration
  createPartialPaymentOrder: (data) => api.post('/payments/create-order/partial', data),
  createFullPaymentOrder: (data) => api.post('/payments/create-order/full', data),
  processRefund: (data) => api.post('/payments/refund', data),
  getRefundDetails: (refundId) => api.get(`/payments/refund/${refundId}`),
  
  // Legacy payment methods
  processPartialPayment: (data) => api.post('/payments/partial', data),
  processFullPayment: (data) => api.post('/payments/full', data),
  confirmCashPayment: (data) => api.post('/payments/confirm-cash', data),
  verifyPaymentOTP: (data) => api.post('/payments/verify-otp', data),
  
  // Additional missing payment endpoints
  getPaymentStats: () => api.get('/payments/stats'),
  getRefundDetails: (refundId) => api.get(`/payments/refund/${refundId}`),
};

export const cartAPI = {
  // Cart management
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart', data),
  updateCartItem: (id, data) => api.put(`/cart/${id}`, data),
  removeFromCart: (id) => api.delete(`/cart/${id}`),
  clearCart: () => api.delete('/cart'),
  getCartStats: () => api.get('/cart/stats'),
};

export default api;
