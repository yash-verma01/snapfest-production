import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Auth handled by Clerk
import { SignedIn, SignedOut, RedirectToSignIn, useUser, useAuth } from '@clerk/clerk-react';
import { userAPI } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import PortGuard from './components/PortGuard';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Admin Pages only
import { SignIn, SignUp } from '@clerk/clerk-react';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminProfile from './pages/AdminProfile';
import NotFound from './pages/NotFound';

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
  const { isSignedIn } = useAuth();
  
  useEffect(() => {
    const sync = async () => {
      if (!isSignedIn) return;
      
      try {
        // Sync user with backend - cookies are sent automatically by axios
        await userAPI.sync();
        console.log('✅ Admin user synced with backend via cookie session');
      } catch (e) {
        // Non-blocking - log error but don't prevent app from loading
        console.warn('⚠️ Admin user sync failed (non-blocking):', e.message);
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
        <Router>
          <PortGuard>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              
              <main className="min-h-screen">
              <Routes>
              {/* Root redirect for admins */}
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/sign-in/*" element={<SignIn />} />
              <Route path="/sign-up/*" element={<SignUp />} />
              
              {/* Protected Routes - Admin Only */}
              <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="/admin/analytics" element={<AdminGuard><AdminAnalytics /></AdminGuard>} />
              <Route path="/admin/profile" element={<AdminGuard><AdminProfile /></AdminGuard>} />
              
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
        </div>
        </Router>
    </ErrorBoundary>
  );
}

export default AdminApp;
