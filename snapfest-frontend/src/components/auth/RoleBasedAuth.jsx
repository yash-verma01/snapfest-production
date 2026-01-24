import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SignIn, SignUp, useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../ui/Card';
import { userAPI, vendorAPI, publicAPI } from '../../services/api';
import { Sparkles, ArrowRight, Users, Briefcase, Shield } from 'lucide-react';

const RoleBasedAuth = ({ mode = 'signin' }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [adminLimitReached, setAdminLimitReached] = useState(false);
  const [isCheckingAdminLimit, setIsCheckingAdminLimit] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  
  // Track if redirect has already happened to prevent multiple redirects
  const redirectAttemptedRef = useRef(false);

  // Check if we're on the signup/signin completion page
  const isSignupComplete = location.pathname === '/sign-up/complete';
  const isSigninComplete = location.pathname === '/sign-in/complete';

  // Redirect function with useCallback to prevent recreation
  const redirectBasedOnRole = useCallback((role) => {
    // Prevent multiple redirects
    if (redirectAttemptedRef.current) {
      return;
    }
    
    console.log('🔄 Redirecting based on role:', role);
    redirectAttemptedRef.current = true;
    
    switch (role) {
      case 'admin':
        navigate('/admin/profile', { replace: true });
        break;
      case 'vendor':
        navigate('/vendor/profile', { replace: true });
        break;
      case 'user':
      default:
        navigate('/user/profile', { replace: true });
        break;
    }
  }, [navigate]);

  // Safety timeout: Always redirect after 3 seconds if still on complete page
  useEffect(() => {
    if ((isSigninComplete || isSignupComplete) && isLoaded && user) {
      const safetyTimeout = setTimeout(() => {
        if ((location.pathname === '/sign-in/complete' || location.pathname === '/sign-up/complete') && !redirectAttemptedRef.current) {
          console.warn('⚠️ Safety redirect triggered - redirecting to user profile');
          redirectBasedOnRole('user');
        }
      }, 3000);
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [isSigninComplete, isSignupComplete, location.pathname, isLoaded, user, redirectBasedOnRole]);

  // If user is already signed in, redirect based on role
  useEffect(() => {
    if (isLoaded && user && !redirectAttemptedRef.current) {
      if (isSigninComplete || isSignupComplete) {
        // For signin completion, check Clerk metadata first, then backend
        if (isSigninComplete) {
          const role = user.publicMetadata?.role;
          if (role) {
            // Role found in metadata, redirect immediately
            redirectBasedOnRole(role);
          } else {
            // If no role in metadata, fetch from backend with timeout
            const fetchAndRedirect = async () => {
              try {
                // Wait a bit for Clerk session to be fully established
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const response = await userAPI.sync();
                
                if (response.data?.success) {
                  const userRole = response.data.data?.user?.role || response.data.data?.vendor?.role || 'user';
                  redirectBasedOnRole(userRole);
                } else {
                  // Fallback: redirect to user profile if sync fails
                  console.warn('⚠️ Sync response not successful, redirecting to default user profile');
                  redirectBasedOnRole('user');
                }
              } catch (error) {
                console.error('❌ Error fetching user role:', error);
                // CRITICAL: Always redirect even if API fails
                redirectBasedOnRole('user');
              }
            };
            
            // Start fetching immediately
            fetchAndRedirect();
          }
        } else if (isSignupComplete) {
          // For signup completion, check sessionStorage for selected role
          const selectedRole = sessionStorage.getItem('selectedRole');
          if (selectedRole) {
            redirectBasedOnRole(selectedRole);
          } else {
            // Fallback: check backend
            const fetchAndRedirect = async () => {
              try {
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const response = await userAPI.sync();
                
                if (response.data?.success) {
                  const userRole = response.data.data?.user?.role || response.data.data?.vendor?.role || 'user';
                  redirectBasedOnRole(userRole);
                } else {
                  redirectBasedOnRole('user');
                }
              } catch (error) {
                console.error('Error fetching user role:', error);
                redirectBasedOnRole('user');
              }
            };
            
            fetchAndRedirect();
          }
        }
      }
    }
  }, [user, isLoaded, isSigninComplete, isSignupComplete, redirectBasedOnRole]);

  // Handle role setting after signup - check for newly signed up user
  useEffect(() => {
    if (isLoaded && user && isSignupComplete && !redirectAttemptedRef.current) {
      // Get role from sessionStorage (set when role was selected)
      const role = sessionStorage.getItem('selectedRole') || selectedRole;
      
      if (role) {
        // Sync user with backend to set role
        const syncUser = async (retryCount = 0) => {
          try {
            // Wait for Clerk session to be available
            if (typeof window === 'undefined' || !window.Clerk?.session) {
              if (retryCount < 10) {
                console.log(`⏳ Waiting for Clerk session (attempt ${retryCount + 1}/10)...`);
                setTimeout(() => syncUser(retryCount + 1), 300);
                return;
              } else {
                throw new Error('Clerk session not available');
              }
            }
            
            let response;
            
            // For vendors, use vendor sync endpoint instead of user sync
            if (role === 'vendor') {
              response = await vendorAPI.sync();
            } else {
              // For users and admins, use user sync endpoint
              response = await userAPI.sync(role);
            }
            
            if (response.data?.success) {
              console.log('✅ User synced with role:', role, response.data);
            }
            
            // Clear sessionStorage
            sessionStorage.removeItem('selectedRole');
            
            // Add small delay for vendor to ensure backend is ready
            if (role === 'vendor') {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Redirect based on role
            redirectBasedOnRole(role);
          } catch (error) {
            console.error('❌ Error syncing user:', error);
            // Still redirect based on selected role
            const roleFromStorage = sessionStorage.getItem('selectedRole') || selectedRole;
            sessionStorage.removeItem('selectedRole');
            if (roleFromStorage) {
              redirectBasedOnRole(roleFromStorage);
            } else {
              // Default to user profile if no role found
              redirectBasedOnRole('user');
            }
          }
        };
        
        // Small delay to ensure Clerk session is fully established
        setTimeout(() => {
          syncUser();
        }, 500);
      } else if (isSignupComplete) {
        // If no role selected but on signup complete page, check backend
        const checkUserRole = async () => {
          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const response = await userAPI.sync();
            
            if (response.data?.success) {
              const userRole = response.data.data?.user?.role || response.data.data?.vendor?.role || 'user';
              redirectBasedOnRole(userRole);
            } else {
              // Default to user profile if sync fails
              redirectBasedOnRole('user');
            }
          } catch (error) {
            console.error('Error checking user role:', error);
            redirectBasedOnRole('user');
          }
        };
        
        setTimeout(() => {
          checkUserRole();
        }, 500);
      }
    }
  }, [user, isLoaded, mode, isSignupComplete, selectedRole, redirectBasedOnRole]);

  // Check admin limit on component mount
  useEffect(() => {
    const checkAdminLimit = async () => {
      try {
        const response = await publicAPI.checkAdminLimit();
        
        if (response.data?.success) {
          setAdminLimitReached(!response.data.data.isAllowed);
        }
      } catch (error) {
        console.error('Error checking admin limit:', error);
        // On error, allow admin selection (fail open)
        setAdminLimitReached(false);
      } finally {
        setIsCheckingAdminLimit(false);
      }
    };
    
    checkAdminLimit();
  }, []);

  const handleRoleSelect = (role) => {
    if (role === 'admin' && adminLimitReached) {
      // Show error message
      alert('You are not authorized for this. Maximum admin limit (2) has been reached.');
      return;
    }
    
    setSelectedRole(role);
    // Store role in sessionStorage so backend can read it
    sessionStorage.setItem('selectedRole', role);
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  // If no role selected, show role selection cards
  if (!selectedRole) {
    const roleCards = [
      {
        role: 'user',
        icon: Users,
        title: 'User',
        description: 'Book events, manage your bookings, and explore our services',
        badge: 'For Customers',
        gradient: 'from-pink-500 to-red-500',
        bgGradient: 'from-pink-50 to-red-50',
        iconBg: 'bg-gradient-to-br from-pink-100 to-red-100',
        iconColor: 'text-pink-600',
        badgeBg: 'bg-gradient-to-r from-pink-50 to-red-50',
        badgeText: 'text-pink-700'
      },
      {
        role: 'vendor',
        icon: Briefcase,
        title: 'Vendor',
        description: 'Manage your services, bookings, and grow your business',
        badge: 'For Service Providers',
        gradient: 'from-purple-500 to-indigo-500',
        bgGradient: 'from-purple-50 to-indigo-50',
        iconBg: 'bg-gradient-to-br from-purple-100 to-indigo-100',
        iconColor: 'text-purple-600',
        badgeBg: 'bg-gradient-to-r from-purple-50 to-indigo-50',
        badgeText: 'text-purple-700'
      },
      {
        role: 'admin',
        icon: Shield,
        title: 'Admin',
        description: 'Manage users, vendors, bookings, and system settings',
        badge: adminLimitReached ? 'Registration Not Available' : 'For Administrators',
        gradient: 'from-gray-700 to-gray-900',
        bgGradient: 'from-gray-50 to-gray-100',
        iconBg: adminLimitReached ? 'bg-gray-400' : 'bg-gradient-to-br from-gray-700 to-gray-900',
        iconColor: 'text-white',
        badgeBg: adminLimitReached ? 'bg-red-100' : 'bg-gradient-to-r from-gray-100 to-gray-200',
        badgeText: adminLimitReached ? 'text-red-700' : 'text-gray-700',
        disabled: adminLimitReached
      }
    ];

    return (
      <div 
        className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4"
        style={{
          backgroundImage: `url('/heroImages/WhatsApp Image 2025-11-28 at 10.55.36.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/80 via-red-900/70 to-purple-900/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] animate-pulse"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <img 
                src="/heroImages/snapfest logo.png" 
                alt="SnapFest Logo" 
                className="h-16 w-auto object-contain filter drop-shadow-2xl"
              />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl"
            >
              {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl text-white/90 mb-2 font-medium drop-shadow-lg"
            >
              {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-lg text-white/80 mt-2 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-pink-300" />
              Select your role to continue
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roleCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.role}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    hover={!card.disabled}
                    className={`relative overflow-hidden cursor-pointer transform transition-all duration-300 ${
                      card.disabled 
                        ? 'cursor-not-allowed opacity-60' 
                        : 'hover:shadow-2xl'
                    } border-2 ${
                      card.disabled 
                        ? 'border-gray-400' 
                        : 'border-transparent hover:border-pink-300'
                    }`}
                    onClick={() => {
                      if (!card.disabled) {
                        handleRoleSelect(card.role);
                      } else {
                        alert('You are not authorized for this. Maximum admin limit (2) has been reached.');
                      }
                    }}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50`}></div>
                    
                    {/* Animated Border Gradient */}
                    {!card.disabled && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 hover:opacity-20 transition-opacity duration-300`}></div>
                    )}

                    <div className="relative z-10 text-center p-6">
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className={`w-20 h-20 ${card.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                      >
                        <Icon className={`w-10 h-10 ${card.iconColor}`} />
                      </motion.div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">
                        {card.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-6 leading-relaxed min-h-[3rem]">
                        {card.description}
                      </p>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`${card.badgeBg} ${card.badgeText} px-5 py-3 rounded-xl text-sm font-semibold shadow-md inline-flex items-center gap-2`}
                      >
                        {!card.disabled && <ArrowRight className="w-4 h-4" />}
                        {card.badge}
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // If role is selected, show Clerk SignIn/SignUp with role metadata
  const roleInfo = {
    user: {
      icon: Users,
      title: 'Customer',
      description: 'Join thousands of happy customers who trust SnapFest for their special moments.',
      gradient: 'from-pink-500 to-red-500'
    },
    vendor: {
      icon: Briefcase,
      title: 'Service Provider',
      description: 'Grow your business with SnapFest. Connect with customers and expand your reach.',
      gradient: 'from-purple-500 to-indigo-500'
    },
    admin: {
      icon: Shield,
      title: 'Administrator',
      description: 'Manage the platform and help create amazing experiences for everyone.',
      gradient: 'from-gray-700 to-gray-900'
    }
  };

  const currentRoleInfo = roleInfo[selectedRole] || roleInfo.user;
  const RoleIcon = currentRoleInfo.icon;

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Info */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          backgroundImage: `url('/heroImages/WhatsApp Image 2025-11-28 at 10.48.48.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentRoleInfo.gradient} opacity-90`}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleBack}
            className="self-start flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
          >
            <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Roles</span>
          </motion.button>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="mb-6">
                <img 
                  src="/heroImages/snapfest logo.png" 
                  alt="SnapFest Logo" 
                  className="h-16 w-auto object-contain filter drop-shadow-2xl"
                />
              </div>
              <h1 className="text-5xl font-bold mb-4 drop-shadow-2xl">
                {mode === 'signin' ? 'Welcome Back!' : 'Join SnapFest'}
              </h1>
              <p className="text-xl text-white/90 leading-relaxed drop-shadow-lg">
                {mode === 'signin' 
                  ? 'Continue your journey with us and manage your bookings seamlessly.'
                  : 'Start your journey with SnapFest and create unforgettable memories.'
                }
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center`}>
                  <RoleIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Signing up as {currentRoleInfo.title}</h3>
                  <p className="text-white/80 text-sm">{currentRoleInfo.description}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-2 text-white/80"
            >
              <Sparkles className="w-5 h-5 text-pink-300" />
              <span className="text-sm">Trusted by thousands of users worldwide</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-pink-50 via-white to-red-50">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="relative overflow-hidden border-0 shadow-2xl">
            {/* Glassmorphism Effect */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl"></div>
            
            {/* Gradient Accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentRoleInfo.gradient}`}></div>

            <div className="relative z-10">
              {/* Mobile Back Button */}
              <button
                onClick={handleBack}
                className="lg:hidden absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors z-20 flex items-center gap-2"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                <span className="text-sm font-medium">Back</span>
              </button>

              {/* Mobile Header */}
              <div className="lg:hidden text-center mb-6 pt-4">
                <div className="mb-4">
                  <img 
                    src="/heroImages/snapfest logo.png" 
                    alt="SnapFest Logo" 
                    className="h-12 w-auto object-contain mx-auto"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {mode === 'signin' 
                    ? 'Sign in to your account'
                    : 'Create your account as ' + currentRoleInfo.title
                  }
                </p>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block text-center mb-8 pt-8">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
                    {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                  </h2>
                  <p className="text-gray-600">
                    {mode === 'signin' 
                      ? 'Enter your credentials to access your account'
                      : 'Complete your registration to get started'
                    }
                  </p>
                </motion.div>
              </div>

              {/* Clerk Form */}
              <div className="px-6 pb-6">
                <AnimatePresence mode="wait">
                  {mode === 'signin' ? (
                    <motion.div
                      key="signin"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SignIn
                        routing="path"
                        path="/sign-in"
                        fallbackRedirectUrl="/sign-in/complete"
                        afterSignInUrl="/sign-in/complete"
                        appearance={{
                          elements: {
                            rootBox: "w-full",
                            card: "shadow-none border-0 bg-transparent",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            socialButtonsBlockButton: "bg-white border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all duration-300",
                            formButtonPrimary: "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300",
                            formFieldInput: "border-gray-200 focus:border-pink-500 focus:ring-pink-500 transition-all duration-300",
                            footerActionLink: "text-pink-600 hover:text-pink-700 font-semibold",
                            identityPreviewText: "text-gray-700",
                            identityPreviewEditButton: "text-pink-600 hover:text-pink-700"
                          },
                          variables: {
                            colorPrimary: "#ec4899",
                            colorText: "#1f2937",
                            colorTextSecondary: "#6b7280",
                            colorBackground: "#ffffff",
                            colorInputBackground: "#ffffff",
                            colorInputText: "#1f2937"
                          }
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SignUp
                        routing="path"
                        path="/sign-up"
                        fallbackRedirectUrl="/sign-up/complete"
                        afterSignUpUrl="/sign-up/complete"
                        appearance={{
                          elements: {
                            rootBox: "w-full",
                            card: "shadow-none border-0 bg-transparent",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            socialButtonsBlockButton: "bg-white border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all duration-300",
                            formButtonPrimary: "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300",
                            formFieldInput: "border-gray-200 focus:border-pink-500 focus:ring-pink-500 transition-all duration-300",
                            // Enhanced error styling
                            formFieldErrorText: "text-red-600 text-sm mt-2 font-medium bg-red-50 border-l-4 border-red-500 pl-3 py-2 rounded-r",
                            formFieldError: "mb-3",
                            formFieldInput__password: "border-gray-200 focus:border-pink-500 focus:ring-pink-500",
                            footerActionLink: "text-pink-600 hover:text-pink-700 font-semibold",
                            identityPreviewText: "text-gray-700",
                            identityPreviewEditButton: "text-pink-600 hover:text-pink-700"
                          },
                          variables: {
                            colorPrimary: "#ec4899",
                            colorText: "#1f2937",
                            colorTextSecondary: "#6b7280",
                            colorBackground: "#ffffff",
                            colorInputBackground: "#ffffff",
                            colorInputText: "#1f2937",
                            colorDanger: "#dc2626"
                          }
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RoleBasedAuth;

