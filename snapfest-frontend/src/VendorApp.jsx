import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useUser, useAuth } from '@clerk/clerk-react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { vendorAPI } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import PortGuard from './components/PortGuard';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
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

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

// Root redirect for vendors
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

  if (isSignedIn) {
    const role = user?.publicMetadata?.role;
    if (role === 'vendor' || window.location.port === '3001') {
      return <Navigate to="/vendor/dashboard" replace />;
    }
  }

  return <Navigate to="/sign-in" replace />;
}

function VendorApp() {
  const { isSignedIn } = useAuth();

  // Sync vendor with backend
  useEffect(() => {
    if (!isSignedIn) return;

    const syncVendor = async () => {
      try {
        await vendorAPI.sync();
        console.log('✅ Vendor synced with backend');
      } catch (e) {
        console.warn('⚠️ Vendor sync failed:', e.message);
      }
    };

    const timeoutId = setTimeout(syncVendor, 500);
    return () => clearTimeout(timeoutId);
  }, [isSignedIn]);

  return (
    <ErrorBoundary>
      <Router>
        <PortGuard>
          <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="min-h-screen">
              <Routes>
                {/* Root */}
                <Route path="/" element={<VendorRootRedirect />} />

                {/* Auth */}
                <Route path="/sign-in/*" element={<SignIn />} />
                <Route path="/sign-up/*" element={<SignUp />} />

                {/* Public */}
                <Route path="/packages" element={<Packages />} />
                <Route path="/packages/:id" element={<PackageDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/venues" element={<Venues />} />
                <Route path="/venues/:id" element={<VenueDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                {/* Vendor Protected */}
                <Route
                  path="/vendor/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <VendorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vendor/profile"
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <VendorProfileNew />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vendor/bookings"
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <VendorBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vendor/earnings"
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <VendorEarnings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vendor/settings"
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <VendorSettings />
                    </ProtectedRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

            <Footer />

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
                },
                error: {
                  duration: 5000,
                },
              }}
            />
          </div>
        </PortGuard>
      </Router>
    </ErrorBoundary>
  );
}

export default VendorApp;
