import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, X, Calendar } from 'lucide-react';
import { vendorAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';
import { useSocket } from '../../hooks/useSocket';
import toast from 'react-hot-toast';

const VendorNotificationManagement = () => {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getNotifications({ 
        page: currentPage, 
        limit: 20 
      });
      setNotifications(response.data.data.notifications || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (data) => {
      if (currentPage === 1) {
        fetchNotifications();
        toast.success('New notification received!');
      }
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, isConnected, currentPage, fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await vendorAPI.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await vendorAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Unknown time';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications.filter(n => !n.isRead)
      : notifications.filter(n => n.isRead);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline" size="sm" disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </Button>
        </div>
      </Card>

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No {filter === 'all' ? '' : filter} notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-medium ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {getTimeAgo(notification.createdAt)}
                      </span>
                      {notification.relatedType && (
                        <Badge variant="secondary" size="sm">
                          {notification.relatedType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default VendorNotificationManagement;


