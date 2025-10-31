import React from 'react';
import { useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const { user } = useUser();

  return (
    <>
      <SignedIn>
        {allowedRoles.length > 0 && user?.publicMetadata?.role && !allowedRoles.includes(user.publicMetadata.role) ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
            </div>
          </div>
        ) : (
          children
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl={location.pathname} />
      </SignedOut>
    </>
  );
};

export default ProtectedRoute;





