import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignedIn, SignedOut, RedirectToSignIn, useUser, useAuth } from '@clerk/clerk-react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { vendorAPI } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';

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
  const { user, isLoaded } = useUser(); // Changed from useAuth()
  
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
  
  if (user?.publicMetadata?.role === 'vendor') {
    return <Navigate to="/vendor/dashboard" replace />;
  }
  
  return <Navigate to="/sign-in" replace />; // Changed from /login
}

function VendorApp() {
  // Sync Clerk vendor to backend on sign-in
  const { isSignedIn } = useAuth();
  
  useEffect(() => {
    const sync = async () => {
      if (!isSignedIn) return;
      
      try {
        await vendorAPI.sync();
        console.log('✅ Vendor synced with backend via cookie session');
      } catch (e) {
        console.warn('⚠️ Vendor sync failed (non-blocking):', e.message);
      }
    };
    
    const timeoutId = setTimeout(() => {
      sync();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [isSignedIn]);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <main className="min-h-screen">
          <Routes>
            {/* Root redirect for vendors */}
            <Route path="/" element={<VendorRootRedirect />} />
            
            {/* Clerk auth routes */}
            <Route path="/sign-in/*" element={<SignIn />} />
            <Route path="/sign-up/*" element={<SignUp />} />
            
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
      </div>
      </Router>
    </ErrorBoundary>
  );
}

export default VendorApp;
