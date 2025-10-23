import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

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
import VendorDashboard from './pages/VendorDashboard';
import VendorBookings from './pages/VendorBookings';
import VendorEarnings from './pages/VendorEarnings';
import VendorSettings from './pages/VendorSettings';
import VendorProfile from './pages/VendorProfile';
import VendorProfileNew from './pages/VendorProfileNew';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

// Component to handle root redirect for vendors
function VendorRootRedirect() {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated && user?.role === 'vendor') {
    return <Navigate to="/vendor/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
}

function VendorApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <main className="min-h-screen">
            <Routes>
              {/* Root redirect for vendors */}
              <Route path="/" element={<VendorRootRedirect />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/packages/:id" element={<PackageDetail />} />
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
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default VendorApp;
