import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, Button, Badge } from '../ui';
import { vendorAPI } from '../../services/api';

const OTPVerification = ({ 
  bookingId, 
  onVerified, 
  onError,
  className = '' 
}) => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);
  const [otpData, setOtpData] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bookingId) {
      loadOTPData();
    }
  }, [bookingId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const loadOTPData = async () => {
    try {
      const response = await vendorAPI.getPendingOTPs();
      const bookingOTP = response.data.data.otps.find(otp => otp.bookingId === bookingId);
      if (bookingOTP) {
        setOtpData(bookingOTP);
        setTimeLeft(Math.max(0, Math.floor((new Date(bookingOTP.expiresAt) - new Date()) / 1000)));
      }
    } catch (err) {
      console.error('Error loading OTP data:', err);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (attempts >= maxAttempts) {
      setError('Maximum verification attempts reached. Please contact support.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await vendorAPI.verifyOTP({
        bookingId,
        otpCode: otp,
        type: 'PAYMENT'
      });

      if (response.data.success) {
        onVerified(response.data.data);
        setOtp('');
      } else {
        setError(response.data.message || 'Invalid OTP');
        setAttempts(prev => prev + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setAttempts(prev => prev + 1);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await vendorAPI.generateOTP({ bookingId, type: 'PAYMENT' });
      setTimeLeft(300); // 5 minutes
      setError(null);
      setAttempts(0);
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (error) return 'border-red-200 bg-red-50';
    if (isVerifying) return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-white';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (isVerifying) return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
    return <Shield className="w-5 h-5 text-gray-600" />;
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">OTP Verification</h3>
        <p className="text-sm text-gray-600">
          Enter the 6-digit OTP sent to the customer for payment verification
        </p>
      </div>

      <div className="space-y-4">
        {/* OTP Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OTP Code
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type={isVisible ? 'text' : 'password'}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className={`w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${getStatusColor()}`}
              maxLength={6}
              disabled={isVerifying}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="text-gray-400 hover:text-gray-600"
              >
                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {getStatusIcon()}
            </div>
          </div>
        </div>

        {/* Timer and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'OTP Expired'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Attempts: {attempts}/{maxAttempts}
            </span>
            {attempts > 0 && (
              <Badge variant="warning" size="sm">
                {maxAttempts - attempts} left
              </Badge>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={handleVerifyOTP}
            disabled={!otp || otp.length !== 6 || isVerifying || attempts >= maxAttempts}
            className="flex-1"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify OTP
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleResendOTP}
            disabled={timeLeft > 0}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Resend
          </Button>
        </div>

        {/* OTP Info */}
        {otpData && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Booking ID:</span>
                <span className="font-medium">{otpData.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">₹{otpData.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Generated:</span>
                <span className="font-medium">
                  {new Date(otpData.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default OTPVerification;





