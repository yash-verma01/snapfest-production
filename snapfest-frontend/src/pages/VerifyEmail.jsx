import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { userAPI } from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setVerificationStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await userAPI.verifyEmail(token);
        setVerificationStatus('success');
        setMessage('Email verified successfully! You can now use all features of your account.');
      } catch (error) {
        setVerificationStatus('error');
        setMessage(error.response?.data?.message || 'Email verification failed. The token may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/user/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="p-8 text-center">
          {verificationStatus === 'verifying' && (
            <>
              <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </>
          )}

          {verificationStatus === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button onClick={handleContinue} className="w-full">
                Continue to Profile
              </Button>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Button onClick={handleContinue} className="w-full">
                  Go to Profile
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/login')} 
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;

