import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Camera, Video, Users, Star, ArrowRight, CheckCircle, Search, 
  MapPin, Calendar, Heart, Sparkles, Award, Shield, Crown, Zap, 
  Target, Clock, Globe, Phone, Mail, Package, Play, TrendingUp,
  Sparkle, Gift, Bell, ArrowDown, ChevronRight, ThumbsUp
} from 'lucide-react';
import { PackageCard, TestimonialCard } from '../components/cards';
import { Button, Card, Badge } from '../components/ui';
import { GlassCard, ScrollReveal, LoadingSkeleton } from '../components/enhanced';
import { publicAPI } from '../services/api';
import { dummyPackages, dummyTestimonials } from '../data';
import { motion } from 'framer-motion';

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
        const [packagesResponse, beatBloomResponse, testimonialsResponse] = await Promise.all([
          publicAPI.getFeaturedPackages(),
          publicAPI.getBeatBlooms({ limit: 6 }),
          publicAPI.getTestimonials({ limit: 8 })
        ]);
        
        if (packagesResponse.data.success && packagesResponse.data.data) {
          const featured = packagesResponse.data.data.packages || [];
          setFeaturedPackages(Array.isArray(featured) ? featured.slice(0, 6) : []);
        }

        if (beatBloomResponse.data.success && beatBloomResponse.data.data) {
          const beatBloom = beatBloomResponse.data.data.items || [];
          setBeatBloomPackages(Array.isArray(beatBloom) ? beatBloom : []);
        }

        if (testimonialsResponse.data.success && testimonialsResponse.data.data) {
          const testimonials = testimonialsResponse.data.data.testimonials || [];
          if (testimonials.length > 0) {
            const transformedTestimonials = testimonials.map(testimonial => ({
              id: testimonial._id,
              name: testimonial.userId?.name || testimonial.userId?.email?.split('@')[0] || 'Customer',
              avatar: null, // Remove avatar
              rating: testimonial.rating,
              review: testimonial.feedback,
              event: 'Testimonial',
              date: new Date(testimonial.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
              location: 'India'
            }));
            setTestimonials(transformedTestimonials);
          } else {
            setTestimonials(dummyTestimonials.slice(0, 8));
          }
        } else {
          setTestimonials(dummyTestimonials.slice(0, 8));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setFeaturedPackages(dummyPackages.filter(pkg => pkg.isPremium).slice(0, 6));
        setBeatBloomPackages([]);
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);


  const features = [
    {
      icon: Shield,
      title: 'Secure Booking',
      description: '100% secure payment gateway with encrypted transactions',
      gradient: 'from-pink-500 to-red-500'
    },
    {
      icon: Crown,
      title: 'Premium Quality',
      description: 'Top-tier equipment and professional service guaranteed',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      icon: Star,
      title: '5-Star Rated',
      description: 'Rated 4.9/5 by thousands of satisfied customers',
      gradient: 'from-pink-500 to-red-500'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your needs',
      gradient: 'from-red-500 to-pink-500'
    }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Browse & Select',
      description: 'Explore our curated packages and services tailored to your event',
      icon: Search,
      color: 'pink'
    },
    {
      step: '02',
      title: 'Customize',
      description: 'Personalize your package with add-ons and special requests',
      icon: Sparkle,
      color: 'red'
    },
    {
      step: '03',
      title: 'Book & Pay',
      description: 'Secure booking with flexible payment options',
      icon: CheckCircle,
      color: 'pink'
    },
    {
      step: '04',
      title: 'Enjoy Your Event',
      description: 'Sit back and let us create magic for your special day',
      icon: Heart,
      color: 'red'
    }
  ];

  // Floating Elements Component
  const FloatingElements = ({ count = 8, section = 'hero', backgroundType = 'pink' }) => {
    const flowers = Math.floor(count * 0.4);
    const stars = Math.floor(count * 0.6);
    
    // Determine colors based on background type
    const getFlowerColor = (i) => {
      if (backgroundType === 'pink') {
        // White colors for pink backgrounds
        const colors = ['text-white', 'text-gray-100', 'text-gray-50'];
        return colors[i % colors.length];
      } else {
        // Pinkish colors for white backgrounds
        const colors = ['text-pink-200', 'text-pink-300', 'text-pink-100'];
        return colors[i % colors.length];
      }
    };

    const getStarColor = (i) => {
      if (backgroundType === 'pink') {
        // White colors for pink backgrounds
        const colors = ['text-white', 'text-gray-100', 'text-gray-50'];
        return colors[i % colors.length];
      } else {
        // Pinkish colors for white backgrounds
        const colors = ['text-pink-200', 'text-pink-300', 'text-pink-100'];
        return colors[i % colors.length];
      }
    };
    
    // Fixed positions based on index for consistency
    const getFlowerPosition = (i) => {
      const positions = [
        { top: '8%', left: '12%' },
        { top: '15%', right: '18%' },
        { top: '25%', left: '8%' },
        { top: '35%', right: '15%' },
        { top: '45%', left: '20%' },
        { top: '55%', right: '10%' },
        { bottom: '15%', left: '18%' },
        { bottom: '25%', right: '20%' },
        { bottom: '35%', left: '12%' },
        { bottom: '45%', right: '15%' },
      ];
      return positions[i % positions.length];
    };

    const getStarPosition = (i) => {
      const positions = [
        { top: '5%', left: '8%' },
        { top: '12%', right: '12%' },
        { top: '20%', left: '5%' },
        { top: '30%', right: '8%' },
        { top: '40%', left: '12%' },
        { top: '50%', right: '5%' },
        { top: '60%', left: '8%' },
        { top: '70%', right: '12%' },
        { bottom: '8%', right: '8%' },
        { bottom: '15%', left: '12%' },
        { bottom: '25%', right: '5%' },
        { bottom: '35%', left: '8%' },
      ];
      return positions[i % positions.length];
    };
    
    return (
      <>
        {/* Floating Flowers - Light colors with blinking and floating */}
        {[...Array(flowers)].map((_, i) => {
          const pos = getFlowerPosition(i);
          const size = 12 + (i % 4) * 4; // 12, 16, 20, 24
          const delay = (i % 5) * 0.5;
          const floatDuration = 6 + (i % 4) * 1; // 6, 7, 8, 9
          const blinkDuration = 2 + (i % 3) * 0.5; // 2, 2.5, 3
          const xOffset = (i % 3) * 5 - 5; // -5, 0, 5
          
          return (
            <motion.div
              key={`flower-${section}-${i}`}
              className="absolute pointer-events-none z-[1]"
              style={{
                ...pos,
                width: `${size}px`,
                height: `${size}px`,
              }}
              animate={{
                // Floating animation
                y: [0, -30, 0],
                x: [0, xOffset, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1],
                // Blinking animation (separate timing)
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                y: {
                  duration: floatDuration,
                  delay,
                  repeat: Infinity,
                  ease: 'easeInOut'
                },
                x: {
                  duration: floatDuration,
                  delay,
                  repeat: Infinity,
                  ease: 'easeInOut'
                },
                rotate: {
                  duration: floatDuration * 2,
                  delay,
                  repeat: Infinity,
                  ease: 'linear'
                },
                scale: {
                  duration: floatDuration,
                  delay,
                  repeat: Infinity,
                  ease: 'easeInOut'
                },
                opacity: {
                  duration: blinkDuration,
                  delay: delay * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              }}
            >
              <Heart className={`w-full h-full ${getFlowerColor(i)}`} />
            </motion.div>
          );
        })}

        {/* Floating Stars - Light colors with blinking and floating */}
        {[...Array(stars)].map((_, i) => {
          const pos = getStarPosition(i);
          const size = 8 + (i % 3) * 2; // 8, 10, 12
          const delay = (i % 4) * 0.3;
          const floatDuration = 4 + (i % 3) * 1; // 4, 5, 6
          const blinkDuration = 1.5 + (i % 3) * 0.4; // 1.5, 1.9, 2.3
          const xOffset = (i % 3) * 3 - 3; // -3, 0, 3
          
          return (
            <motion.div
              key={`star-${section}-${i}`}
              className="absolute pointer-events-none z-[1]"
              style={{
                ...pos,
                width: `${size}px`,
                height: `${size}px`,
              }}
              animate={{
                // Floating animation
                y: [0, -20, 0],
                x: [0, xOffset, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.3, 1],
                // Blinking animation (separate timing)
                opacity: [0.25, 0.6, 0.25],
              }}
              transition={{
                y: {
                  duration: floatDuration,
                  delay,
                  repeat: Infinity,
                  ease: 'easeInOut'
                },
                x: {
                  duration: floatDuration,
                  delay,
                  repeat: Infinity,
                  ease: 'easeInOut'
                },
                rotate: {
                  duration: floatDuration * 1.5,
                  delay,
                  repeat: Infinity,
                  ease: 'linear'
                },
                scale: {
                  duration: floatDuration,
                  delay,
                  repeat: Infinity,
                  ease: 'easeInOut'
                },
                opacity: {
                  duration: blinkDuration,
                  delay: delay * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              }}
            >
              <Star className={`w-full h-full ${getStarColor(i)} fill-current`} />
            </motion.div>
          );
        })}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Enhanced Hero Section - More Pinkish Background */}
      <section className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-pink-300 via-pink-200 to-pink-300">
        {/* More Pinkish Background Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/50 via-pink-300/50 to-pink-400/50"></div>
        
        {/* Subtle Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-20 w-64 h-64 bg-pink-500 rounded-full opacity-25 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-80 h-80 bg-red-500 rounded-full opacity-25 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -30, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-pink-400 rounded-full opacity-20 blur-3xl"
            animate={{
              scale: [1, 1.25, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Floating Stars and Flowers - White on pink background */}
        <FloatingElements count={20} section="hero" backgroundType="pink" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="text-center space-y-12">
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl"
            >
              <Sparkle className="w-6 h-6 animate-spin" />
              <span>#1 Premium Event Platform</span>
              <Star className="w-6 h-6 animate-pulse" />
            </motion.div>

            {/* Main Headline - More Sharp and Less Bold */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight">
                <span className="block text-white drop-shadow-2xl font-semibold">Big Moments,</span>
                <span className="block text-white drop-shadow-2xl font-semibold">
                  Just a Snap Away
                </span>
              </h1>
              
              <p className="text-2xl md:text-3xl text-white/95 max-w-4xl mx-auto leading-relaxed font-semibold drop-shadow-lg">
                Professional event management, photography, and entertainment services. 
                <span className="block mt-2 text-xl text-white/90 font-medium">
                  Let us transform your vision into reality with our premium packages.
                </span>
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/packages')}
                className="group relative bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Package className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  Explore Packages
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/contact')}
                className="bg-white text-pink-600 hover:text-pink-700 border-3 border-pink-500 px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300"
              >
                <span className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  Hire Event Managers
                </span>
              </motion.button>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20"
            >
              <motion.button
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                className="flex flex-col items-center gap-2 text-white cursor-pointer hover:text-pink-100 transition-colors"
              >
                <span className="text-sm font-semibold drop-shadow-lg">Scroll to explore</span>
                <ArrowDown className="w-6 h-6 drop-shadow-lg" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Elegant Pink/Red */}
      <section className="relative py-24 bg-gradient-to-br from-pink-200 via-pink-200 to-red-200 overflow-hidden">
        {/* Elegant blend background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-300/60 via-pink-200/60 to-red-300/60"></div>
        
        {/* Floating Elements - Vibrant Pink/Red Blur */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-10 right-10 w-48 h-48 bg-red-300 rounded-full opacity-30 blur-2xl"
            animate={{
              scale: [1, 1.15, 1],
              x: [0, 25, 0],
              y: [0, -25, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-56 h-56 bg-pink-300 rounded-full opacity-30 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -25, 0],
              y: [0, 25, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/3 right-1/3 w-40 h-40 bg-red-300 rounded-full opacity-25 blur-xl"
            animate={{
              scale: [1, 1.25, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-44 h-44 bg-pink-300 rounded-full opacity-25 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Floating Stars and Flowers - White on pink background */}
        <FloatingElements count={18} section="howItWorks" backgroundType="pink" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2 text-lg font-bold mb-6">
                Simple Process
              </Badge>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
                How It Works
              </h2>
              <p className="text-xl text-white/95 max-w-3xl mx-auto drop-shadow-md">
                Four simple steps to create your perfect event
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative"
                >
                  <GlassCard className="p-8 text-center border-2 border-pink-100 hover:border-pink-300 transition-all duration-300">
                    <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 ${step.color === 'pink' ? 'bg-gradient-to-r from-pink-500 to-red-500' : 'bg-gradient-to-r from-red-500 to-pink-500'} rounded-full flex items-center justify-center text-white font-black text-lg shadow-xl`}>
                      {step.step}
                    </div>
                    <div className={`w-20 h-20 ${step.color === 'pink' ? 'bg-gradient-to-br from-pink-400 to-red-400' : 'bg-gradient-to-br from-red-400 to-pink-400'} rounded-3xl flex items-center justify-center mx-auto mb-6 mt-4 shadow-xl`}>
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-pink-800 mb-4">{step.title}</h3>
                    <p className="text-pink-700 leading-relaxed">{step.description}</p>
                  </GlassCard>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Vibrant Pink/Red */}
      <section className="relative py-24 bg-gradient-to-br from-pink-300 via-red-300 to-pink-400 overflow-hidden">
        {/* Vibrant blend background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/70 via-red-400/70 to-pink-500/70"></div>
        
        {/* Animated Blur Elements - Darker */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-20 w-52 h-52 bg-pink-500 rounded-full opacity-25 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.25, 0.35, 0.25],
              x: [0, 30, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-60 h-60 bg-red-500 rounded-full opacity-25 blur-2xl"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.25, 0.35, 0.25],
              x: [0, -30, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 right-1/4 w-44 h-44 bg-pink-500 rounded-full opacity-20 blur-2xl"
            animate={{
              scale: [1, 1.15, 1],
              x: [0, 20, 0],
              y: [0, 20, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-red-500 rounded-full opacity-20 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -20, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Floating Stars and Flowers - White on pink background */}
        <FloatingElements count={20} section="whyChooseUs" backgroundType="pink" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2 text-lg font-bold mb-6">
                Why Choose SnapFest?
              </Badge>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
                About SnapFest
              </h2>
              <p className="text-xl text-white/95 max-w-4xl mx-auto leading-relaxed drop-shadow-md">
                We are a premium event management company with over 5 years of experience in creating 
                unforgettable celebrations. Our team of professional event managers, photographers, 
                and entertainment specialists work together to bring your vision to life.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Package, title: 'Premium Packages', color: 'pink' },
              { icon: Users, title: 'Hire Event Managers', color: 'red' },
              { icon: Camera, title: 'Photography & Video', color: 'pink' },
              { icon: Heart, title: 'Entertainment', color: 'red' }
            ].map((feature, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                <motion.div whileHover={{ y: -10 }}>
                  <GlassCard className="p-8 border-2 border-white/30 hover:border-white/50 transition-all duration-300 bg-white/10 backdrop-blur-sm">
                    <div className={`w-20 h-20 ${feature.color === 'pink' ? 'bg-gradient-to-br from-pink-400 to-red-400' : 'bg-gradient-to-br from-red-400 to-pink-400'} rounded-3xl flex items-center justify-center mb-6 shadow-xl`}>
                      <feature.icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-md">{feature.title}</h3>
                    <ul className="space-y-3 text-white/90">
                      {[1, 2, 3].map((i) => (
                        <li key={i} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-base">Professional service</span>
                        </li>
                      ))}
                    </ul>
                    <div className={`w-full h-1.5 ${feature.color === 'pink' ? 'bg-gradient-to-r from-pink-400 to-red-400' : 'bg-gradient-to-r from-red-400 to-pink-400'} rounded-full mt-6`}></div>
                  </GlassCard>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Curated Packages Section - Elegant Pink/Red */}
      <section className="relative py-24 bg-gradient-to-br from-red-200 via-pink-200 to-pink-300 overflow-hidden">
        {/* Elegant blend background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-300/60 via-pink-300/60 to-pink-400/60"></div>
        
        {/* Rotating Elements - Vibrant */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-20 w-40 h-40 bg-red-300 rounded-full opacity-30 blur-xl"
            animate={{
              x: [0, 20, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-36 h-36 bg-pink-300 rounded-full opacity-30 blur-xl"
            animate={{
              x: [0, -20, 0],
              y: [0, 20, 0],
              scale: [1, 1.1, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/3 right-1/3 w-32 h-32 bg-red-300 rounded-full opacity-25 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360]
            }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/4 w-44 h-44 bg-pink-300 rounded-full opacity-25 blur-xl"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [360, 0]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Floating Stars and Flowers - White on pink background */}
        <FloatingElements count={18} section="packages" backgroundType="pink" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2 text-lg font-bold mb-6">
                <Crown className="w-5 h-5 inline mr-2" />
                Curated Packages
              </Badge>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
                Ready-to-Go Event Solutions
              </h2>
              <p className="text-xl text-white/95 max-w-4xl mx-auto leading-relaxed font-semibold drop-shadow-md">
                Handpicked packages designed by experts to make your celebration perfect.
              </p>
            </div>
          </ScrollReveal>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <LoadingSkeleton type="card" count={3} />
            </div>
          ) : featuredPackages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No curated packages available</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {featuredPackages.slice(0, 3).map((pkg, index) => (
                <ScrollReveal key={pkg._id || index} direction="up" delay={index * 0.1}>
                  <motion.div whileHover={{ y: -10 }}>
                    <PackageCard 
                      packageData={pkg}
                      onViewDetails={() => navigate(`/packages/${pkg._id}`)}
                      showAddToCart={false}
                      showBookNow={false}
                      showViewDetails={true}
                    />
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          )}

          <div className="text-center relative z-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/packages')}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 inline-flex items-center gap-3 cursor-pointer relative z-20"
            >
              <Package className="w-6 h-6" />
              View All Packages
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Beat & Bloom Section - Vibrant Pink/Red */}
      <section className="relative py-24 bg-gradient-to-br from-pink-300 via-red-300 to-pink-400 overflow-hidden">
        {/* Vibrant blend background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/70 via-red-400/70 to-pink-500/70"></div>
        
        {/* Floating Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => {
            const sizes = [60, 80, 100, 120, 140];
            const size = sizes[i % sizes.length];
            const positions = [
              { top: '10%', left: '15%' },
              { top: '20%', right: '20%' },
              { top: '30%', left: '10%' },
              { top: '40%', right: '15%' },
              { bottom: '10%', left: '20%' },
              { bottom: '20%', right: '15%' },
              { bottom: '30%', left: '10%' },
              { bottom: '40%', right: '20%' },
            ];
            const pos = positions[i % positions.length];
            const isPink = i % 2 === 0;
            
            return (
              <motion.div
                key={`bloom-circle-${i}`}
                className={`absolute ${isPink ? 'bg-pink-500' : 'bg-red-500'} rounded-full opacity-25 blur-2xl`}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  ...pos,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.25, 0.35, 0.25],
                  x: [0, (i % 5) * 8 - 16, 0],
                  y: [0, (i % 4) * 8 - 12, 0],
                }}
                transition={{
                  duration: 8 + (i % 4) * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: (i % 3) * 1
                }}
              />
            );
          })}
        </div>

        {/* Floating Stars and Flowers - White on pink background */}
        <FloatingElements count={20} section="beatBloom" backgroundType="pink" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-16 relative z-20">
              <Badge className="bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white px-6 py-2 text-lg font-bold mb-6 relative z-20">
                <Heart className="w-5 h-5 inline mr-2" />
                Beat & Bloom
              </Badge>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-2xl relative z-20">
                Individual Service Packages
              </h2>
              <p className="text-xl text-white max-w-4xl mx-auto leading-relaxed drop-shadow-lg font-semibold relative z-20">
                Choose from our specialized service packages. Each service is designed to meet specific needs 
                and can be combined for a complete event experience.
              </p>
            </div>
          </ScrollReveal>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <LoadingSkeleton type="card" count={3} />
            </div>
          ) : beatBloomPackages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Beat & Bloom services available</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {beatBloomPackages.slice(0, 3).map((pkg, index) => (
                <ScrollReveal key={pkg._id || index} direction="up" delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="cursor-pointer"
                    onClick={() => navigate(`/beatbloom/${pkg._id}`)}
                  >
                    <GlassCard className="p-8 border-2 border-pink-100 hover:border-pink-300 transition-all duration-300 overflow-hidden group">
                      <div className="relative mb-6">
                        <img 
                          src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'} 
                          alt={pkg.title}
                          className="w-full h-56 object-cover rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 text-sm font-bold shadow-xl">
                            ₹{pkg.price?.toLocaleString() || '0'}
                          </Badge>
                        </div>
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/90 text-pink-600 px-3 py-1 text-xs font-semibold">
                            {pkg.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-pink-800 mb-4 group-hover:text-pink-600 transition-colors">
                        {pkg.title}
                      </h3>
                      <p className="text-pink-700 leading-relaxed mb-6">
                        {pkg.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-pink-600 font-semibold group-hover:gap-4 transition-all">
                        <span>View Details</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </GlassCard>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          )}

          <div className="text-center relative z-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/beatbloom')}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 inline-flex items-center gap-3 cursor-pointer relative z-20"
            >
              Explore All Services
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Elegant Pink/Red */}
      <section className="relative py-24 bg-gradient-to-br from-red-200 via-pink-200 to-pink-300 overflow-hidden">
        {/* Elegant blend background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-300/60 via-pink-300/60 to-pink-400/60"></div>
        
        {/* Rotating Blurs - Vibrant */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-44 h-44 bg-pink-300 rounded-full opacity-30 blur-xl"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-300 rounded-full opacity-30 blur-xl"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-pink-300 rounded-full opacity-25 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360]
            }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/3 right-1/3 w-36 h-36 bg-red-300 rounded-full opacity-25 blur-xl"
            animate={{
              scale: [1, 1.18, 1],
              rotate: [360, 0]
            }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Floating Stars and Flowers - White on pink background */}
        <FloatingElements count={18} section="testimonials" backgroundType="pink" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-16 relative z-20">
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
                What Our Clients Say
              </h2>
              <p className="text-xl text-white/95 max-w-4xl mx-auto leading-relaxed font-semibold drop-shadow-md">
                Real experiences from real people who trusted us with their special moments.
              </p>
            </div>
          </ScrollReveal>

          {testimonials.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No testimonials available</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.slice(0, 6).map((testimonial, index) => (
                <ScrollReveal key={testimonial.id || index} direction="up" delay={index * 0.1}>
                  <motion.div whileHover={{ y: -5 }}>
                    <GlassCard className="p-6 border-2 border-white/30 hover:border-white/50 transition-all duration-300 bg-white/10 backdrop-blur-sm">
                      <TestimonialCard testimonial={testimonial} />
                    </GlassCard>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Premium CTA Section - Elegant Pink/Red */}
      <section className="relative py-24 bg-gradient-to-br from-pink-400 via-red-400 to-pink-500 overflow-hidden">
        {/* Elegant blend background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/80 via-red-500/80 to-pink-600/80"></div>
        
        {/* White Blur Overlays */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-20 w-64 h-64 bg-white/8 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 40, 0],
              y: [0, -40, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-72 h-72 bg-white/8 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.4, 1],
              x: [0, -40, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-white/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.25, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/4 right-1/4 w-48 h-48 bg-white/6 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Floating Stars and Flowers - White on pink background */}
        <FloatingElements count={22} section="cta" backgroundType="pink" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl">
              Ready to Create Magic?
            </h2>
            <p className="text-2xl md:text-3xl text-white/90 mb-12 leading-relaxed">
              Let's create an unforgettable experience that will be remembered for a lifetime.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/packages')}
                className="bg-white text-pink-600 hover:bg-pink-50 px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 inline-flex items-center gap-3"
              >
                <Package className="w-6 h-6" />
                Browse Packages
                <ArrowRight className="w-6 h-6" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/contact')}
                className="bg-transparent border-3 border-white text-white hover:bg-white hover:text-pink-600 px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 inline-flex items-center gap-3"
              >
                <Phone className="w-6 h-6" />
                Contact Us
              </motion.button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className="flex flex-col items-center gap-3 text-white/90"
                >
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-lg">{feature.title}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
