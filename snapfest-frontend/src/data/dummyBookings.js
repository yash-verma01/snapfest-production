// Dummy bookings data for frontend development
export const dummyBookings = [
  {
    _id: 'booking_001',
    packageData: {
      _id: 'pkg_001',
      title: 'Wedding Photography - Premium Package',
      images: ['https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400']
    },
    eventDate: '2024-06-15T10:00:00Z',
    location: 'Taj Palace Hotel, Mumbai',
    guests: 150,
    totalAmount: 100000,
    status: 'CONFIRMED',
    createdAt: '2024-01-15T10:30:00Z',
    vendor: {
      _id: 'vendor_001',
      name: 'Dream Wedding Photography',
      phone: '+91 98765 43210'
    },
    customer: {
      _id: 'user_001',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91 98765 43210'
    },
    paymentStatus: 'PARTIAL',
    paidAmount: 20000,
    remainingAmount: 80000,
    notes: 'Please focus on candid moments during the ceremony'
  },
  {
    _id: 'booking_002',
    packageData: {
      _id: 'pkg_002',
      title: 'Birthday Party Photography',
      images: ['https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400']
    },
    eventDate: '2024-05-20T16:00:00Z',
    location: 'Community Center, Delhi',
    guests: 40,
    totalAmount: 16000,
    status: 'PENDING',
    createdAt: '2024-02-01T14:15:00Z',
    vendor: {
      _id: 'vendor_002',
      name: 'Party Moments Studio',
      phone: '+91 98765 43211'
    },
    customer: {
      _id: 'user_002',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '+91 98765 43211'
    },
    paymentStatus: 'PENDING',
    paidAmount: 0,
    remainingAmount: 16000,
    notes: 'Kids birthday party - need fun and colorful photos'
  },
  {
    _id: 'booking_003',
    packageData: {
      _id: 'pkg_003',
      title: 'Haldi & Mehndi Ceremony',
      images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=400']
    },
    eventDate: '2024-04-10T09:00:00Z',
    location: 'Grand Hotel, Pune',
    guests: 80,
    totalAmount: 39000,
    status: 'COMPLETED',
    createdAt: '2024-01-25T09:45:00Z',
    vendor: {
      _id: 'vendor_003',
      name: 'Cultural Moments Photography',
      phone: '+91 98765 43212'
    },
    customer: {
      _id: 'user_003',
      name: 'Anita Patel',
      email: 'anita.patel@email.com',
      phone: '+91 98765 43212'
    },
    paymentStatus: 'COMPLETED',
    paidAmount: 39000,
    remainingAmount: 0,
    notes: 'Traditional haldi ceremony with vibrant colors'
  },
  {
    _id: 'booking_004',
    packageData: {
      _id: 'pkg_004',
      title: 'Corporate Event Photography',
      images: ['https://images.unsplash.com/photo-1511578314322-379afb476865?w=400']
    },
    eventDate: '2024-03-25T09:00:00Z',
    location: 'Convention Center, Bangalore',
    guests: 120,
    totalAmount: 30000,
    status: 'IN_PROGRESS',
    createdAt: '2024-02-01T11:20:00Z',
    vendor: {
      _id: 'vendor_004',
      name: 'Corporate Events Pro',
      phone: '+91 98765 43213'
    },
    customer: {
      _id: 'user_004',
      name: 'Vikram Singh',
      email: 'vikram.singh@email.com',
      phone: '+91 98765 43213'
    },
    paymentStatus: 'PARTIAL',
    paidAmount: 6000,
    remainingAmount: 24000,
    notes: 'Annual company conference - need professional photos'
  },
  {
    _id: 'booking_005',
    packageData: {
      _id: 'pkg_005',
      title: 'Baby Shower Photography',
      images: ['https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400']
    },
    eventDate: '2024-05-05T14:00:00Z',
    location: 'Home, Chennai',
    guests: 25,
    totalAmount: 8500,
    status: 'CANCELLED',
    createdAt: '2024-02-05T16:30:00Z',
    vendor: {
      _id: 'vendor_005',
      name: 'Little Moments Studio',
      phone: '+91 98765 43214'
    },
    customer: {
      _id: 'user_005',
      name: 'Meera Reddy',
      email: 'meera.reddy@email.com',
      phone: '+91 98765 43214'
    },
    paymentStatus: 'REFUNDED',
    paidAmount: 0,
    remainingAmount: 0,
    notes: 'Cancelled due to personal reasons',
    cancellationReason: 'Personal emergency'
  }
];

export const bookingStats = {
  total: 5,
  confirmed: 1,
  pending: 1,
  inProgress: 1,
  completed: 1,
  cancelled: 1
};

export const bookingStatuses = [
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'blue' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'purple' },
  { value: 'COMPLETED', label: 'Completed', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' }
];
