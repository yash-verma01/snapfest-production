import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useClerk, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Menu as MenuIcon, X, User, LogOut, Settings, Package, Calendar, Home, Camera, Heart, ShoppingCart, Star } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [backendUserName, setBackendUserName] = useState(null);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // Fetch user role from backend if not in Clerk metadata
  useEffect(() => {
    if (isLoaded && user) {
      // CRITICAL FIX: Check sessionStorage first (during signup)
      // This ensures correct menu is shown immediately during registration
      const selectedRole = sessionStorage.getItem('selectedRole');
      
      // If we have a selected role in sessionStorage, use it immediately
      if (selectedRole && ['user', 'vendor', 'admin'].includes(selectedRole)) {
        setUserRole(selectedRole);
        
        // Also sync with backend using the role parameter to ensure consistency
        const syncWithRole = async () => {
          try {
            const response = await fetch(`http://localhost:5001/api/users/sync?role=${selectedRole}`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              const role = data.data?.user?.role || data.data?.vendor?.role || selectedRole;
              setUserRole(role);
            }
          } catch (error) {
            console.error('Error syncing user role:', error);
            // Keep the selectedRole as fallback - don't change to 'user'
          }
        };
        
        syncWithRole();
        return; // Don't proceed with default sync
      }
      
      // If Clerk metadata has role, use it
      if (user.publicMetadata?.role) {
        setUserRole(user.publicMetadata.role);
        return;
      }
      
      // Otherwise, fetch from backend (but don't default to 'user' immediately)
      const fetchUserRole = async () => {
        try {
          const response = await fetch('http://localhost:5001/api/users/sync', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const role = data.data?.user?.role || data.data?.vendor?.role;
            if (role) {
              setUserRole(role);
            }
            // Don't default to 'user' - let it stay null until we know for sure
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          // Don't default to 'user' - let it stay null
        }
      };
      
      fetchUserRole();
    }
  }, [user, isLoaded]);

  // CRITICAL FIX: Add another useEffect to watch for Clerk metadata changes
  // This ensures Navbar updates immediately when Clerk metadata is updated
  useEffect(() => {
    if (user?.publicMetadata?.role) {
      setUserRole(user.publicMetadata.role);
      // Clear sessionStorage if metadata is now set (signup complete)
      if (sessionStorage.getItem('selectedRole')) {
        sessionStorage.removeItem('selectedRole');
      }
    }
  }, [user?.publicMetadata?.role]);

  // Fetch backend profile name to display in navbar
  useEffect(() => {
    const fetchBackendProfile = async () => {
      if (isLoaded && user) {
        try {
          const response = await fetch('http://localhost:5001/api/users/profile', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const userName = data.data?.user?.name;
            if (userName) {
              setBackendUserName(userName);
            }
          }
        } catch (error) {
          console.error('Error fetching backend profile:', error);
          // Silently fail - will use Clerk fallback
        }
      }
    };
    
    fetchBackendProfile();
  }, [user, isLoaded]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Get role from sessionStorage (during signup) > Clerk metadata > backend > default
  // CRITICAL FIX: Check sessionStorage first to show correct menu immediately during signup
  const selectedRoleFromStorage = sessionStorage.getItem('selectedRole');
  const currentRole = selectedRoleFromStorage || user?.publicMetadata?.role || userRole || 'user';

  const getDashboardLink = () => {
    switch (currentRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'vendor':
        return '/vendor/dashboard';
      case 'user':
        return '/user/profile';
      default:
        return '/';
    }
  };

  const getProfileLink = () => {
    switch (currentRole) {
      case 'admin':
        return '/admin/profile';
      case 'vendor':
        return '/vendor/profile';
      case 'user':
        return '/user/profile';
      default:
        return '/user/profile';
    }
  };

  const getRoleDisplayName = () => {
    switch (currentRole) {
      case 'admin':
        return 'Admin';
      case 'vendor':
        return 'Vendor';
      case 'user':
        return 'User';
      default:
        return 'User';
    }
  };

  // Check if current user is admin - hide browsing features in admin UI
  const isAdmin = currentRole === 'admin';
  // Check if current user is vendor - hide browsing features in vendor UI (same as admin)
  const isVendor = currentRole === 'vendor';

  return (
    <nav className="bg-white/95 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-pink-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Professional Style */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/heroImages/snapfest logo.png" 
              alt="SnapFest Logo" 
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent group-hover:from-pink-700 group-hover:to-red-700 transition-all duration-300">
              SnapFest
            </span>
          </Link>

          {/* Desktop Navigation - Professional Style */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Home
            </Link>
            {/* Removed packages/events/venue/about/contact/cart links for admin and vendor UI */}
            {!isAdmin && !isVendor && (
              <>
                <Link
                  to="/packages"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  Packages
                </Link>
                <Link
                  to="/events"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  Events
                </Link>
                <Link
                  to="/gallery"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  Gallery
                </Link>
                <Link
                  to="/reviews"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  Reviews
                </Link>
                <Link
                  to="/venues"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  Venues
                </Link>
                <Link
                  to="/about"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  Contact
                </Link>
                {user && (
                  <Link
                    to="/cart"
                    className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300 flex items-center space-x-1"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Cart</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Desktop Auth Section - Professional Style */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <Menu as="div" className="relative">
                {({ open }) => (
                  <>
                    <Menu.Button className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-all duration-300 hover:scale-105 bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-xs">
                          {(() => {
                            // Extract first name from backend name if it exists
                            if (backendUserName) {
                              return backendUserName.split(' ')[0];
                            }
                            // Use Clerk firstName if available
                            if (user?.firstName) {
                              return user.firstName;
                            }
                            // Extract first name from fullName if available
                            if (user?.fullName) {
                              return user.fullName.split(' ')[0];
                            }
                            return 'User';
                          })()}
                        </div>
                        <div className="text-xs text-pink-600 font-medium">
                          {getRoleDisplayName()}
                        </div>
                      </div>
                    </Menu.Button>

                    <Transition
                      show={open}
                      as={React.Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 scale-95 translate-y-[-10px]"
                      enterTo="opacity-100 scale-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 scale-100 translate-y-0"
                      leaveTo="opacity-0 scale-95 translate-y-[-10px]"
                    >
                      <Menu.Items
                        static
                        className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-primary-100 py-2 z-50 focus:outline-none overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {(currentRole === 'admin' || currentRole === 'vendor') && (
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to={getDashboardLink()}
                                  className={`flex items-center px-4 py-3 text-sm transition-all duration-200 ${
                                    active
                                      ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700'
                                      : 'text-neutral-700'
                                  }`}
                                >
                                  <Home className="w-4 h-4 mr-3 text-primary-500" />
                                  Dashboard
                                </Link>
                              )}
                            </Menu.Item>
                          )}
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to={getProfileLink()}
                                className={`flex items-center px-4 py-3 text-sm transition-all duration-200 ${
                                  active
                                    ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700'
                                    : 'text-neutral-700'
                                }`}
                              >
                                <Settings className="w-4 h-4 mr-3 text-primary-500" />
                                Profile
                              </Link>
                            )}
                          </Menu.Item>
                          {currentRole === 'user' && (
                            <>
                              <Menu.Item>
                                {({ active }) => (
                                  <Link
                                    to="/user/bookings"
                                    className={`flex items-center px-4 py-3 text-sm transition-all duration-200 ${
                                      active
                                        ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700'
                                        : 'text-neutral-700'
                                    }`}
                                  >
                                    <Calendar className="w-4 h-4 mr-3 text-primary-500" />
                                    Bookings
                                  </Link>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <Link
                                    to="/user/payments"
                                    className={`flex items-center px-4 py-3 text-sm transition-all duration-200 ${
                                      active
                                        ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700'
                                        : 'text-neutral-700'
                                    }`}
                                  >
                                    <Package className="w-4 h-4 mr-3 text-primary-500" />
                                    Payments
                                  </Link>
                                )}
                              </Menu.Item>
                            </>
                          )}
                          <div className="border-t border-primary-100 my-2"></div>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={`flex items-center w-full px-4 py-3 text-sm transition-all duration-200 ${
                                  active
                                    ? 'bg-gradient-to-r from-secondary-50 to-red-50 text-red-600'
                                    : 'text-secondary-600'
                                }`}
                              >
                                <LogOut className="w-4 h-4 mr-3" />
                                Logout
                              </button>
                            )}
                          </Menu.Item>
                        </motion.div>
                      </Menu.Items>
                    </Transition>
                  </>
                )}
              </Menu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/sign-in"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/sign-up"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-neutral-700 hover:text-primary-600 transition-all duration-300 hover:scale-105 p-2 rounded-xl hover:bg-primary-50"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{ duration: 0.3 }}
                className="px-4 pt-4 pb-6 space-y-2 bg-gradient-to-br from-white to-pearl-50 rounded-2xl mx-2 mb-4 shadow-xl border border-primary-100"
              >
              <Link
                to="/"
                className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-5 h-5 mr-3 text-primary-500" />
                Home
              </Link>
              {/* Removed packages/events/venue/about/contact/cart links for admin and vendor UI */}
              {!isAdmin && !isVendor && (
                <>
                  <Link
                    to="/packages"
                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Package className="w-5 h-5 mr-3 text-primary-500" />
                    Packages
                  </Link>
                  <Link
                    to="/events"
                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="w-5 h-5 mr-3 text-primary-500" />
                    Events
                  </Link>
                  <Link
                    to="/gallery"
                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Camera className="w-5 h-5 mr-3 text-primary-500" />
                    Gallery
                  </Link>
                  <Link
                    to="/reviews"
                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Star className="w-5 h-5 mr-3 text-primary-500" />
                    Reviews
                  </Link>
                  <Link
                    to="/venues"
                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5 mr-3 text-primary-500" />
                    Venues
                  </Link>
                  <Link
                    to="/about"
                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="w-5 h-5 mr-3 text-primary-500 font-bold text-lg">i</span>
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="w-5 h-5 mr-3 text-primary-500 font-bold text-lg">@</span>
                    Contact
                  </Link>
                  {user && (
                    <Link
                      to="/cart"
                      className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingCart className="w-5 h-5 mr-3 text-primary-500" />
                      Cart
                    </Link>
                  )}
                </>
              )}
              {user && (
                <>
                  <div className="border-t border-primary-100 my-2"></div>
                  {(currentRole === 'admin' || currentRole === 'vendor') && (
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Home className="w-5 h-5 mr-3 text-primary-500" />
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to={getProfileLink()}
                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5 mr-3 text-primary-500" />
                    Profile
                  </Link>
                  {currentRole === 'user' && (
                    <>
                      <Link
                        to="/user/bookings"
                        className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Calendar className="w-5 h-5 mr-3 text-primary-500" />
                        Bookings
                      </Link>
                      <Link
                        to="/user/payments"
                        className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Package className="w-5 h-5 mr-3 text-primary-500" />
                        Payments
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-secondary-600 hover:bg-gradient-to-r hover:from-secondary-50 hover:to-red-50 transition-all duration-300 rounded-xl"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                </>
              )}
              {!user && (
                <>
                  <div className="border-t border-primary-100 my-2"></div>
                  <Link
                    to="/sign-in"
                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5 mr-3 text-primary-500" />
                    Login
                  </Link>
                  <Link
                    to="/sign-up"
                    className="flex items-center px-4 py-3 text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-300 rounded-xl font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="w-5 h-5 mr-3">+</span>
                    Register
                  </Link>
                </>
              )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;