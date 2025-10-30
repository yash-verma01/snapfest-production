import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignIn, SignUp, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
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
import VendorDashboard from './pages/VendorDashboard';
import VendorBookings from './pages/VendorBookings';
import VendorEarnings from './pages/VendorEarnings';
import VendorSettings from './pages/VendorSettings';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminProfile from './pages/AdminProfile';
import Profile from './pages/Profile';
import VendorProfile from './pages/VendorProfile';
import VendorProfileNew from './pages/VendorProfileNew';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Cart from './pages/Cart';
import CartTest from './pages/CartTest';
import CartFallback from './pages/CartFallback';
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

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <main className="min-h-screen">
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
            {/* Clerk auth routes with wildcards to support SSO callbacks */}
            <Route path="/sign-in/*" element={<SignIn />} />
            <Route path="/sign-up/*" element={<SignUp />} />

            {/* Backward compatibility redirects */}
            <Route path="/login" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/gallery" element={<Gallery />} />
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
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnalytics />
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
