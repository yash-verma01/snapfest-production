import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { Card, Button } from '../components/ui';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { bookingId, amount, remainingAmount } = location.state || {};

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Your partial payment has been processed successfully. Your booking is now confirmed!
          </p>

          {/* Payment Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Amount Paid:</span>
              <span className="font-semibold text-green-700">{formatPrice(amount || 0)}</span>
            </div>
            {remainingAmount && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Remaining Balance:</span>
                <span className="font-semibold text-gray-900">{formatPrice(remainingAmount)}</span>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>• Admin will assign a vendor to your booking</li>
              <li>• Vendor will start preparation work</li>
              <li>• You'll receive an email with booking confirmation</li>
              <li>• On event day, you'll pay the remaining 80%</li>
              <li>• After full payment, you'll receive an OTP to share with vendor</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/user/bookings')}
              className="w-full"
              size="lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              View My Bookings
            </Button>
            
            <Button 
              onClick={() => navigate('/packages')}
              variant="outline"
              className="w-full"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Browse More Packages
            </Button>
          </div>

          {/* Contact Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@snapfest.com" className="text-primary-600 hover:underline">
                support@snapfest.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;