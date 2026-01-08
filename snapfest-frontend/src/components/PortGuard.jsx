import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * PortGuard - Prevents access to routes that don't belong to the current portal
 * 
 * This component ensures that:
 * - User portal (3000) can only access /user/* routes
 * - Vendor portal (3001) can only access /vendor/* routes
 * - Admin portal (3002) can only access /admin/* routes
 */
const PortGuard = ({ children, allowedRoutes = [] }) => {
  const location = useLocation();
  const currentPort = window.location.port || window.location.hostname.split(':')[1] || '';
  
  // Determine which portal this is based on port
  const isUserPortal = currentPort === '3000' || window.location.hostname.includes(':3000');
  const isVendorPortal = currentPort === '3001' || window.location.hostname.includes(':3001');
  const isAdminPortal = currentPort === '3002' || window.location.hostname.includes(':3002');
  
  // Define allowed route prefixes for each portal
  const userAllowedPrefixes = ['/user', '/packages', '/events', '/venues', '/gallery', '/about', '/contact', '/beatbloom', '/cart', '/checkout', '/payment', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/'];
  const vendorAllowedPrefixes = ['/vendor', '/packages', '/events', '/venues', '/gallery', '/about', '/contact', '/sign-in', '/sign-up', '/'];
  const adminAllowedPrefixes = ['/admin', '/sign-in', '/sign-up', '/'];
  
  // Get allowed prefixes for current portal
  let allowedPrefixes = [];
  if (isUserPortal) {
    allowedPrefixes = userAllowedPrefixes;
  } else if (isVendorPortal) {
    allowedPrefixes = vendorAllowedPrefixes;
  } else if (isAdminPortal) {
    allowedPrefixes = adminAllowedPrefixes;
  } else {
    // Fallback: allow all routes if port cannot be determined
    return children;
  }
  
  // CRITICAL: Explicitly block /user/* routes on vendor/admin portals
  if ((isVendorPortal || isAdminPortal) && location.pathname.startsWith('/user/')) {
    console.warn(`🚫 Port Guard: Blocking /user/* route on ${isVendorPortal ? 'vendor' : 'admin'} portal`);
    if (isVendorPortal) {
      return <Navigate to="/vendor/dashboard" replace />;
    } else {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }
  
  // Check if current route is allowed
  const isAllowedRoute = allowedPrefixes.some(prefix => 
    location.pathname === prefix || 
    location.pathname.startsWith(prefix + '/')
  ) || allowedRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));
  
  if (!isAllowedRoute) {
    // Route not allowed for this portal - redirect to home
    console.warn(`🚫 Port Guard: Route ${location.pathname} is not allowed on port ${currentPort}. Redirecting to home.`);
    
    if (isUserPortal) {
      return <Navigate to="/" replace />;
    } else if (isVendorPortal) {
      return <Navigate to="/vendor/dashboard" replace />;
    } else if (isAdminPortal) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default PortGuard;

