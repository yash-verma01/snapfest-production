// Dummy user data for frontend development
export const dummyUser = {
  _id: 'user_001',
  name: 'Priya Sharma',
  email: 'priya.sharma@email.com',
  phone: '+91 98765 43210',
  role: 'user',
  profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
  isActive: true,
  preferences: {
    notifications: {
      email: true,
      sms: true,
      push: true
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false
    }
  },
  stats: {
    totalBookings: 3,
    completedBookings: 2,
    totalSpent: 145000,
    memberSince: '2023-08-15T10:30:00Z'
  },
  address: {
    street: '123 MG Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India'
  }
};

export const dummyVendor = {
  _id: 'vendor_001',
  name: 'Dream Wedding Photography',
  email: 'contact@dreamwedding.com',
  phone: '+91 98765 43210',
  role: 'vendor',
  profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  isActive: true,
  businessDetails: {
    businessName: 'Dream Wedding Photography',
    businessType: 'Photography',
    experience: '8 years',
    location: 'Mumbai, Maharashtra',
    rating: 4.9,
    totalBookings: 156,
    specialties: ['Wedding Photography', 'Pre-wedding', 'Engagement']
  },
  stats: {
    totalBookings: 156,
    completedBookings: 142,
    totalEarnings: 2500000,
    averageRating: 4.9,
    memberSince: '2020-03-15T10:30:00Z'
  }
};

export const dummyAdmin = {
  _id: 'admin_001',
  name: 'Admin User',
  email: 'admin@snapfest.com',
  phone: '+91 98765 43200',
  role: 'admin',
  profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  isActive: true,
  permissions: [
    'manage_users',
    'manage_vendors',
    'manage_packages',
    'manage_bookings',
    'view_analytics',
    'manage_payments'
  ]
};

export const dummyNotifications = [
  {
    _id: 'notif_001',
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    message: 'Your wedding photography booking for June 15, 2024 has been confirmed.',
    isRead: false,
    createdAt: '2024-02-15T10:30:00Z',
    data: {
      bookingId: 'booking_001',
      eventDate: '2024-06-15T10:00:00Z'
    }
  },
  {
    _id: 'notif_002',
    type: 'payment_reminder',
    title: 'Payment Reminder',
    message: 'Remaining payment of ₹80,000 is due for your wedding photography booking.',
    isRead: false,
    createdAt: '2024-02-14T09:15:00Z',
    data: {
      bookingId: 'booking_001',
      amount: 80000
    }
  },
  {
    _id: 'notif_003',
    type: 'booking_updated',
    title: 'Booking Updated',
    message: 'Your birthday party photography booking has been updated with new details.',
    isRead: true,
    createdAt: '2024-02-13T14:20:00Z',
    data: {
      bookingId: 'booking_002'
    }
  },
  {
    _id: 'notif_004',
    type: 'review_request',
    title: 'Review Request',
    message: 'How was your haldi ceremony photography experience? Please share your feedback.',
    isRead: true,
    createdAt: '2024-02-12T16:45:00Z',
    data: {
      bookingId: 'booking_003',
      vendorId: 'vendor_003'
    }
  }
];

export const dummyActivity = [
  {
    _id: 'activity_001',
    type: 'booking_created',
    description: 'Created new booking for Wedding Photography',
    timestamp: '2024-02-15T10:30:00Z',
    data: {
      bookingId: 'booking_001',
      packageTitle: 'Wedding Photography - Premium Package'
    }
  },
  {
    _id: 'activity_002',
    type: 'payment_made',
    description: 'Made partial payment of ₹20,000',
    timestamp: '2024-02-15T10:35:00Z',
    data: {
      bookingId: 'booking_001',
      amount: 20000
    }
  },
  {
    _id: 'activity_003',
    type: 'profile_updated',
    description: 'Updated profile information',
    timestamp: '2024-02-14T15:20:00Z',
    data: {
      fields: ['phone', 'address']
    }
  },
  {
    _id: 'activity_004',
    type: 'booking_cancelled',
    description: 'Cancelled Baby Shower Photography booking',
    timestamp: '2024-02-10T11:15:00Z',
    data: {
      bookingId: 'booking_005',
      reason: 'Personal emergency'
    }
  }
];





