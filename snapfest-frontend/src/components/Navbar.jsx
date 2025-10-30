import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useClerk, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Menu, X, User, LogOut, Settings, Package, Calendar, Home, Camera, Heart, ShoppingCart } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsProfileOpen(false);
  };

  const getDashboardLink = () => {
    switch (user?.publicMetadata?.role) {
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
    switch (user?.publicMetadata?.role) {
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
    switch (user?.publicMetadata?.role) {
      case 'admin':
        return 'Admin';
      case 'vendor':
        return 'Vendor';
      case 'user':
        return 'User';
      default:
        return 'Guest';
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Professional Style */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">SnapFest</span>
          </Link>

          {/* Desktop Navigation - Professional Style */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Home
            </Link>
            <Link
              to="/packages"
              className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300"
            >
              Packages
            </Link>
            <Link
              to="/events"
              className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300"
            >
              Events
            </Link>
            <Link
              to="/venues"
              className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300"
            >
              Venues
            </Link>
            <Link
              to="/about"
              className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="px-4 py-2 rounded-lg text-gray-700 hover:bg-pink-50 hover:text-pink-600 text-sm font-medium transition-all duration-300"
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
          </div>

          {/* Desktop Auth Section - Professional Style */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-all duration-300 hover:scale-105 bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-pink-100"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-xs">{user?.firstName || 'User'}</div>
                    <div className="text-xs text-pink-600 font-medium">
                      {getRoleDisplayName()}
                    </div>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-primary-100 py-2 z-50">
                    {(user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'vendor') && (
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Home className="w-4 h-4 mr-3 text-primary-500" />
                        Dashboard
                      </Link>
                    )}
                    <Link
                      to={getProfileLink()}
                      className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3 text-primary-500" />
                      Profile
                    </Link>
                    {user?.publicMetadata?.role === 'user' && (
                      <>
                        <Link
                          to="/user/bookings"
                          className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Calendar className="w-4 h-4 mr-3 text-primary-500" />
                          Bookings
                        </Link>
                        <Link
                          to="/user/payments"
                          className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Package className="w-4 h-4 mr-3 text-primary-500" />
                          Payments
                        </Link>
                      </>
                    )}
                    <div className="border-t border-primary-100 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-secondary-600 hover:bg-gradient-to-r hover:from-secondary-50 hover:to-red-50 transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-4 pb-6 space-y-2 bg-gradient-to-br from-white to-pearl-50 rounded-2xl mx-2 mb-4 shadow-xl border border-primary-100">
              <Link
                to="/"
                className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-5 h-5 mr-3 text-primary-500" />
                Home
              </Link>
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
                <>
                  <Link
                    to="/cart"
                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-300 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="w-5 h-5 mr-3 text-primary-500" />
                    Cart
                  </Link>
                  <div className="border-t border-primary-100 my-2"></div>
                  {(user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'vendor') && (
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
                  {user?.publicMetadata?.role === 'user' && (
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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;