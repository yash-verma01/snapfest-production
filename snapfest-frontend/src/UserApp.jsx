import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { userAPI } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import PortGuard from './components/PortGuard';
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
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Venues = lazy(() => import('./pages/Venues'));
const VenueDetail = lazy(() => import('./pages/VenueDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
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

// Component to handle root redirect for users
function UserRootRedirect() {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated && user?.role === 'user') {
    return <Navigate to="/user/profile" replace />;
  }
  
  return <Navigate to="/login" replace />;
}

function UserApp() {
  // Sync Clerk user to backend on sign-in
  // This ensures the backend knows about the user and creates them in MongoDB
  const { isSignedIn } = useClerkAuth();
  const { user } = useUser();
  
  useEffect(() => {
    const sync = async () => {
      if (!isSignedIn) return;
      
      // Skip sync for vendors and admins - let VendorApp/AdminApp handle their sync
      // This prevents race conditions where user is created with wrong role
      const userRole = user?.publicMetadata?.role;
      if (userRole === 'vendor' || userRole === 'admin') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏭️ UserApp.jsx: Skipping sync for ${userRole} - let ${userRole === 'vendor' ? 'VendorApp' : 'AdminApp'} handle it`);
        }
        return;
      }
      
      try {
        // Sync user with backend - cookies are sent automatically by axios
        // This will create the user document in MongoDB if it doesn't exist
        await userAPI.sync();
        console.log('✅ User synced with backend via cookie session');
      } catch (e) {
        // Non-blocking - log error but don't prevent app from loading
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
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <PortGuard>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              
              <main className="min-h-screen">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Root redirect for users */}
                  <Route path="/" element={<UserRootRedirect />} />
                  <Route path="/packages" element={<Packages />} />
                  <Route path="/packages/:id" element={<PackageDetail />} />
                  <Route path="/beatbloom" element={<BeatBloom />} />
                  <Route path="/beatbloom/:id" element={<BeatBloomDetail />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/venues" element={<Venues />} />
                  <Route path="/venues/:id" element={<VenueDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected Routes - User Only */}
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
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default UserApp;
