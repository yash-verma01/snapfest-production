// Mock API service for frontend development
import { dummyData } from '../data';

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API responses
export const mockApi = {
  // Packages API
  packages: {
    getPackages: async (params = {}) => {
      await delay();
      const { page = 1, limit = 12, category, minPrice, maxPrice, search } = params;
      
      let filteredPackages = [...dummyData.packages];
      
      // Apply filters
      if (category) {
        filteredPackages = filteredPackages.filter(pkg => pkg.category === category);
      }
      
      if (minPrice) {
        filteredPackages = filteredPackages.filter(pkg => pkg.basePrice >= minPrice);
      }
      
      if (maxPrice) {
        filteredPackages = filteredPackages.filter(pkg => pkg.basePrice <= maxPrice);
      }
      
      if (search) {
        filteredPackages = filteredPackages.filter(pkg => 
          pkg.title.toLowerCase().includes(search.toLowerCase()) ||
          pkg.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPackages = filteredPackages.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          packages: paginatedPackages,
          pagination: {
            page,
            limit,
            total: filteredPackages.length,
            totalPages: Math.ceil(filteredPackages.length / limit)
          }
        }
      };
    },
    
    getPackageById: async (id) => {
      await delay();
      const packageData = dummyData.packages.find(pkg => pkg._id === id);
      
      if (!packageData) {
        throw new Error('Package not found');
      }
      
      return {
        success: true,
        data: { packageData: packageData }
      };
    }
  },
  
  // Testimonials API
  testimonials: {
    getTestimonials: async (params = {}) => {
      await delay();
      const { page = 1, limit = 10 } = params;
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTestimonials = dummyData.testimonials.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          testimonials: paginatedTestimonials,
          pagination: {
            page,
            limit,
            total: dummyData.testimonials.length,
            totalPages: Math.ceil(dummyData.testimonials.length / limit)
          }
        }
      };
    }
  },
  
  // Bookings API
  bookings: {
    getBookings: async (params = {}) => {
      await delay();
      const { page = 1, limit = 10, status } = params;
      
      let filteredBookings = [...dummyData.bookings];
      
      if (status) {
        filteredBookings = filteredBookings.filter(booking => booking.status === status);
      }
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          bookings: paginatedBookings,
          pagination: {
            page,
            limit,
            total: filteredBookings.length,
            totalPages: Math.ceil(filteredBookings.length / limit)
          }
        }
      };
    },
    
    getBookingById: async (id) => {
      await delay();
      const booking = dummyData.bookings.find(booking => booking._id === id);
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      return {
        success: true,
        data: { booking }
      };
    },
    
    createBooking: async (bookingData) => {
      await delay();
      const newBooking = {
        _id: `booking_${Date.now()}`,
        ...bookingData,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        paymentStatus: 'PENDING',
        paidAmount: 0,
        remainingAmount: bookingData.totalAmount
      };
      
      return {
        success: true,
        data: { booking: newBooking }
      };
    },
    
    updateBookingStatus: async (id, status) => {
      await delay();
      const booking = dummyData.bookings.find(booking => booking._id === id);
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      booking.status = status;
      
      return {
        success: true,
        data: { booking }
      };
    }
  },
  
  // Events API
  events: {
    getEvents: async (params = {}) => {
      await delay();
      const { page = 1, limit = 12, type, featured } = params;
      
      let filteredEvents = [...dummyData.events];
      
      if (type) {
        filteredEvents = filteredEvents.filter(event => event.type === type);
      }
      
      if (featured) {
        filteredEvents = filteredEvents.filter(event => event.featured === true);
      }
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          events: paginatedEvents,
          pagination: {
            page,
            limit,
            total: filteredEvents.length,
            totalPages: Math.ceil(filteredEvents.length / limit)
          }
        }
      };
    },
    
    getEventById: async (id) => {
      await delay();
      const event = dummyData.events.find(event => event._id === id);
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      return {
        success: true,
        data: { event }
      };
    }
  },
  
  // Add-ons API
  addOns: {
    getAddOns: async (params = {}) => {
      await delay();
      const { page = 1, limit = 20, category } = params;
      
      let filteredAddOns = [...dummyData.addOns];
      
      if (category) {
        filteredAddOns = filteredAddOns.filter(addOn => addOn.category === category);
      }
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAddOns = filteredAddOns.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          addOns: paginatedAddOns,
          pagination: {
            page,
            limit,
            total: filteredAddOns.length,
            totalPages: Math.ceil(filteredAddOns.length / limit)
          }
        }
      };
    }
  },
  
  // User API
  users: {
    getProfile: async () => {
      await delay();
      return {
        success: true,
        data: { user: dummyData.users.user }
      };
    },
    
    updateProfile: async (userData) => {
      await delay();
      const updatedUser = { ...dummyData.users.user, ...userData };
      return {
        success: true,
        data: { user: updatedUser }
      };
    },
    
    getNotifications: async () => {
      await delay();
      return {
        success: true,
        data: { notifications: dummyData.users.user.notifications || [] }
      };
    },
    
    getActivity: async () => {
      await delay();
      return {
        success: true,
        data: { activity: dummyData.users.user.activity || [] }
      };
    }
  },
  
  // Cart API
  cart: {
    getCart: async () => {
      await delay();
      return {
        success: true,
        data: { cart: null } // Empty cart for now
      };
    },
    
    addToCart: async (itemData) => {
      await delay();
      return {
        success: true,
        data: { message: 'Item added to cart' }
      };
    },
    
    updateCartItem: async (itemId, updates) => {
      await delay();
      return {
        success: true,
        data: { message: 'Cart item updated' }
      };
    },
    
    removeFromCart: async (itemId) => {
      await delay();
      return {
        success: true,
        data: { message: 'Item removed from cart' }
      };
    },
    
    clearCart: async () => {
      await delay();
      return {
        success: true,
        data: { message: 'Cart cleared' }
      };
    }
  }
};

export default mockApi;
