import React from 'react';
import { Calendar, Users, MapPin, Download, MessageCircle, Eye } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const BookingCard = ({
  booking,
  onViewDetails,
  onDownloadInvoice,
  onMessageSupport,
  showActions = true,
  className = ''
}) => {
  const {
    _id,
    packageData: pkg,
    eventDate,
    location,
    guests,
    totalAmount,
    status,
    createdAt,
    vendor
  } = booking;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'CONFIRMED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <Card className={`${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {pkg?.title || 'Package'}
              </h3>
              <p className="text-sm text-gray-600">Booking ID: #{_id}</p>
            </div>
            <Badge variant={getStatusColor(status)} size="sm">
              {getStatusText(status)}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span>{formatDate(eventDate)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2 text-gray-400" />
              <span>{guests} guests</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate">{location}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Total: </span>
              <span className="font-semibold text-primary-600">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          {/* Vendor Info */}
          {vendor && (
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Assigned Vendor:</span> {vendor.name}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-2 lg:ml-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(booking)}
              className="flex items-center justify-center"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadInvoice?.(booking)}
              className="flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMessageSupport?.(booking)}
              className="flex items-center justify-center"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Support
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BookingCard;
