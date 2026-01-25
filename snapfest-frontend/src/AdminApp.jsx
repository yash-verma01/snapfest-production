import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Auth handled by Clerk
import { SignedIn, SignedOut, RedirectToSignIn, useUser, useAuth } from '@clerk/clerk-react';
import { userAPI, setupAuthToken } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import PortGuard from './components/PortGuard';
import LoadingSpinner from './components/LoadingSpinner';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Admin Pages only - Lazy loaded
import { SignIn, SignUp } from '@clerk/clerk-react';
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

// Guard: Only allow admins inside the admin app
function AdminGuard({ children }) {
  const { user, isLoaded } = useUser();
  
  // Wait for user data to load before checking admin status
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin/dashboard" />
      </SignedOut>
      <SignedIn>
        {user?.publicMetadata?.role === 'admin' ? (
          children
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
              <p className="text-sm text-gray-500">
                Only users with admin role can access the admin panel.<br />
                Please contact an administrator if you believe this is an error.
              </p>
              <button
                onClick={() => window.location.href = '/sign-in'}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        )}
      </SignedIn>
    </>
  );
}

function AdminApp() {
  // Sync Clerk user to backend on sign-in
  // This ensures the backend knows about the user and can check admin status
  const { isSignedIn, getToken } = useAuth();
  
  // Setup token getter for axios interceptor - CRITICAL: Must happen first
  useEffect(() => {
    if (getToken && typeof getToken === 'function') {
      setupAuthToken(getToken);
      console.log('✅ AdminApp: Token getter set up');
    } else {
      console.warn('⚠️ AdminApp: getToken not available yet');
    }
  }, [getToken]);
  
  useEffect(() => {
    const setupAndSync = async (retryCount = 0) => {
      if (!isSignedIn || !getToken) return;
      
      // CRITICAL: Wait for Clerk session to be fully ready
      if (typeof window === 'undefined' || !window.Clerk?.session) {
        if (retryCount < 10) {
          console.log(`⏳ AdminApp: Waiting for Clerk session (attempt ${retryCount + 1}/10)...`);
          setTimeout(() => setupAndSync(retryCount + 1), 300);
          return;
        } else {
          console.error('❌ AdminApp: Clerk session not available after 10 attempts');
          return;
        }
      }
      
      // Setup token getter
      if (getToken && typeof getToken === 'function') {
        setupAuthToken(getToken);
      }
      
      // Verify token is available before proceeding
      try {
        const token = await window.Clerk.session.getToken();
        if (!token) {
          if (retryCount < 5) {
            console.warn(`⚠️ AdminApp: Token not available yet, retrying... (${retryCount + 1}/5)`);
            setTimeout(() => setupAndSync(retryCount + 1), 500);
            return;
          } else {
            console.error('❌ AdminApp: Token not available after retries');
            return;
          }
        }
        
        console.log('✅ AdminApp: Token verified, proceeding with sync');
        
        // Now safe to make API calls
        await userAPI.sync('admin');
        console.log('✅ Admin user synced with backend');
      } catch (e) {
        // Non-blocking - log error but don't prevent app from loading
        console.error('❌ AdminApp: Setup/sync failed:', {
          error: e.message,
          status: e.response?.status,
          data: e.response?.data,
          retryCount
        });
        
        // Retry once if it's a 401 and we haven't retried yet
        if (e.response?.status === 401 && retryCount === 0) {
          console.log('🔄 Retrying admin sync after 1 second...');
          setTimeout(() => setupAndSync(1), 1000);
        }
      }
    };
    
    // Small delay to ensure Clerk session cookie is fully established
    const timeoutId = setTimeout(() => {
      setupAndSync();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [isSignedIn, getToken]);
  
  return (
    <ErrorBoundary>
        <Router>
          <ScrollToTop />
          <PortGuard>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              
              <main className="min-h-screen">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Root redirect for admins */}
                  <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/sign-in/*" element={<SignIn />} />
                  <Route path="/sign-up/*" element={<SignUp />} />
                  
                  {/* Handle Clerk's /register routes - redirect to /sign-up for consistency */}
                  <Route path="/register" element={<Navigate to="/sign-up" replace />} />
                  <Route path="/register/*" element={<Navigate to="/sign-up" replace />} />
                  
                  {/* Protected Routes - Admin Only */}
                  <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                  <Route path="/admin/profile" element={<AdminGuard><AdminProfile /></AdminGuard>} />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
          </main>
          
          <Footer />
          </div>
          </PortGuard>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
    </ErrorBoundary>
  );
}

export default AdminApp;
