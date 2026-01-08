import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  CreditCard, 
  Camera, 
  MessageCircle, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Download
} from 'lucide-react';
import { Card, Badge } from '../ui';
import { dateUtils } from '../../utils';

const RecentActivity = ({ activities = [], className = '' }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking_created':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'payment_made':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'booking_updated':
        return <CheckCircle className="w-5 h-5 text-yellow-600" />;
      case 'booking_cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'photo_ready':
        return <Camera className="w-5 h-5 text-purple-600" />;
      case 'message_received':
        return <MessageCircle className="w-5 h-5 text-indigo-600" />;
      case 'download_available':
        return <Download className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'booking_created':
        return 'bg-blue-50 border-blue-200';
      case 'payment_made':
        return 'bg-green-50 border-green-200';
      case 'booking_updated':
        return 'bg-yellow-50 border-yellow-200';
      case 'booking_cancelled':
        return 'bg-red-50 border-red-200';
      case 'photo_ready':
        return 'bg-purple-50 border-purple-200';
      case 'message_received':
        return 'bg-indigo-50 border-indigo-200';
      case 'download_available':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getActivityBadge = (type) => {
    switch (type) {
      case 'booking_created':
        return <Badge variant="primary" size="sm">New</Badge>;
      case 'payment_made':
        return <Badge variant="success" size="sm">Paid</Badge>;
      case 'booking_updated':
        return <Badge variant="warning" size="sm">Updated</Badge>;
      case 'booking_cancelled':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      case 'photo_ready':
        return <Badge variant="primary" size="sm">Ready</Badge>;
      case 'message_received':
        return <Badge variant="info" size="sm">Message</Badge>;
      case 'download_available':
        return <Badge variant="success" size="sm">Download</Badge>;
      default:
        return null;
    }
  };

  if (activities.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recent activity</p>
          <p className="text-sm text-gray-500">Your activity will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Link 
          to="/user/activity" 
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View All
        </Link>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity._id || index}
            className={`p-4 rounded-lg border ${getActivityColor(activity.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  {getActivityBadge(activity.type)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {dateUtils.formatRelativeTime(activity.timestamp)}
                </p>
                {activity.data && (
                  <div className="mt-2">
                    {activity.data.bookingId && (
                      <Link
                        to={`/user/bookings/${activity.data.bookingId}`}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        View Details →
                      </Link>
                    )}
                    {activity.data.amount && (
                      <span className="text-xs text-gray-600 ml-2">
                        Amount: ₹{activity.data.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentActivity;





