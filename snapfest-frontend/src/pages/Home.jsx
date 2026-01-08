import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Star, ArrowRight, CheckCircle, Search, 
  Heart, Shield, Crown, Clock, Sparkle,
  Package, ArrowDown, ChevronRight, ChevronLeft, Phone
} from 'lucide-react';
import { TestimonialCard } from '../components/cards';
import { Badge } from '../components/ui';
import { LoadingSkeleton } from '../components/enhanced';
import { publicAPI } from '../services/api';
import { dummyPackages, dummyTestimonials } from '../data';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [beatBloomPackages, setBeatBloomPackages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [showFinalBackground, setShowFinalBackground] = useState(false);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroImagesLoaded, setHeroImagesLoaded] = useState(false);
  
  // Hero section images from public/heroImages folder
  const heroImagePool = [
    '/heroImages/WhatsApp Image 2025-11-27 at 15.31.05 (1).jpeg',
    '/heroImages/WhatsApp Image 2025-11-28 at 10.55.37.jpeg',
    '/heroImages/WhatsApp Image 2025-11-28 at 10.48.48.jpeg',
    '/heroImages/WhatsApp Image 2025-11-28 at 10.55.36.jpeg',
  ];

  // Preload hero images to prevent lag - optimized
  useEffect(() => {
    let loadedCount = 0;
    const totalImages = heroImagePool.length;
    
    const preloadImages = () => {
      heroImagePool.forEach((src) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setHeroImagesLoaded(true);
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setHeroImagesLoaded(true);
          }
        };
        img.src = src;
      });
    };
    preloadImages();
  }, []);

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
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error loading data:', error);
        }
        setFeaturedPackages(dummyPackages.filter(pkg => pkg.isPremium).slice(0, 6));
        setBeatBloomPackages([]);
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Get 4 images for grid - handles case where we have fewer than 4 images
  const getCurrentGridImages = useMemo(() => {
    const images = [];
    const poolLength = heroImagePool.length;
    
    if (poolLength === 0) return [];
    
    // If we have 3 images, use all 3 + repeat the first one for 4-grid
    // If we have 4+, use 4 consecutive images
    for (let i = 0; i < 4; i++) {
      const imageIndex = (currentImageIndex + i) % poolLength;
      images.push(heroImagePool[imageIndex]);
    }
    return images;
  }, [currentImageIndex]);

  // Get 1 image for full background - cycles through all images
  const getCurrentFullImage = useMemo(() => {
    if (heroImagePool.length === 0) return '';
    // Use the 5th image in sequence (or wrap around)
    return heroImagePool[(currentImageIndex + 4) % heroImagePool.length];
  }, [currentImageIndex]);

  // Continuous loop animation: Grid (3.5s) -> Full Image (5s) -> Rotate Images -> Repeat
  // Optimized to prevent unnecessary re-renders
  useEffect(() => {
    let timeoutId1;
    let timeoutId2;
    let isMounted = true;
    
    const cycleAnimation = () => {
      if (!isMounted) return;
      
      // Show grid first with smooth transition
      setShowFinalBackground(false);
      setAnimationCycle(prev => prev + 1);
      
      // After 3.5 seconds, smoothly transition to full image (start fade-in immediately)
      timeoutId1 = setTimeout(() => {
        if (!isMounted) return;
        // Start full image fade-in immediately (will crossfade with grid fade-out)
        setShowFinalBackground(true);
        
        // After 5 more seconds, smoothly rotate to next images and cycle back to grid
        timeoutId2 = setTimeout(() => {
          if (!isMounted) return;
          // First, fade out the full image smoothly
          // Then rotate to next set of images (sliding window) - this will trigger smooth transition
          setCurrentImageIndex(prev => (prev + 1) % heroImagePool.length);
          // Small delay to allow smooth crossfade before showing grid again
          setTimeout(() => {
            if (isMounted) {
              cycleAnimation(); // Restart the cycle with new images
            }
          }, 150); // Reduced delay for faster transition
        }, 5000);
      }, 3500);
    };
    
    // Wait for images to be preloaded before starting animation
    const startDelay = setTimeout(() => {
      if (isMounted) {
        cycleAnimation();
      }
    }, heroImagesLoaded ? 100 : 500);
    
    return () => {
      isMounted = false;
      if (timeoutId1) clearTimeout(timeoutId1);
      if (timeoutId2) clearTimeout(timeoutId2);
      clearTimeout(startDelay);
    };
  }, [heroImagesLoaded]);


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

  // Memoized step images array
  const stepImages = useMemo(() => [
    'http://localhost:5001/PUBLIC/uploads/packages/birthday-1-1763005343978-621953612.jpg',
    'http://localhost:5001/PUBLIC/uploads/events/haldi-2-1762954712692-365441822.jpg',
    'http://localhost:5001/PUBLIC/uploads/packages/wedding-1-1763006126439-890905982.jpg',
    'http://localhost:5001/PUBLIC/uploads/events/birthday-1-1762974084698-58616251.jpg'
  ], []);

  // Floating Elements Component - Optimized with memoization and reduced count for performance
  const FloatingElements = React.memo(({ count = 8, section = 'hero', backgroundType = 'pink' }) => {
    // Allow higher counts for packages and beatBloom sections, cap others for performance
    const maxCount = (section === 'packages' || section === 'beatBloom') ? 20 : 12;
    const optimizedCount = Math.min(count, maxCount);
    const flowers = Math.floor(optimizedCount * 0.4);
    const stars = Math.floor(optimizedCount * 0.6);
    
    // Memoized color functions
    const getFlowerColor = useCallback((i) => {
      if (backgroundType === 'pink') {
        const colors = ['text-white', 'text-gray-100', 'text-gray-50'];
        return colors[i % colors.length];
      } else {
        const colors = ['text-pink-200', 'text-pink-300', 'text-pink-100'];
        return colors[i % colors.length];
      }
    }, [backgroundType]);

    const getStarColor = useCallback((i) => {
      if (backgroundType === 'pink') {
        const colors = ['text-white', 'text-gray-100', 'text-gray-50'];
        return colors[i % colors.length];
      } else {
        const colors = ['text-pink-200', 'text-pink-300', 'text-pink-100'];
        return colors[i % colors.length];
      }
    }, [backgroundType]);
    
    // Memoized position arrays
    const flowerPositions = useMemo(() => [
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
    ], []);

    const starPositions = useMemo(() => [
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
    ], []);
    
    return (
      <>
        {/* Floating Flowers - Optimized with hardware acceleration */}
        {[...Array(flowers)].map((_, i) => {
          const pos = flowerPositions[i % flowerPositions.length];
          const size = 12 + (i % 4) * 4;
          const delay = (i % 5) * 0.5;
          const floatDuration = 6 + (i % 4) * 1;
          const blinkDuration = 2 + (i % 3) * 0.5;
          const xOffset = (i % 3) * 5 - 5;
          
          return (
            <motion.div
              key={`flower-${section}-${i}`}
              className="absolute pointer-events-none z-[1]"
              style={{
                ...pos,
                width: `${size}px`,
                height: `${size}px`,
                willChange: 'transform',
                transform: 'translateZ(0)', // Force GPU acceleration
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                y: {
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

        {/* Floating Stars - Optimized with hardware acceleration */}
        {[...Array(stars)].map((_, i) => {
          const pos = starPositions[i % starPositions.length];
          const size = 8 + (i % 3) * 2;
          const delay = (i % 4) * 0.3;
          const floatDuration = 4 + (i % 3) * 1;
          const blinkDuration = 1.5 + (i % 3) * 0.4;
          const xOffset = (i % 3) * 3 - 3;
          
          return (
            <motion.div
              key={`star-${section}-${i}`}
              className="absolute pointer-events-none z-[1]"
              style={{
                ...pos,
                width: `${size}px`,
                height: `${size}px`,
                willChange: 'transform',
                transform: 'translateZ(0)', // Force GPU acceleration
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 180, 360],
                opacity: [0.25, 0.5, 0.25],
              }}
              transition={{
                y: {
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
  });

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Professional Hero Section - Clean & Elegant Design */}
      <section className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-pink-50 via-white to-pink-100">
        {/* Animated Background - 4 Grid Images then 5th Image with Smooth Transitions */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="sync">
            {/* 4-image grid layout (2x2) - Fast smooth fade-in */}
            {!showFinalBackground && (
              <motion.div
                key={`grid-background-${animationCycle}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 grid grid-cols-2 grid-rows-2 z-10"
              >
                {getCurrentGridImages.map((imageUrl, index) => (
                  <motion.div
                    key={`grid-${index}-${animationCycle}`}
                    className="relative overflow-hidden"
                    style={{ willChange: 'opacity' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.03,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={`Background ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                      onError={(e) => {
                        e.target.src = heroImagePool[0] || '';
                      }}
                    />
                    {/* Subtle overlay for each grid section */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {/* Final 5th image - Full background - Fast smooth crossfade */}
            {showFinalBackground && (
              <motion.div
                key={`final-background-${currentImageIndex}`}
                style={{ willChange: 'opacity' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 z-20"
              >
                <img
                  src={getCurrentFullImage}
                  alt="Hero background"
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    e.target.src = heroImagePool[0] || '/heroImages/WhatsApp Image 2025-11-28 at 10.55.37.jpeg';
                  }}
                />
                {/* Professional gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-900/20 via-transparent to-pink-900/20"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        
        {/* Minimal background accent - Single subtle element */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400 rounded-full opacity-10 blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
        </div>

        {/* Main Content - Centered and Professional */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center space-y-8">
            {/* Elegant Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ willChange: 'transform, opacity' }}
            >
              <span className="inline-block px-6 py-2 bg-white/20 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/30 shadow-lg">
                Premium Event Solutions
              </span>
            </motion.div>

            {/* Main Headline - Clean and Professional */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ willChange: 'transform, opacity' }}
              className="space-y-6"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                <span className="block text-white drop-shadow-lg">Big Moments,</span>
                <span className="block bg-gradient-to-r from-pink-200 via-white to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
                  Just a Snap Away
                </span>
              </h1>
              
              <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-md">
                Transform your vision into reality with our premium event management, photography, and entertainment services.
              </p>
            </motion.div>

            {/* CTA Buttons - Modern and Clean */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ willChange: 'transform, opacity' }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ willChange: 'transform' }}
                onClick={() => navigate('/packages')}
                className="group relative bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white px-10 py-4 text-sm font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden whitespace-nowrap flex-shrink-0 min-w-[200px] sm:min-w-[220px]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Package className="w-5 h-5 group-hover:rotate-12 transition-transform flex-shrink-0" />
                  <span className="whitespace-nowrap">Explore Packages</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-700 to-pink-600"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ willChange: 'transform' }}
                onClick={() => navigate('/contact')}
                className="bg-white/95 backdrop-blur-sm text-pink-600 hover:text-pink-700 border-2 border-white/50 px-10 py-4 text-sm font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white whitespace-nowrap flex-shrink-0 min-w-[200px] sm:min-w-[220px]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Hire Event Managers</span>
                </span>
              </motion.button>
            </motion.div>
          </div>
        </div>
        
        {/* Elegant Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        >
          <motion.button
            style={{ willChange: 'transform' }}
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer group"
          >
            <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-1.5 group-hover:border-white transition-colors">
              <motion.div
                style={{ willChange: 'transform' }}
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
            </div>
          </motion.button>
        </motion.div>
      </section>

      {/* How It Works + About SnapFest - Map-like Flow Design */}
      <section className="relative py-20 bg-gradient-to-br from-pink-200 via-pink-100 to-red-200 overflow-hidden">
        {/* Elegant blend background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-300/60 via-pink-200/60 to-red-300/60"></div>
        
        {/* Floating Elements - Vibrant Pink/Red Blur */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-10 right-10 w-48 h-48 bg-red-300 rounded-full opacity-30 blur-2xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.15, 1],
              x: [0, 25, 0],
              y: [0, -25, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-56 h-56 bg-pink-300 rounded-full opacity-30 blur-2xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -25, 0],
              y: [0, 25, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute top-1/3 right-1/3 w-40 h-40 bg-red-300 rounded-full opacity-25 blur-xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.25, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-44 h-44 bg-pink-300 rounded-full opacity-25 blur-xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
        </div>

        {/* Floating Stars and Flowers */}
        {/* Floating Elements - Reduced count for better performance */}
        <FloatingElements count={8} section="howItWorks" backgroundType="white" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section - Concise About SnapFest */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ willChange: 'transform, opacity' }}
            className="text-center mb-16"
          >
            <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-3 text-lg font-bold mb-6 shadow-xl">
              Your Journey Starts Here
            </Badge>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-pink-800 mb-4 drop-shadow-lg">
              How SnapFest Works
            </h2>
            <p className="text-lg md:text-xl text-pink-600 max-w-2xl mx-auto">
              Premium event management made simple
            </p>
          </motion.div>

          {/* Map-like Flow Path */}
          <div className="relative">
            {/* Curved Path/Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" style={{ height: '100%', minHeight: '600px', zIndex: 1 }}>
              <motion.path
                d="M 10% 200 Q 25% 150, 40% 200 T 70% 200 T 90% 200"
                stroke="url(#gradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray="10,5"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.6 }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.5 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Flow Steps with Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 relative z-10">
              {howItWorks.map((step, index) => {
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{ willChange: 'transform, opacity' }}
                    className="relative"
                  >
                    {/* Step Card */}
                    <motion.div
                      whileHover={{ y: -15, scale: 1.05 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ willChange: 'transform' }}
                      className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-pink-200 hover:border-pink-400 transition-all duration-300"
                    >
                      {/* Step Number Badge */}
                      <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 w-16 h-16 ${step.color === 'pink' ? 'bg-gradient-to-r from-pink-500 to-red-500' : 'bg-gradient-to-r from-red-500 to-pink-500'} rounded-full flex items-center justify-center text-white font-black text-xl shadow-2xl`}>
                        {step.step}
                      </div>

                      {/* Image Section */}
                      <div className="relative h-48 overflow-hidden">
                        <motion.img
                          src={stepImages[index]}
                          alt={step.title}
                          className="w-full h-full object-cover"
                          style={{ willChange: 'transform' }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                          onError={(e) => {
                            e.target.src = 'http://localhost:5001/PUBLIC/uploads/events/birthday-1-1763009354760-508356223.jpg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-pink-600/80 via-pink-500/40 to-transparent"></div>
                        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 ${step.color === 'pink' ? 'bg-gradient-to-br from-pink-400 to-red-400' : 'bg-gradient-to-br from-red-400 to-pink-400'} rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm`}>
                          <step.icon className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      {/* Content Section - Compact */}
                      <div className="p-5 text-center">
                        <h3 className="text-xl font-bold text-pink-800 mb-2">{step.title}</h3>
                        <p className="text-sm text-pink-600 leading-relaxed">{step.description}</p>
                      </div>

                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* Ready-to-Go Event Solutions - Redesigned */}
      <section className="relative py-16 bg-gradient-to-br from-pink-100 via-pink-50 to-pink-200 overflow-hidden">
        {/* Vibrant pinkish animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large animated pink blobs */}
          <motion.div
            className="absolute top-10 left-10 w-96 h-96 bg-pink-300 rounded-full opacity-30 blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.4, 1],
              x: [0, 60, 0],
              y: [0, 40, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-pink-400 rounded-full opacity-25 blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -50, 0],
              y: [0, -60, 0],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-pink-200 rounded-full opacity-20 blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.5, 1],
              rotate: [0, 360]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          {/* Additional smaller decorative blobs */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-64 h-64 bg-pink-300 rounded-full opacity-25 blur-2xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 16, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 0.5 }}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-pink-400 rounded-full opacity-20 blur-2xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -40, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1 }}
          />
        </div>

        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(236, 72, 153, 0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Floating Elements - More elements for visual appeal */}
        <FloatingElements count={18} section="packages" backgroundType="pink" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ willChange: 'transform, opacity' }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Badge className="bg-gradient-to-r from-pink-500 via-pink-400 to-pink-600 text-white px-5 py-1.5 text-sm font-bold mb-3 shadow-xl inline-flex items-center gap-2 border-2 border-pink-300/50">
                <Crown className="w-3.5 h-3.5" />
                Curated Packages
              </Badge>
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-700 via-pink-600 to-pink-800 bg-clip-text text-transparent mb-2 drop-shadow-lg">
              Ready-to-Go Event Solutions
            </h2>
            <p className="text-sm md:text-base text-pink-800 max-w-2xl mx-auto leading-relaxed">
              Handpicked packages designed by experts to make your celebration perfect
            </p>
          </motion.div>

          {/* Packages Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <LoadingSkeleton type="card" count={3} />
            </div>
          ) : featuredPackages.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-20 h-20 text-pink-300 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-pink-600 mb-2">No curated packages available</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {featuredPackages.slice(0, 3).map((pkg, index) => {
                const packageImage = pkg.primaryImage || pkg.images?.[0] || 'http://localhost:5001/PUBLIC/uploads/events/birthday-1-1763009354760-508356223.jpg';
                return (
                  <motion.div
                    key={pkg._id || index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    whileHover={{ y: -15, scale: 1.02 }}
                    style={{ willChange: 'transform, opacity' }}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/packages/${pkg._id}`)}
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-pink-100 hover:border-pink-300">
                      {/* Image Container */}
                      <div className="relative h-56 overflow-hidden">
                        <motion.img
                          src={packageImage}
                          alt={pkg.title}
                          className="w-full h-full object-cover"
                          style={{ willChange: 'transform' }}
                          whileHover={{ scale: 1.15 }}
                          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-pink-600/80 via-pink-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Price Badge */}
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.2 + 0.3, type: 'spring' }}
                          className="absolute top-6 right-6"
                        >
                          <Badge className="bg-white/95 backdrop-blur-sm text-pink-600 px-5 py-2 text-lg font-bold shadow-xl">
                            ₹{pkg.basePrice?.toLocaleString() || '0'}
                          </Badge>
                        </motion.div>

                        {/* Category Badge */}
                        <motion.div
                          initial={{ x: -50 }}
                          whileInView={{ x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.2 + 0.4 }}
                          className="absolute top-6 left-6"
                        >
                          <Badge className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
                            {pkg.category || 'PREMIUM'}
                          </Badge>
                        </motion.div>

                        {/* Hover Icon */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 shadow-2xl">
                            <ArrowRight className="w-10 h-10 text-pink-600" />
                          </div>
                        </motion.div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors line-clamp-1">
                          {pkg.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                          {pkg.description}
                        </p>

                        {/* Features */}
                        {pkg.highlights && pkg.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {pkg.highlights.slice(0, 2).map((highlight, idx) => (
                              <Badge
                                key={idx}
                                className="bg-pink-50 text-pink-700 px-2 py-0.5 text-xs font-medium border border-pink-200"
                              >
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Rating */}
                        {pkg.rating > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(pkg.rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-gray-600">
                              {pkg.rating.toFixed(1)}
                            </span>
                          </div>
                        )}

                        {/* CTA Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/packages')}
              className="bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 hover:from-pink-600 hover:via-pink-700 hover:to-pink-600 text-white px-10 py-4 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3 relative overflow-hidden group border-2 border-pink-300/30"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Package className="w-6 h-6" />
                View All Packages
                <ArrowRight className="w-6 h-6" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-pink-600 via-pink-700 to-pink-600"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Individual Service Packages - Redesigned */}
      <section className="relative py-16 bg-gradient-to-br from-pink-200 via-pink-100 to-pink-300 overflow-hidden">
        {/* Vibrant pinkish animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large animated pink blobs */}
          <motion.div
            className="absolute top-20 right-20 w-[500px] h-[500px] bg-pink-400 rounded-full opacity-30 blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.4, 1],
              x: [0, -60, 0],
              y: [0, 50, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-96 h-96 bg-pink-300 rounded-full opacity-30 blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 50, 0],
              y: [0, -50, 0],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-pink-200 rounded-full opacity-25 blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.5, 1],
              rotate: [0, 360]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          {/* Additional smaller decorative blobs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-80 h-80 bg-pink-400 rounded-full opacity-25 blur-2xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -30, 0],
              y: [0, 25, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 0.5 }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-pink-300 rounded-full opacity-25 blur-2xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 40, 0],
              y: [0, -35, 0]
            }}
            transition={{ duration: 16, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1 }}
          />
          <motion.div
            className="absolute top-3/4 right-1/4 w-64 h-64 bg-pink-400 rounded-full opacity-20 blur-2xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.25, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 19, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 }}
          />
        </div>

        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(236, 72, 153, 0.4) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Floating Elements - More elements for visual appeal */}
        <FloatingElements count={18} section="beatBloom" backgroundType="pink" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ willChange: 'transform, opacity' }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Badge className="bg-gradient-to-r from-pink-500 via-pink-400 to-pink-600 text-white px-5 py-1.5 text-sm font-bold mb-3 shadow-xl inline-flex items-center gap-2 border-2 border-pink-300/50">
                <Heart className="w-3.5 h-3.5" />
                Beat & Bloom
              </Badge>
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-700 via-pink-600 to-pink-800 bg-clip-text text-transparent mb-2 drop-shadow-lg">
              Individual Service Packages
            </h2>
            <p className="text-sm md:text-base text-pink-800 max-w-2xl mx-auto leading-relaxed">
              Choose from our specialized service packages. Each service is designed to meet specific needs 
              and can be combined for a complete event experience.
            </p>
          </motion.div>

          {/* Services Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <LoadingSkeleton type="card" count={3} />
            </div>
          ) : beatBloomPackages.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-20 h-20 text-pink-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-pink-700 mb-2">No Beat & Bloom services available</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {beatBloomPackages.slice(0, 3).map((pkg, index) => {
                const serviceImage = pkg.images?.[0] || 'http://localhost:5001/PUBLIC/uploads/events/haldi-2-1762954712692-365441822.jpg';
                return (
                  <motion.div
                    key={pkg._id || index}
                    initial={{ opacity: 0, y: 50, rotateY: -15 }}
                    whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    whileHover={{ y: -20, scale: 1.03, rotateY: 5 }}
                    style={{ willChange: 'transform, opacity' }}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/beatbloom/${pkg._id}`)}
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-pink-100 hover:border-pink-400 group">
                      {/* Image Container with Tilt Effect */}
                      <div className="relative h-56 overflow-hidden">
                        <motion.img
                          src={serviceImage}
                          alt={pkg.title}
                          className="w-full h-full object-cover"
                          style={{ willChange: 'transform' }}
                          whileHover={{ scale: 1.2, rotate: 2 }}
                          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                        />
                        {/* Animated Gradient Overlay */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-pink-600/90 via-pink-500/60 to-transparent"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                        
                        {/* Shine effect on hover */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.8 }}
                        />
                        
                        {/* Price Badge with Animation */}
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.2 + 0.3, type: 'spring', stiffness: 200 }}
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          className="absolute top-4 right-4 z-10"
                        >
                          <Badge className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-1.5 text-base font-bold shadow-xl border border-pink-300/30">
                            ₹{pkg.price?.toLocaleString() || pkg.basePrice?.toLocaleString() || '0'}
                          </Badge>
                        </motion.div>

                        {/* Category Badge */}
                        <motion.div
                          initial={{ x: -100, opacity: 0 }}
                          whileInView={{ x: 0, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.2 + 0.4, type: 'spring' }}
                          className="absolute top-4 left-4 z-10"
                        >
                          <Badge className="bg-white/95 backdrop-blur-sm text-pink-600 px-3 py-1 text-xs font-semibold shadow-xl border border-pink-200">
                            {pkg.category || 'SERVICE'}
                          </Badge>
                        </motion.div>

                        {/* Hover Overlay with Icon */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-pink-500/25 backdrop-blur-md"
                        >
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                            className="bg-white rounded-full p-5 shadow-2xl border-2 border-pink-200"
                          >
                            <ArrowRight className="w-8 h-8 text-pink-600" />
                          </motion.div>
                        </motion.div>
                        
                        {/* Corner accent */}
                        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-pink-400/30 to-transparent rounded-br-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>

                      {/* Content */}
                      <div className="p-5 bg-white">
                        <motion.h3
                          className="text-lg font-bold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors line-clamp-1"
                          whileHover={{ x: 5 }}
                        >
                          {pkg.title}
                        </motion.h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                          {pkg.description}
                        </p>

                        {/* Features/Tags */}
                        {pkg.features && pkg.features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {pkg.features.slice(0, 2).map((feature, idx) => (
                              <motion.div
                                key={idx}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Badge className="bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700 px-2 py-0.5 text-xs font-medium border border-pink-300">
                                  {feature}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Rating (if available) */}
                        {pkg.rating > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(pkg.rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-gray-600">
                              {pkg.rating.toFixed(1)}
                            </span>
                          </div>
                        )}

                        {/* CTA Button */}
                        <motion.button
                          whileHover={{ scale: 1.05, x: 5 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 hover:from-pink-600 hover:via-pink-700 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group border border-pink-300/30"
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            Explore Service
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-pink-600 via-pink-700 to-pink-600"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.5 }}
                          />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/beatbloom')}
              className="bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 hover:from-pink-600 hover:via-pink-700 hover:to-pink-600 text-white px-10 py-4 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3 relative overflow-hidden group border-2 border-pink-300/30"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Heart className="w-6 h-6" />
                Explore All Services
                <ArrowRight className="w-6 h-6" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-pink-600 via-pink-700 to-pink-600"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Carousel Section - Redesigned */}
      <section className="relative py-16 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('http://localhost:5001/PUBLIC/uploads/events/birthday-1-1763009354760-508356223.jpg')`
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-900/80 via-pink-800/75 to-pink-900/80"></div>
          
          {/* Additional pinkish overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-600/40 via-pink-500/30 to-pink-600/40"></div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 bg-pink-400 rounded-full opacity-20 blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-pink-300 rounded-full opacity-20 blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -40, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
        </div>

        {/* Floating Elements - Reduced count for better performance */}
        <FloatingElements count={10} section="testimonials" backgroundType="pink" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ willChange: 'transform, opacity' }}
            className="text-center mb-10"
          >
            <Badge className="bg-gradient-to-r from-pink-500 via-pink-400 to-pink-600 text-white px-5 py-1.5 text-sm font-bold mb-3 shadow-xl inline-flex items-center gap-2 border-2 border-pink-300/50">
              <Star className="w-3.5 h-3.5" />
              Client Testimonials
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-2xl">
              What Our Clients Say
            </h2>
            <p className="text-base md:text-lg text-white/95 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-lg">
              Real experiences from real people who trusted us with their special moments.
            </p>
          </motion.div>

          {/* Carousel Container */}
          {testimonials.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-16 h-16 text-white/60 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white mb-2">No testimonials available</h3>
            </div>
          ) : (
            <div className="relative">
              {/* Carousel Wrapper */}
              <div className="overflow-hidden">
                <motion.div
                  className="flex"
                  style={{ willChange: 'transform' }}
                  animate={{
                    x: `-${currentTestimonialIndex * 100}%`
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 35,
                    mass: 0.8
                  }}
                >
                  {/* Group testimonials into slides of 3 */}
                  {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, slideIndex) => (
                    <div
                      key={slideIndex}
                      className="flex-shrink-0 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2"
                    >
                      {testimonials
                        .slice(slideIndex * 3, slideIndex * 3 + 3)
                        .map((testimonial, cardIndex) => {
                          const actualIndex = slideIndex * 3 + cardIndex;
                          return (
                            <motion.div
                              key={testimonial.id || actualIndex}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: cardIndex * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                              whileHover={{ y: -10, scale: 1.02 }}
                              style={{ willChange: 'transform, opacity' }}
                              className="h-full"
                            >
                              <div className="bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-2xl border-2 border-pink-200/50 hover:border-pink-400 transition-all duration-300 h-full flex flex-col">
                                <TestimonialCard testimonial={testimonial} />
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const maxIndex = Math.ceil(testimonials.length / 3) - 1;
                    setCurrentTestimonialIndex((prev) => 
                      prev === 0 ? maxIndex : prev - 1
                    );
                  }}
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-4 rounded-full shadow-xl border-2 border-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={testimonials.length <= 3}
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>

                {/* Dots Indicator */}
                <div className="flex gap-2">
                  {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonialIndex(index)}
                      className={`h-3 rounded-full transition-all duration-300 ${
                        currentTestimonialIndex === index
                          ? 'bg-white w-8'
                          : 'bg-white/40 hover:bg-white/60 w-3'
                      }`}
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const maxIndex = Math.ceil(testimonials.length / 3) - 1;
                    setCurrentTestimonialIndex((prev) => 
                      prev >= maxIndex ? 0 : prev + 1
                    );
                  }}
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-4 rounded-full shadow-xl border-2 border-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={testimonials.length <= 3}
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </div>
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
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 40, 0],
              y: [0, -40, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-72 h-72 bg-white/8 rounded-full blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.4, 1],
              x: [0, -40, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-white/5 rounded-full blur-3xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.25, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
          <motion.div
            className="absolute top-1/4 right-1/4 w-48 h-48 bg-white/6 rounded-full blur-2xl"
            style={{ willChange: 'transform' }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
        </div>

        {/* Floating Stars and Flowers - Reduced count for better performance */}
        <FloatingElements count={10} section="cta" backgroundType="pink" />

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
