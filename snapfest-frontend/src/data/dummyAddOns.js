// Dummy add-ons data for frontend development
export const dummyAddOns = [
  {
    _id: 'addon_001',
    name: 'Drone Photography',
    description: 'Aerial shots and bird\'s eye view photography using professional drones',
    price: 5000,
    category: 'photography',
    duration: '2 hours',
    images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400'],
    isActive: true,
    features: [
      'Aerial shots',
      'Bird\'s eye view',
      'Professional drone',
      'HD video recording'
    ],
    vendor: {
      _id: 'vendor_001',
      name: 'Dream Wedding Photography'
    }
  },
  {
    _id: 'addon_002',
    name: 'Same Day Preview',
    description: 'Get a preview of your photos on the same day of the event',
    price: 2000,
    category: 'service',
    duration: 'Same day',
    images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400'],
    isActive: true,
    features: [
      'Same day preview',
      'Quick editing',
      'Digital delivery',
      'Social media ready'
    ],
    vendor: {
      _id: 'vendor_001',
      name: 'Dream Wedding Photography'
    }
  },
  {
    _id: 'addon_003',
    name: 'Wedding Album',
    description: 'Premium wedding album with high-quality printing and binding',
    price: 8000,
    category: 'product',
    duration: '2 weeks',
    images: ['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400'],
    isActive: true,
    features: [
      'Premium quality printing',
      'Leather binding',
      '50-100 photos',
      'Custom design'
    ],
    vendor: {
      _id: 'vendor_001',
      name: 'Dream Wedding Photography'
    }
  },
  {
    _id: 'addon_004',
    name: 'Video Highlights',
    description: 'Cinematic video highlights of your special day',
    price: 12000,
    category: 'videography',
    duration: '3-4 weeks',
    images: ['https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400'],
    isActive: true,
    features: [
      'Cinematic editing',
      'Music synchronization',
      'HD quality',
      '5-10 minute video'
    ],
    vendor: {
      _id: 'vendor_002',
      name: 'Party Moments Studio'
    }
  },
  {
    _id: 'addon_005',
    name: 'Photo Booth',
    description: 'Fun photo booth with props and instant printing',
    price: 15000,
    category: 'entertainment',
    duration: '4 hours',
    images: ['https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400'],
    isActive: true,
    features: [
      'Instant printing',
      'Fun props',
      'Digital copies',
      'Attendant included'
    ],
    vendor: {
      _id: 'vendor_002',
      name: 'Party Moments Studio'
    }
  },
  {
    _id: 'addon_006',
    name: 'Extended Coverage',
    description: 'Additional hours of photography coverage',
    price: 3000,
    category: 'service',
    duration: 'Per hour',
    images: ['https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400'],
    isActive: true,
    features: [
      'Additional hours',
      'Same photographer',
      'Extended editing',
      'More photos'
    ],
    vendor: {
      _id: 'vendor_001',
      name: 'Dream Wedding Photography'
    }
  },
  {
    _id: 'addon_007',
    name: 'Pre-wedding Shoot',
    description: 'Romantic pre-wedding photography session',
    price: 18000,
    category: 'photography',
    duration: '4 hours',
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=400'],
    isActive: true,
    features: [
      'Romantic locations',
      'Couple portraits',
      'Professional editing',
      'Online gallery'
    ],
    vendor: {
      _id: 'vendor_001',
      name: 'Dream Wedding Photography'
    }
  },
  {
    _id: 'addon_008',
    name: 'Cultural Props',
    description: 'Traditional props and accessories for cultural ceremonies',
    price: 2500,
    category: 'product',
    duration: 'Event day',
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=400'],
    isActive: true,
    features: [
      'Traditional props',
      'Cultural accessories',
      'Setup included',
      'Cleanup included'
    ],
    vendor: {
      _id: 'vendor_003',
      name: 'Cultural Moments Photography'
    }
  }
];

export const addOnCategories = [
  { value: 'photography', label: 'Photography', count: 15 },
  { value: 'videography', label: 'Videography', count: 8 },
  { value: 'service', label: 'Service', count: 12 },
  { value: 'product', label: 'Product', count: 6 },
  { value: 'entertainment', label: 'Entertainment', count: 4 }
];

export const addOnStats = {
  total: 45,
  active: 42,
  categories: 5,
  averagePrice: 6500,
  mostPopular: 'Drone Photography'
};





