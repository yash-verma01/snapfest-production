import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { userAPI } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import PortGuard from './components/PortGuard';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Packages from './pages/Packages';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Contact from './pages/Contact';
import Venues from './pages/Venues';
import VenueDetail from './pages/VenueDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PackageDetail from './pages/PackageDetail';
import BeatBloom from './pages/BeatBloom';
import BeatBloomDetail from './pages/BeatBloomDetail';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

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
  
  useEffect(() => {
    const sync = async () => {
      if (!isSignedIn) return;
      
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
  }, [isSignedIn]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <PortGuard>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              
              <main className="min-h-screen">
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
