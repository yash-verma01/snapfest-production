import React from 'react';
import { useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

const ProtectedRoute = ({ children /*, allowedRoles = [] */ }) => {
  const location = useLocation();

  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl={location.pathname} />
      </SignedOut>
    </>
  );
};

export default ProtectedRoute;





