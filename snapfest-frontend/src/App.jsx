import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignIn, SignUp, RedirectToSignIn, SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react';
import RoleBasedAuth from './components/auth/RoleBasedAuth';
import { userAPI } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Lazy load all pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Packages = lazy(() => import('./pages/Packages'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Reviews = lazy(() => import('./pages/Reviews'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Venues = lazy(() => import('./pages/Venues'));
const VenueDetail = lazy(() => import('./pages/VenueDetail'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const VendorBookings = lazy(() => import('./pages/VendorBookings'));
const VendorEarnings = lazy(() => import('./pages/VendorEarnings'));
const VendorSettings = lazy(() => import('./pages/VendorSettings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));
const Profile = lazy(() => import('./pages/Profile'));
const VendorProfileNew = lazy(() => import('./pages/VendorProfileNew'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Payments = lazy(() => import('./pages/Payments'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PackageDetail = lazy(() => import('./pages/PackageDetail'));
const BeatBloom = lazy(() => import('./pages/BeatBloom'));
const BeatBloomDetail = lazy(() => import('./pages/BeatBloomDetail'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  // Sync Clerk user to backend on sign-in
  // NOTE: Switched to cookie-based sessions - no JWT tokens needed
  // The browser automatically sends session cookies with requests (withCredentials: true in api.js)
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  
  useEffect(() => {
    const sync = async () => {
      if (!isSignedIn) return;
      
      // Skip sync for vendors and admins - let VendorApp/AdminApp handle their sync
      // This prevents race conditions where user is created with wrong role
      const userRole = user?.publicMetadata?.role;
      if (userRole === 'vendor' || userRole === 'admin') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏭️ App.jsx: Skipping sync for ${userRole} - let ${userRole === 'vendor' ? 'VendorApp' : 'AdminApp'} handle it`);
        }
        return;
      }
      
      try {
        // Simply call sync endpoint - cookies are sent automatically by axios
        // No need to get tokens or set Authorization headers
        await userAPI.sync();
        console.log('✅ User synced with backend via cookie session');
      } catch (e) {
        // Non-blocking - don't prevent app from loading if sync fails
        console.warn('⚠️ User sync failed (non-blocking):', e.message);
      }
    };
    
    // Small delay to ensure Clerk session cookie is fully established
    const timeoutId = setTimeout(() => {
      sync();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [isSignedIn, user]);
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <main className="min-h-screen">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/packages/:id" element={<PackageDetail />} />
              <Route path="/beatbloom" element={<BeatBloom />} />
              <Route path="/beatbloom/:id" element={<BeatBloomDetail />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Card-based auth routes with role selection */}
              <Route path="/sign-in" element={<RoleBasedAuth mode="signin" />} />
              <Route path="/sign-up" element={<RoleBasedAuth mode="signup" />} />
              <Route path="/sign-in/complete" element={<RoleBasedAuth mode="signin" />} />
              <Route path="/sign-up/complete" element={<RoleBasedAuth mode="signup" />} />
              
              {/* Clerk auth routes with wildcards to support SSO callbacks (fallback) */}
              <Route path="/sign-in/*" element={<RoleBasedAuth mode="signin" />} />
              <Route path="/sign-up/*" element={<RoleBasedAuth mode="signup" />} />

              {/* Backward compatibility redirects */}
              <Route path="/login" element={<RoleBasedAuth mode="signin" />} />
              <Route path="/register" element={<RoleBasedAuth mode="signup" />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/venues/:id" element={<VenueDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              
              {/* Protected Routes - User */}
              <Route path="/user/profile" element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/user/bookings" element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Bookings />
                </ProtectedRoute>
              } />
              <Route path="/user/payments" element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Payments />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/payment/success" element={
                <ProtectedRoute allowedRoles={['user']}>
                  <PaymentSuccess />
                </ProtectedRoute>
              } />
              
              {/* Protected Routes - Vendor */}
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
              
              {/* Protected Routes - Admin */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/profile" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProfile />
                </ProtectedRoute>
              } />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
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
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
