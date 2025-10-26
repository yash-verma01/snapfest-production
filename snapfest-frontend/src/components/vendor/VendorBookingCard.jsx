import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  X, 
  AlertCircle,
  MessageCircle,
  Camera,
  Download,
  Eye,
  Phone,
  Mail,
  UserCheck,
  Star
} from 'lucide-react';
import { Card, Button, Badge } from '../ui';
import { dateUtils } from '../../utils';

const VendorBookingCard = ({ 
  booking, 
  onAccept, 
  onReject, 
  onStart, 
  onComplete, 
  onCancel,
  onViewDetails,
  onMessageCustomer,
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState(null);

  const handleAction = async (actionType, data = {}) => {
    setIsLoading(true);
    setAction(actionType);
    
    try {
      switch (actionType) {
        case 'accept':
          await onAccept(booking._id, data);
          break;
        case 'reject':
          await onReject(booking._id, data);
          break;
        case 'start':
          await onStart(booking._id, data);
          break;
        case 'complete':
          await onComplete(booking._id, data);
          break;
        case 'cancel':
          await onCancel(booking._id, data);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${actionType}:`, error);
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'IN_PROGRESS':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      case 'REJECTED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Camera className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <X className="w-4 h-4" />;
      case 'REJECTED':
        return <AlertCircle className="w-4 h-4" />;
      case 'ASSIGNED':
        return <UserCheck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    switch (booking.status) {
      case 'PENDING':
        buttons.push(
          <Button
            key="accept"
            size="sm"
            onClick={() => handleAction('accept')}
            disabled={isLoading && action === 'accept'}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Accept
          </Button>,
          <Button
            key="reject"
            variant="outline"
            size="sm"
            onClick={() => handleAction('reject')}
            disabled={isLoading && action === 'reject'}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
        );
        break;
      case 'IN_PROGRESS':
        buttons.push(
          <Button
            key="start"
            size="sm"
            onClick={() => handleAction('start')}
            disabled={isLoading && action === 'start'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Camera className="w-4 h-4 mr-1" />
            Start Event
          </Button>
        );
        break;
      case 'IN_PROGRESS':
        buttons.push(
          <Button
            key="complete"
            size="sm"
            onClick={() => handleAction('complete')}
            disabled={isLoading && action === 'complete'}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Complete
          </Button>
        );
        break;
    }

    // Add common buttons
    buttons.push(
      <Button
        key="view"
        variant="outline"
        size="sm"
        onClick={() => onViewDetails(booking)}
        className="border-gray-300"
      >
        <Eye className="w-4 h-4 mr-1" />
        View
      </Button>
    );

    return buttons;
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className={`p-6 ${booking.assignedVendorId ? 'border-l-4 border-l-green-500 bg-green-50' : ''} ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        {/* Booking Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {booking.package?.title || 'Photography Package'}
              </h3>
              <p className="text-sm text-gray-600">
                Booking ID: #{booking._id}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(booking.status)}
              <Badge variant={getStatusColor(booking.status)} size="sm">
                {booking.status.replace('_', ' ')}
              </Badge>
              {booking.assignedVendorId && (
                <Badge variant="success" size="sm" className="bg-green-100 text-green-800">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Assigned to You
                </Badge>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{dateUtils.formatDate(booking.eventDate)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{booking.location || 'Location not specified'}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              <span>{booking.guests} guests</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>{booking.duration || 'Full day'}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Customer Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <span className="text-gray-600 w-20">Name:</span>
                <span className="font-medium">{booking.customer?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-20">Phone:</span>
                <span className="font-medium">{booking.customer?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-20">Email:</span>
                <span className="font-medium">{booking.customer?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-20">Amount:</span>
                <span className="font-medium text-primary-600">
                  {formatPrice(booking.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-1">Special Requests</h4>
              <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                {booking.specialRequests}
              </p>
            </div>
          )}

          {/* Payment Status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-600">Payment Status:</span>
                <Badge 
                  variant={booking.paymentStatus === 'PAID' ? 'success' : 'warning'} 
                  size="sm" 
                  className="ml-2"
                >
                  {booking.paymentStatus || 'PENDING'}
                </Badge>
              </div>
              {booking.partialAmount && (
                <div className="text-sm">
                  <span className="text-gray-600">Partial Payment:</span>
                  <span className="font-medium ml-1">
                    {formatPrice(booking.partialAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 lg:ml-6">
          {getActionButtons()}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMessageCustomer(booking)}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Message
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* TODO: Download invoice */}}
            className="border-gray-300"
          >
            <Download className="w-4 h-4 mr-1" />
            Invoice
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VendorBookingCard;





