import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Auth handled by Clerk
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import ErrorBoundary from './components/ErrorBoundary';

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
  const { user } = useUser();
  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin/dashboard" />
      </SignedOut>
      <SignedIn>
        {user?.publicMetadata?.role === 'admin' ? (
          children
        ) : (
          <Navigate to="/sign-in" replace />
        )}
      </SignedIn>
    </>
  );
}

function AdminApp() {
  return (
    <ErrorBoundary>
        <Router>
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
