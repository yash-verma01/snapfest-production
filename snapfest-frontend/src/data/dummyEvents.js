// Dummy events data for frontend development
export const dummyEvents = [
  {
    _id: 'event_001',
    title: 'Summer Wedding Showcase',
    description: 'Join us for an exclusive showcase of our latest wedding photography collections and meet our talented photographers.',
    date: '2024-04-15T10:00:00Z',
    location: 'Taj Palace Hotel, Mumbai',
    type: 'showcase',
    images: [
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
      'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
    ],
    isActive: true,
    featured: true,
    attendees: 45,
    maxAttendees: 100,
    price: 0,
    organizer: {
      name: 'SnapFest Team',
      email: 'events@snapfest.com',
      phone: '+91 98765 43200'
    }
  },
  {
    _id: 'event_002',
    title: 'Photography Workshop - Portrait Techniques',
    description: 'Learn advanced portrait photography techniques from our expert photographers. Perfect for beginners and enthusiasts.',
    date: '2024-05-20T14:00:00Z',
    location: 'Creative Studio, Delhi',
    type: 'workshop',
    images: [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
    ],
    isActive: true,
    featured: false,
    attendees: 28,
    maxAttendees: 50,
    price: 2500,
    organizer: {
      name: 'Photography Academy',
      email: 'workshop@photographyacademy.com',
      phone: '+91 98765 43201'
    }
  },
  {
    _id: 'event_003',
    title: 'Wedding Photography Exhibition',
    description: 'Explore stunning wedding photography collections from our top photographers. Get inspired for your special day.',
    date: '2024-06-10T11:00:00Z',
    location: 'Art Gallery, Pune',
    type: 'exhibition',
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
      'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400',
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400'
    ],
    isActive: true,
    featured: true,
    attendees: 67,
    maxAttendees: 150,
    price: 0,
    organizer: {
      name: 'Wedding Photography Society',
      email: 'exhibition@weddingphotos.com',
      phone: '+91 98765 43202'
    }
  },
  {
    _id: 'event_004',
    title: 'Corporate Photography Seminar',
    description: 'Professional photography techniques for corporate events, conferences, and business documentation.',
    date: '2024-07-05T09:00:00Z',
    location: 'Business Center, Bangalore',
    type: 'seminar',
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
    ],
    isActive: true,
    featured: false,
    attendees: 34,
    maxAttendees: 80,
    price: 1500,
    organizer: {
      name: 'Corporate Photography Institute',
      email: 'seminar@corporatephoto.com',
      phone: '+91 98765 43203'
    }
  }
];

export const eventTypes = [
  { value: 'showcase', label: 'Showcase', count: 12 },
  { value: 'workshop', label: 'Workshop', count: 8 },
  { value: 'exhibition', label: 'Exhibition', count: 6 },
  { value: 'seminar', label: 'Seminar', count: 4 },
  { value: 'meetup', label: 'Meetup', count: 3 }
];

export const eventStats = {
  total: 33,
  upcoming: 12,
  past: 21,
  featured: 8,
  free: 15,
  paid: 18
};





