import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Video, Users, Star, ArrowRight, CheckCircle, Search, Filter, MapPin, Calendar, Heart, Sparkles, Award, Shield, Crown, Zap, Target, Clock, Globe, Phone, Mail, Package } from 'lucide-react';
import { PackageCard, TestimonialCard } from '../components/cards';
import { ImageCarousel, TestimonialCarousel } from '../components/carousel';
import { Button, Card, Badge } from '../components/ui';
import { MobileCarousel, FloatingActionButton, TouchCard } from '../components/MobileEnhancements';
import { publicAPI } from '../services/api';
import { dummyPackages, dummyTestimonials } from '../data';

const Home = () => {
  const navigate = useNavigate();
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [beatBloomPackages, setBeatBloomPackages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Parallel API calls for better performance
        console.log('🏠 Home: Loading all data in parallel...');
        const [packagesResponse, beatBloomResponse, testimonialsResponse] = await Promise.all([
          publicAPI.getFeaturedPackages(),
          publicAPI.getBeatBlooms({ limit: 6 }),
          publicAPI.getTestimonials({ limit: 8 })
        ]);
        
        console.log('🏠 Home: All API responses received');
        
        // Parse featured packages response
        if (packagesResponse.data.success && packagesResponse.data.data) {
          const featured = packagesResponse.data.data.packages || [];
          console.log('🏠 Home: Parsed featured packages:', featured.length);
          setFeaturedPackages(Array.isArray(featured) ? featured.slice(0, 6) : []);
        } else {
          console.error('🏠 Home: Invalid packages response format');
          throw new Error('Invalid response format from backend');
        }

        // Parse Beat & Bloom response
        if (beatBloomResponse.data.success && beatBloomResponse.data.data) {
          const beatBloom = beatBloomResponse.data.data.items || [];
          console.log('🏠 Home: Parsed Beat & Bloom packages:', beatBloom.length);
          setBeatBloomPackages(Array.isArray(beatBloom) ? beatBloom : []);
        } else {
          throw new Error('Invalid Beat & Bloom response format from backend');
        }

        // Parse testimonials response
        if (testimonialsResponse.data.success && testimonialsResponse.data.data) {
          const testimonials = testimonialsResponse.data.data.testimonials || [];
          console.log('🏠 Home: Number of testimonials found:', testimonials.length);
          
          if (testimonials.length > 0) {
            // Transform database testimonials to match component format
            const transformedTestimonials = testimonials.map(testimonial => ({
              id: testimonial._id,
              name: testimonial.userId?.name || 'Anonymous',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face', // Default avatar
              rating: testimonial.rating,
              review: testimonial.feedback,
              event: 'Testimonial',
              date: new Date(testimonial.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              }),
              location: 'India'
            }));
            
            console.log('🏠 Home: Transformed testimonials:', transformedTestimonials.length);
            setTestimonials(transformedTestimonials);
          } else {
            console.log('🏠 Home: No approved testimonials found, using dummy data');
            setTestimonials(dummyTestimonials.slice(0, 8));
          }
        } else {
          console.log('🏠 Home: API response failed, using dummy data');
          setTestimonials(dummyTestimonials.slice(0, 8));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to dummy data
        setFeaturedPackages(dummyPackages.filter(pkg => pkg.isPremium).slice(0, 6));
        setBeatBloomPackages([
          {
            _id: 'dj-setup',
            title: 'DJ Setup & Sound',
            description: 'Professional DJ services with premium sound systems',
            price: 15000,
            category: 'ENTERTAINMENT',
            features: ['Professional DJ', 'Premium Sound System', 'Music Library', 'Lighting Effects'],
            images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'],
            rating: 4.8
          },
          {
            _id: 'decor-setup',
            title: 'Event Decoration',
            description: 'Beautiful decorations to make your event memorable',
            price: 25000,
            category: 'DECOR',
            features: ['Floral Arrangements', 'Lighting Design', 'Backdrop Setup', 'Table Decorations'],
            images: ['https://images.unsplash.com/photo-1519167758481-83f142bb8bce?w=400&h=300&fit=crop'],
            rating: 4.9
          },
          {
            _id: 'photography',
            title: 'Photography Services',
            description: 'Professional photography to capture every moment',
            price: 20000,
            category: 'PHOTOGRAPHY',
            features: ['Professional Photographer', 'High-Resolution Photos', 'Photo Editing', 'Online Gallery'],
            images: ['https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=300&fit=crop'],
            rating: 4.7
          }
        ]);
        // Set empty testimonials in error case - don't show dummy data
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const whyChooseUs = [
    {
      icon: <Users className="w-12 h-12 text-primary-500" />,
      title: 'Hire Event Managers',
      description: 'Professional event managers to handle every detail of your special day',
      color: 'from-primary-400 to-primary-500',
      bgColor: 'from-primary-50 to-primary-100'
    },
    {
      icon: <Target className="w-12 h-12 text-accent-500" />,
      title: 'Package-Based Bookings',
      description: 'Choose from curated packages designed for different event types and budgets',
      color: 'from-accent-400 to-accent-500',
      bgColor: 'from-accent-50 to-accent-100'
    },
    {
      icon: <Camera className="w-12 h-12 text-secondary-500" />,
      title: 'Professional Photography',
      description: 'High-quality photography services with experienced photographers',
      color: 'from-secondary-400 to-secondary-500',
      bgColor: 'from-secondary-50 to-secondary-100'
    },
    {
      icon: <Video className="w-12 h-12 text-pink-500" />,
      title: 'Cinematic Videography',
      description: 'Stunning video production to capture your memories in motion',
      color: 'from-pink-400 to-pink-500',
      bgColor: 'from-pink-50 to-pink-100'
    },
    {
      icon: <Award className="w-12 h-12 text-yellow-500" />,
      title: 'Premium Quality',
      description: 'Top-tier equipment and editing for exceptional results every time',
      color: 'from-yellow-400 to-yellow-500',
      bgColor: 'from-yellow-50 to-yellow-100'
    },
    {
      icon: <Shield className="w-12 h-12 text-green-500" />,
      title: '100% Satisfaction',
      description: 'Guaranteed satisfaction with our professional service and support',
      color: 'from-green-400 to-green-500',
      bgColor: 'from-green-50 to-green-100'
    }
  ];


  const stats = [
    { label: 'Happy Clients', value: '500+', icon: <Heart className="w-6 h-6 text-primary-500" /> },
    { label: 'Events Captured', value: '1000+', icon: <Camera className="w-6 h-6 text-accent-500" /> },
    { label: 'Years Experience', value: '5+', icon: <Award className="w-6 h-6 text-secondary-500" /> },
    { label: 'Satisfaction Rate', value: '99%', icon: <Star className="w-6 h-6 text-yellow-500" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      {/* Premium Hero Section - One Page View */}
      <section className="relative overflow-hidden h-screen flex items-center bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
        {/* Enhanced Floating Flower Pattern Background */}
        <div className="absolute inset-0">
          {/* Main Floating Flowers */}
          <div className="absolute top-20 left-20 w-16 h-16 bg-pink-300 rounded-full opacity-60 animate-float shadow-lg"></div>
          <div className="absolute top-32 right-32 w-12 h-12 bg-red-300 rounded-full opacity-50 animate-float-delayed shadow-lg"></div>
          <div className="absolute bottom-32 left-32 w-20 h-20 bg-pink-400 rounded-full opacity-40 animate-float-slow shadow-lg"></div>
          <div className="absolute bottom-20 right-20 w-14 h-14 bg-red-400 rounded-full opacity-60 animate-float shadow-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-10 h-10 bg-pink-200 rounded-full opacity-50 animate-float-delayed shadow-lg"></div>
          <div className="absolute top-1/3 right-1/4 w-18 h-18 bg-red-200 rounded-full opacity-40 animate-float-slow shadow-lg"></div>
          <div className="absolute top-1/4 left-1/2 w-8 h-8 bg-pink-300 rounded-full opacity-60 animate-float shadow-lg"></div>
          <div className="absolute bottom-1/3 right-1/3 w-16 h-16 bg-red-300 rounded-full opacity-50 animate-float-delayed shadow-lg"></div>
          
          {/* Additional Sparkle Elements */}
          <div className="absolute top-16 left-1/3 w-6 h-6 bg-pink-400 rounded-full opacity-70 animate-pulse"></div>
          <div className="absolute top-40 right-16 w-4 h-4 bg-red-400 rounded-full opacity-80 animate-pulse"></div>
          <div className="absolute bottom-16 left-16 w-8 h-8 bg-pink-300 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute bottom-40 right-1/3 w-5 h-5 bg-red-300 rounded-full opacity-70 animate-pulse"></div>
          <div className="absolute top-1/2 right-16 w-7 h-7 bg-pink-200 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute top-2/3 left-1/2 w-6 h-6 bg-red-200 rounded-full opacity-60 animate-pulse"></div>
          
          {/* Gradient Overlay for Depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/20 via-transparent to-red-50/20"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center space-y-8">
            {/* Enhanced Main Tagline */}
            <div className="space-y-8">
              {/* Sparkle Badge */}
              <div className="inline-flex items-center bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl animate-pulse-elegant">
                <Star className="w-6 h-6 mr-3 animate-spin" />
                #1 Premium Event Platform
                <Star className="w-6 h-6 ml-3 animate-spin" />
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-pink-800 drop-shadow-2xl">Big Moments,</span>
                <span className="block bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                  Just a Snap Away
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-pink-700 max-w-4xl mx-auto leading-relaxed font-medium">
                Professional event management, photography, and entertainment services. 
                Let us transform your vision into reality with our premium packages.
              </p>
            </div>
            
            {/* Enhanced Premium CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8">
              <Button
                onClick={() => navigate('/packages')}
                className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-12 py-5 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-500 animate-glow"
              >
                <Package className="w-6 h-6 mr-3 animate-bounce" />
                Explore Packages
                <ArrowRight className="w-6 h-6 ml-3 animate-bounce" />
              </Button>
              <Button
                onClick={() => navigate('/contact')}
                className="bg-white text-pink-600 hover:bg-pink-50 border-2 border-pink-500 px-12 py-5 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-500 hover:animate-pulse"
              >
                <Users className="w-6 h-6 mr-3" />
                Hire Event Managers
              </Button>
            </div>
            
            {/* Enhanced Premium Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-5xl mx-auto">
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-pink-200 animate-float">
                <div className="text-4xl font-bold text-pink-600 mb-2 animate-pulse-elegant">500+</div>
                <div className="text-base text-pink-700 font-semibold">Happy Clients</div>
                <div className="w-full h-1 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full mt-2"></div>
              </div>
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-red-200 animate-float-delayed">
                <div className="text-4xl font-bold text-red-600 mb-2 animate-pulse-elegant">1000+</div>
                <div className="text-base text-red-700 font-semibold">Events Captured</div>
                <div className="w-full h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full mt-2"></div>
              </div>
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-pink-200 animate-float-slow">
                <div className="text-4xl font-bold text-pink-600 mb-2 animate-pulse-elegant">5+</div>
                <div className="text-base text-pink-700 font-semibold">Years Experience</div>
                <div className="w-full h-1 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full mt-2"></div>
              </div>
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-red-200 animate-float">
                <div className="text-4xl font-bold text-red-600 mb-2 animate-pulse-elegant">99%</div>
                <div className="text-base text-red-700 font-semibold">Satisfaction Rate</div>
                <div className="w-full h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full mt-2"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose SnapFest - About Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-white via-pink-50/30 to-red-50/30">
        {/* Enhanced Floating Flower Pattern Background */}
        <div className="absolute inset-0">
          {/* Floating Flowers */}
          <div className="absolute top-10 left-10 w-12 h-12 bg-pink-300 rounded-full opacity-40 animate-float shadow-lg"></div>
          <div className="absolute top-20 right-20 w-8 h-8 bg-red-300 rounded-full opacity-50 animate-float-delayed shadow-lg"></div>
          <div className="absolute bottom-20 left-20 w-16 h-16 bg-pink-400 rounded-full opacity-30 animate-float-slow shadow-lg"></div>
          <div className="absolute bottom-10 right-10 w-10 h-10 bg-red-400 rounded-full opacity-40 animate-float shadow-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-pink-200 rounded-full opacity-50 animate-float-delayed shadow-lg"></div>
          <div className="absolute top-1/3 right-1/4 w-14 h-14 bg-red-200 rounded-full opacity-30 animate-float-slow shadow-lg"></div>
          
          {/* Sparkle Elements */}
          <div className="absolute top-16 left-1/3 w-4 h-4 bg-pink-400 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute top-32 right-16 w-3 h-3 bg-red-400 rounded-full opacity-70 animate-pulse"></div>
          <div className="absolute bottom-16 left-16 w-5 h-5 bg-pink-300 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute bottom-32 right-1/3 w-4 h-4 bg-red-300 rounded-full opacity-60 animate-pulse"></div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/10 via-transparent to-red-50/10"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {/* Sparkle Badge */}
            <div className="inline-flex items-center bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl animate-pulse-elegant mb-8">
              <Award className="w-6 h-6 mr-3 animate-spin" />
              Why Choose SnapFest?
              <Star className="w-6 h-6 ml-3 animate-spin" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-pink-800 mb-6 drop-shadow-lg">
              About SnapFest
            </h2>
            <p className="text-xl text-pink-700 max-w-4xl mx-auto leading-relaxed">
              We are a premium event management company with over 5 years of experience in creating 
              unforgettable celebrations. Our team of professional event managers, photographers, 
              and entertainment specialists work together to bring your vision to life.
            </p>
          </div>

          {/* Enhanced Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Package Features */}
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-pink-100 animate-float">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-red-400 rounded-3xl flex items-center justify-center mb-6 shadow-xl animate-pulse-elegant">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-pink-800 mb-4">Premium Packages</h3>
              <ul className="space-y-3 text-pink-700">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">All-inclusive event packages</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">Customizable options</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">Transparent pricing</span>
                </li>
              </ul>
              <div className="w-full h-1 bg-gradient-to-r from-pink-400 to-red-400 rounded-full mt-4"></div>
            </div>

            {/* Hire Event Managers */}
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-red-100 animate-float-delayed">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-400 rounded-3xl flex items-center justify-center mb-6 shadow-xl animate-pulse-elegant">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-pink-800 mb-4">Hire Event Managers</h3>
              <ul className="space-y-3 text-pink-700">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">Professional event planners</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">24/7 support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">Vendor coordination</span>
                </li>
              </ul>
              <div className="w-full h-1 bg-gradient-to-r from-red-400 to-pink-400 rounded-full mt-4"></div>
            </div>

            {/* Photography Services */}
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-pink-100 animate-float-slow">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl animate-pulse-elegant">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-pink-800 mb-4">Photography & Video</h3>
              <ul className="space-y-3 text-pink-700">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">Professional photographers</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">High-quality equipment</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">Quick delivery</span>
                </li>
              </ul>
              <div className="w-full h-1 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mt-4"></div>
            </div>

            {/* Entertainment Services */}
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-red-100 animate-float">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl animate-pulse-elegant">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-pink-800 mb-4">Entertainment</h3>
              <ul className="space-y-3 text-pink-700">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">DJ & Music setup</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">Live performances</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-base">Sound & lighting</span>
                </li>
              </ul>
              <div className="w-full h-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mt-4"></div>
            </div>
          </div>
        </div>
      </section>


      {/* Curated Packages Section */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-br from-white via-pink-50/50 to-red-50/50">
        {/* Enhanced Floating Flower Pattern Background */}
        <div className="absolute inset-0">
          {/* Floating Flowers */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-pink-300 rounded-full opacity-40 animate-float shadow-lg"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-red-300 rounded-full opacity-50 animate-float-delayed shadow-lg"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-400 rounded-full opacity-30 animate-float-slow shadow-lg"></div>
          <div className="absolute bottom-10 right-10 w-18 h-18 bg-red-400 rounded-full opacity-40 animate-float shadow-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-pink-200 rounded-full opacity-50 animate-float-delayed shadow-lg"></div>
          <div className="absolute top-1/3 right-1/4 w-22 h-22 bg-red-200 rounded-full opacity-30 animate-float-slow shadow-lg"></div>
          
          {/* Sparkle Elements */}
          <div className="absolute top-16 left-1/3 w-8 h-8 bg-pink-400 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute top-32 right-16 w-6 h-6 bg-red-400 rounded-full opacity-70 animate-pulse"></div>
          <div className="absolute bottom-16 left-16 w-10 h-10 bg-pink-300 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute bottom-32 right-1/3 w-7 h-7 bg-red-300 rounded-full opacity-60 animate-pulse"></div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/10 via-transparent to-red-50/10"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            {/* Sparkle Badge */}
            <div className="inline-flex items-center bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl animate-pulse-elegant mb-6">
              <Crown className="w-6 h-6 mr-3 animate-spin" />
              Curated Packages
              <Star className="w-6 h-6 ml-3 animate-spin" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-pink-800 mb-4 drop-shadow-lg">
              <span className="bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                Ready-to-Go Event Solutions
              </span>
            </h2>
            <p className="text-xl text-pink-700 max-w-4xl mx-auto leading-relaxed">
              Handpicked packages designed by experts to make your celebration perfect.
            </p>
          </div>

          {/* Enhanced Package Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-pink-100 animate-pulse">
                  <div className="h-56 bg-gray-200 rounded-t-3xl"></div>
                  <div className="p-8 space-y-4">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredPackages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No curated packages available</h3>
              <p className="text-gray-600 mb-4">Check back later for new packages</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {featuredPackages.slice(0, 3).map((pkg, index) => (
                <PackageCard 
                  key={pkg._id || index} 
                  packageData={pkg}
                  onViewDetails={() => navigate(`/packages/${pkg._id}`)}
                  showAddToCart={false}
                  showBookNow={false}
                  showViewDetails={true}
                />
              ))}
            </div>
          )}

          {/* View All Packages Button */}
          <div className="text-center">
            <Button
              onClick={() => navigate('/packages')}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-12 py-5 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 animate-glow"
            >
              <Package className="w-6 h-6 mr-3 animate-bounce" />
              View All Packages
              <ArrowRight className="w-6 h-6 ml-3 animate-bounce" />
            </Button>
          </div>
        </div>
      </section>


      {/* Beat & Bloom - Service Packages */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-br from-pink-50 to-red-50">
        {/* Enhanced Floating Flower Pattern Background */}
        <div className="absolute inset-0">
          {/* Floating Flowers */}
          <div className="absolute top-10 left-10 w-16 h-16 bg-pink-300 rounded-full opacity-50 animate-float shadow-lg"></div>
          <div className="absolute top-20 right-20 w-12 h-12 bg-red-300 rounded-full opacity-60 animate-float-delayed shadow-lg"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 bg-pink-400 rounded-full opacity-40 animate-float-slow shadow-lg"></div>
          <div className="absolute bottom-10 right-10 w-14 h-14 bg-red-400 rounded-full opacity-50 animate-float shadow-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-10 h-10 bg-pink-200 rounded-full opacity-60 animate-float-delayed shadow-lg"></div>
          <div className="absolute top-1/3 right-1/4 w-18 h-18 bg-red-200 rounded-full opacity-40 animate-float-slow shadow-lg"></div>
          
          {/* Sparkle Elements */}
          <div className="absolute top-16 left-1/3 w-6 h-6 bg-pink-400 rounded-full opacity-70 animate-pulse"></div>
          <div className="absolute top-32 right-16 w-4 h-4 bg-red-400 rounded-full opacity-80 animate-pulse"></div>
          <div className="absolute bottom-16 left-16 w-8 h-8 bg-pink-300 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute bottom-32 right-1/3 w-5 h-5 bg-red-300 rounded-full opacity-70 animate-pulse"></div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/20 via-transparent to-red-50/20"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            {/* Sparkle Badge */}
            <div className="inline-flex items-center bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl animate-pulse-elegant mb-6">
              <Heart className="w-6 h-6 mr-3 animate-spin" />
              Beat & Bloom
              <Star className="w-6 h-6 ml-3 animate-spin" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-pink-800 mb-4 drop-shadow-lg">
              Individual Service Packages
            </h2>
            <p className="text-xl text-pink-700 max-w-4xl mx-auto leading-relaxed">
              Choose from our specialized service packages. Each service is designed to meet specific needs 
              and can be combined for a complete event experience.
            </p>
          </div>

          {/* Show Only 3 Packages */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-pink-100 animate-pulse">
                  <div className="h-56 bg-gray-200 rounded-2xl mb-8"></div>
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : beatBloomPackages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Beat & Bloom services available</h3>
              <p className="text-gray-600 mb-4">Check back later for new services</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {beatBloomPackages.slice(0, 3).map((pkg, index) => (
                <div key={pkg._id || index} className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 group cursor-pointer border border-pink-100 hover:border-pink-200 animate-float" onClick={() => navigate(`/beatbloom/${pkg._id}`)}>
                  <div className="relative mb-8">
                    <img 
                      src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'} 
                      alt={pkg.title}
                      className="w-full h-56 object-cover rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4">
                      <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl">
                        ₹{pkg.price?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/90 text-pink-600 px-3 py-1 rounded-full text-xs font-semibold">
                        {pkg.category}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-pink-800 group-hover:text-pink-600 transition-colors duration-300">
                      {pkg.title}
                    </h3>
                    <p className="text-pink-700 leading-relaxed text-lg">
                      {pkg.description}
                    </p>
                    
                    <div className="space-y-3">
                      <h4 className="font-bold text-pink-800 text-base">What's Included:</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {pkg.features?.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-base text-pink-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 mt-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/beatbloom/${pkg._id}`);
                      }}
                    >
                      View Details
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Know More Button */}
          <div className="text-center">
            <Button
              onClick={() => navigate('/beatbloom')}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Explore All Services
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        {/* Enhanced Floating Flower Pattern Background */}
        <div className="absolute inset-0">
          {/* Floating Flowers */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-pink-300 rounded-full opacity-40 animate-float shadow-lg"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-red-300 rounded-full opacity-50 animate-float-delayed shadow-lg"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-400 rounded-full opacity-30 animate-float-slow shadow-lg"></div>
          <div className="absolute bottom-10 right-10 w-18 h-18 bg-red-400 rounded-full opacity-40 animate-float shadow-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-pink-200 rounded-full opacity-50 animate-float-delayed shadow-lg"></div>
          <div className="absolute top-1/3 right-1/4 w-22 h-22 bg-red-200 rounded-full opacity-30 animate-float-slow shadow-lg"></div>
          
          {/* Sparkle Elements */}
          <div className="absolute top-16 left-1/3 w-8 h-8 bg-pink-400 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute top-32 right-16 w-6 h-6 bg-red-400 rounded-full opacity-70 animate-pulse"></div>
          <div className="absolute bottom-16 left-16 w-10 h-10 bg-pink-300 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute bottom-32 right-1/3 w-7 h-7 bg-red-300 rounded-full opacity-60 animate-pulse"></div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/10 via-transparent to-red-50/10"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-pink-800 mb-4 drop-shadow-lg">
              <span className="bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                What Our Clients Say
              </span>
            </h2>
            <p className="text-xl text-pink-700 max-w-4xl mx-auto leading-relaxed">
              Real experiences from real people who trusted us with their special moments.
            </p>
          </div>

          <TestimonialCarousel testimonials={testimonials} />
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-pink-500 via-red-500 to-pink-600">
        {/* Enhanced Floating Flower Pattern Background */}
        <div className="absolute inset-0">
          {/* Floating Flowers */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full opacity-60 animate-float shadow-lg"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-white/30 rounded-full opacity-70 animate-float-delayed shadow-lg"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/15 rounded-full opacity-50 animate-float-slow shadow-lg"></div>
          <div className="absolute bottom-10 right-10 w-18 h-18 bg-white/25 rounded-full opacity-60 animate-float shadow-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/20 rounded-full opacity-70 animate-float-delayed shadow-lg"></div>
          <div className="absolute top-1/3 right-1/4 w-22 h-22 bg-white/10 rounded-full opacity-50 animate-float-slow shadow-lg"></div>
          
          {/* Sparkle Elements */}
          <div className="absolute top-16 left-1/3 w-8 h-8 bg-white/40 rounded-full opacity-80 animate-pulse"></div>
          <div className="absolute top-32 right-16 w-6 h-6 bg-white/50 rounded-full opacity-90 animate-pulse"></div>
          <div className="absolute bottom-16 left-16 w-10 h-10 bg-white/30 rounded-full opacity-70 animate-pulse"></div>
          <div className="absolute bottom-32 right-1/3 w-7 h-7 bg-white/40 rounded-full opacity-80 animate-pulse"></div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-transparent to-red-600/20"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
              Ready to Create Magic?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Let's create an unforgettable experience that will be remembered for a lifetime.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
              <Button
                onClick={() => navigate('/packages')}
                className="bg-white text-pink-600 hover:bg-pink-50 px-8 py-4 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              >
                <Package className="w-6 h-6 mr-3" />
                Browse Packages
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
              
              <Button
                onClick={() => navigate('/contact')}
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-pink-600 px-8 py-4 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              >
                <Phone className="w-6 h-6 mr-3" />
                Contact Us
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-12 pt-8">
              <div className="flex items-center space-x-3 text-white/90">
                <Shield className="w-6 h-6" />
                <span className="font-semibold text-lg">Secure Booking</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <Award className="w-6 h-6" />
                <span className="font-semibold text-lg">Premium Quality</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <Star className="w-6 h-6" />
                <span className="font-semibold text-lg">5-Star Rated</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <Clock className="w-6 h-6" />
                <span className="font-semibold text-lg">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
