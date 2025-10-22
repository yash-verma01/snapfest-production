import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Music, 
  Flower2, 
  Utensils, 
  Camera, 
  Sparkles, 
  Plus, 
  Eye,
  Star,
  Heart,
  Share2
} from 'lucide-react';
import { Card, Button, Badge } from './ui';
import { publicAPI } from '../services/api';
import { dummyBeatBlooms } from '../data';

const BeatBloomSection = () => {
  const [beatBlooms, setBeatBlooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const loadBeatBlooms = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getBeatBlooms({
          page: 1,
          limit: 12,
          category: selectedCategory === 'all' ? '' : selectedCategory
        });
        setBeatBlooms(response.data.data.beatBlooms || response.data.data.results || []);
      } catch (err) {
        console.error('Error loading Beat & Bloom services:', err);
        // Fallback to dummy data
        setBeatBlooms(dummyBeatBlooms);
      } finally {
        setLoading(false);
      }
    };

    loadBeatBlooms();
  }, [selectedCategory]);

  const categories = [
    { id: 'all', name: 'All Services', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'entertainment', name: 'Entertainment', icon: <Music className="w-5 h-5" /> },
    { id: 'decor', name: 'Décor', icon: <Flower2 className="w-5 h-5" /> },
    { id: 'catering', name: 'Catering', icon: <Utensils className="w-5 h-5" /> },
    { id: 'photography', name: 'Photography', icon: <Camera className="w-5 h-5" /> }
  ];

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'entertainment': return <Music className="w-6 h-6 text-pink-500" />;
      case 'decor': return <Flower2 className="w-6 h-6 text-pink-500" />;
      case 'catering': return <Utensils className="w-6 h-6 text-pink-500" />;
      case 'photography': return <Camera className="w-6 h-6 text-pink-500" />;
      default: return <Sparkles className="w-6 h-6 text-pink-500" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'entertainment': return 'from-pink-400 to-pink-600';
      case 'decor': return 'from-rose-400 to-rose-600';
      case 'catering': return 'from-red-400 to-red-600';
      case 'photography': return 'from-purple-400 to-purple-600';
      default: return 'from-pink-400 to-pink-600';
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-pink-50 via-white to-red-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Beat & Bloom</h2>
            <p className="text-lg text-gray-600">Individual services to make your event perfect</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-64"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-pink-50 via-white to-red-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Beat & Bloom
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Individual services to make your event perfect. Choose from our curated selection of entertainment, décor, catering, and photography services.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-600 shadow-md'
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {beatBlooms.map((service) => (
            <Card key={service._id || service.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              {/* Service Image */}
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={service.images?.[0] || service.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop'}
                  alt={service.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <Badge className={`bg-gradient-to-r ${getCategoryColor(service.category)} text-white`}>
                    {getCategoryIcon(service.category)}
                    <span className="ml-1 capitalize">{service.category}</span>
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                    <Heart className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Service Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                    {service.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-600">
                      {service.rating || '4.8'}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {service.description}
                </p>

                {/* Features */}
                {service.features && service.features.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-pink-600">
                      ₹{service.price?.toLocaleString() || '2,500'}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">starting</span>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-pink-500 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2 hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Package
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button
            as={Link}
            to="/beatbloom"
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            View All Services
            <Sparkles className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BeatBloomSection;


