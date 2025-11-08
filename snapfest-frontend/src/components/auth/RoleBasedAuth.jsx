import React, { useState, useEffect } from 'react';
import { SignIn, SignUp, useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../ui/Card';
import { userAPI } from '../../services/api';

const RoleBasedAuth = ({ mode = 'signin' }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  // Check if we're on the signup/signin completion page
  const isSignupComplete = location.pathname === '/sign-up/complete';
  const isSigninComplete = location.pathname === '/sign-in/complete';

  // If user is already signed in, redirect based on role
  useEffect(() => {
    if (isLoaded && user) {
      if (isSigninComplete || isSignupComplete) {
        // For signin completion, check Clerk metadata first, then backend
        if (isSigninComplete) {
          const role = user.publicMetadata?.role;
          if (role) {
            redirectBasedOnRole(role);
          } else {
            // If no role in metadata, fetch from backend
            const fetchAndRedirect = async () => {
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
                  const userRole = data.data?.user?.role || data.data?.vendor?.role || 'user';
                  redirectBasedOnRole(userRole);
                } else {
                  redirectBasedOnRole('user');
                }
              } catch (error) {
                console.error('Error fetching user role:', error);
                redirectBasedOnRole('user');
              }
            };
            
            setTimeout(() => {
              fetchAndRedirect();
            }, 500);
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
                const response = await fetch('http://localhost:5001/api/users/sync', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                
                if (response.ok) {
                  const data = await response.json();
                  const userRole = data.data?.user?.role || data.data?.vendor?.role || 'user';
                  redirectBasedOnRole(userRole);
                } else {
                  redirectBasedOnRole('user');
                }
              } catch (error) {
                console.error('Error fetching user role:', error);
                redirectBasedOnRole('user');
              }
            };
            
            setTimeout(() => {
              fetchAndRedirect();
            }, 500);
          }
        }
      }
    }
  }, [user, isLoaded, isSigninComplete, isSignupComplete]);

  // Handle role setting after signup - check for newly signed up user
  useEffect(() => {
    if (isLoaded && user && isSignupComplete) {
      // Get role from sessionStorage (set when role was selected)
      const role = sessionStorage.getItem('selectedRole') || selectedRole;
      
      if (role) {
        // Sync user with backend to set role
        const syncUser = async () => {
          try {
            // Call backend sync endpoint with role query parameter
            const response = await fetch(`http://localhost:5001/api/users/sync?role=${role}`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('User synced with role:', role, data);
              
              // Update Clerk metadata if possible (this requires backend webhook in production)
              // For now, we'll rely on the database role
            }
            
            // Clear sessionStorage
            sessionStorage.removeItem('selectedRole');
            
            // Redirect immediately based on role
            redirectBasedOnRole(role);
          } catch (error) {
            console.error('Error syncing user:', error);
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
            const response = await fetch('http://localhost:5001/api/users/sync', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              const userRole = data.data?.user?.role || data.data?.vendor?.role || 'user';
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
  }, [user, isLoaded, mode, isSignupComplete, selectedRole]);

  const redirectBasedOnRole = (role) => {
    const from = location.state?.from?.pathname || '/';
    
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
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Store role in sessionStorage so backend can read it
    sessionStorage.setItem('selectedRole', role);
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  // If no role selected, show role selection cards
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
            </h1>
            <p className="text-gray-600 text-lg">
              {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
            </p>
            <p className="text-gray-500 mt-2">Select your role to continue</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Card */}
            <Card
              hover
              className="cursor-pointer transform transition-all duration-300 hover:scale-105"
              onClick={() => handleRoleSelect('user')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">User</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Book events, manage your bookings, and explore our services
                </p>
                <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm font-medium">
                  For Customers
                </div>
              </div>
            </Card>

            {/* Vendor Card */}
            <Card
              hover
              className="cursor-pointer transform transition-all duration-300 hover:scale-105"
              onClick={() => handleRoleSelect('vendor')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Vendor</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage your services, bookings, and grow your business
                </p>
                <div className="bg-accent-50 text-accent-700 px-4 py-2 rounded-lg text-sm font-medium">
                  For Service Providers
                </div>
              </div>
            </Card>

            {/* Admin Card */}
            <Card
              hover
              className="cursor-pointer transform transition-all duration-300 hover:scale-105"
              onClick={() => handleRoleSelect('admin')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage users, vendors, bookings, and system settings
                </p>
                <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                  For Administrators
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If role is selected, show Clerk SignIn/SignUp with role metadata
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="relative">
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'signin' ? 'Sign In' : 'Sign Up'} as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </h2>
            <p className="text-gray-600 text-sm">
              {mode === 'signin' 
                ? 'Enter your credentials to access your account'
                : 'Create your account to get started'
              }
            </p>
          </div>

          <div className="mt-4">
            {mode === 'signin' ? (
              <SignIn
                routing="path"
                path="/sign-in"
                afterSignInUrl="/sign-in/complete"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0",
                  }
                }}
              />
            ) : (
              <SignUp
                routing="path"
                path="/sign-up"
                afterSignUpUrl="/sign-up/complete"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0",
                  }
                }}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RoleBasedAuth;

