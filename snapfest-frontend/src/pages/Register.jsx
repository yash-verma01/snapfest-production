import React from 'react';
import { SignUp, useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

const Register = () => {
  const { isSignedIn, isLoaded } = useAuth();
  
  // If already signed in, redirect to home
  if (isLoaded && isSignedIn) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join SnapFest</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>
        <SignUp 
          routing="path"
          path="/register"
          signInUrl="/login"
          fallbackRedirectUrl="/"
          afterSignUpUrl="/"
        />
      </div>
    </div>
  );
};

export default Register;
