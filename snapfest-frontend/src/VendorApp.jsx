import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignedIn, SignedOut, RedirectToSignIn, useUser, useAuth } from '@clerk/clerk-react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { vendorAPI, setupAuthToken } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import PortGuard from './components/PortGuard';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Packages from './pages/Packages';
import PackageDetail from './pages/PackageDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Contact from './pages/Contact';
import Venues from './pages/Venues';
import VenueDetail from './pages/VenueDetail';
import VendorDashboard from './pages/VendorDashboard';
import VendorBookings from './pages/VendorBookings';
import VendorEarnings from './pages/VendorEarnings';
import VendorSettings from './pages/VendorSettings';
import VendorProfileNew from './pages/VendorProfileNew';
import NotFound from './pages/NotFound';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

// Component to handle root redirect for vendors
function VendorRootRedirect() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  
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
  
  // If signed in and on vendor port (3001), redirect to vendor dashboard
  // Even if role isn't set yet, being on port 3001 means they're a vendor
  if (isSignedIn) {
    // Wait a moment for sync to complete and role to be set
    const role = user?.publicMetadata?.role;
    if (role === 'vendor' || window.location.port === '3001') {
      return <Navigate to="/vendor/dashboard" replace />;
    }
  }
  
  return <Navigate to="/sign-in" replace />;
}

function VendorApp() {
  // Sync Clerk vendor to backend on sign-in
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  
  // Setup token getter for axios interceptor - CRITICAL: Must happen first
  useEffect(() => {
    if (getToken && typeof getToken === 'function') {
      setupAuthToken(getToken);
      console.log('✅ VendorApp: Token getter set up');
    } else {
      console.warn('⚠️ VendorApp: getToken not available yet');
    }
  }, [getToken]);
  
  useEffect(() => {
    const setupAndSync = async (retryCount = 0) => {
      if (!isSignedIn || !getToken) return;
      
      // CRITICAL: Wait for Clerk session to be fully ready
      if (typeof window === 'undefined' || !window.Clerk?.session) {
        if (retryCount < 10) {
          console.log(`⏳ VendorApp: Waiting for Clerk session (attempt ${retryCount + 1}/10)...`);
          setTimeout(() => setupAndSync(retryCount + 1), 300);
          return;
        } else {
          console.error('❌ VendorApp: Clerk session not available after 10 attempts');
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
            console.warn(`⚠️ VendorApp: Token not available yet, retrying... (${retryCount + 1}/5)`);
            setTimeout(() => setupAndSync(retryCount + 1), 500);
            return;
          } else {
            console.error('❌ VendorApp: Token not available after retries');
            return;
          }
        }
        
        console.log('✅ VendorApp: Token verified, proceeding with sync');
        
        // Now safe to make API calls
        console.log('🔄 VendorApp: Calling vendorAPI.sync()...');
        await vendorAPI.sync();
        console.log('✅ Vendor synced with backend');
      } catch (e) {
        console.error('❌ Vendor sync failed:', {
          error: e.message,
          status: e.response?.status,
          data: e.response?.data,
          retryCount
        });
        
        // Retry once if it's a 401 and we haven't retried yet
        if (e.response?.status === 401 && retryCount === 0) {
          console.log('🔄 Retrying vendor sync after 1 second...');
          setTimeout(() => setupAndSync(1), 1000);
        }
      }
    };
    
    // Small delay to ensure Clerk session cookie is fully established
    const timeoutId = setTimeout(() => {
      setupAndSync();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [isSignedIn, getToken, user]);

  return (
    <ErrorBoundary>
      <Router>
        <PortGuard>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <main className="min-h-screen">
            <Routes>
            {/* Root redirect for vendors */}
            <Route path="/" element={<VendorRootRedirect />} />
            
            {/* Clerk auth routes */}
            <Route path="/sign-in/*" element={<SignIn />} />
            <Route path="/sign-up/*" element={<SignUp />} />
            
            {/* Handle Clerk's /register routes - redirect to /sign-up for consistency */}
            <Route path="/register" element={<Navigate to="/sign-up" replace />} />
            <Route path="/register/*" element={<Navigate to="/sign-up" replace />} />
            
            {/* Public routes */}
            <Route path="/packages" element={<Packages />} />
            <Route path="/packages/:id" element={<PackageDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venues/:id" element={<VenueDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Protected Routes - Vendor Only */}
            <Route path="/vendor/dashboard" element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/vendor/profile" element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorProfileNew />
              </ProtectedRoute>
            } />
            <Route path="/vendor/bookings" element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorBookings />
              </ProtectedRoute>
            } />
            <Route path="/vendor/earnings" element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorEarnings />
              </ProtectedRoute>
            } />
            <Route path="/vendor/settings" element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorSettings />
              </ProtectedRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
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

export default VendorApp;
