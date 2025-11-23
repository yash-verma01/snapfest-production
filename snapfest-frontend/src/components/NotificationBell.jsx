import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, CheckCheck } from 'lucide-react';
import { Badge } from './ui';
import { adminAPI, vendorAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const NotificationBell = ({ userRole = 'admin', onNavigate }) => {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const API = userRole === 'admin' ? adminAPI : vendorAPI;

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
  }, [userRole]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && 
          buttonRef.current && 
          !buttonRef.current.contains(event.target) &&
          !event.target.closest('.notification-dropdown')) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (data) => {
      console.log('📬 New notification received:', data);
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(data.unreadCount || 0);
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.notification.title, {
          body: data.notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
    };

    const handleNotificationRead = (data) => {
      setNotifications(prev => 
        prev.map(n => n._id === data.notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(data.unreadCount || 0);
    };

    const handleAllRead = (data) => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('all_notifications_read', handleAllRead);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('all_notifications_read', handleAllRead);
    };
  }, [socket, isConnected]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await API.getNotifications({ limit: 10 });
      setNotifications(response.data.data.notifications || []);
      setUnreadCount(response.data.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await API.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await API.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    setIsOpen(false);
    
    // Navigate based on notification type
    if (notification.relatedId && notification.relatedType) {
      if (notification.relatedType === 'Booking') {
        // Use callback if provided (for AdminDashboard internal navigation)
        if (onNavigate) {
          onNavigate('bookings', notification.relatedId);
        } else {
          // Fallback for vendor or other cases
          window.location.href = `/vendor/bookings?bookingId=${notification.relatedId}`;
        }
      } else if (notification.relatedType === 'Enquiry') {
        if (onNavigate) {
          onNavigate('enquiries', notification.relatedId);
        } else {
          window.location.href = `/admin/enquiries?enquiryId=${notification.relatedId}`;
        }
      } else if (notification.relatedType === 'Payment') {
        if (onNavigate) {
          onNavigate('payments', notification.relatedId);
        } else {
          window.location.href = `/admin/payments?paymentId=${notification.relatedId}`;
        }
      }
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Calculate dropdown position
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center z-[10000]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        {!isConnected && (
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-gray-400 rounded-full"></div>
        )}
      </button>

      {isOpen && mounted && createPortal(
        <div 
          className="notification-dropdown fixed w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[99999] max-h-96 overflow-hidden flex flex-col"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 p-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="ml-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Use onNavigate callback if provided (for Admin/Vendor Dashboard)
                  if (onNavigate) {
                    onNavigate('notifications');
                  } else {
                    // Fallback for other cases - navigate to dashboard with notifications tab
                    window.location.href = userRole === 'admin' ? '/admin/dashboard?tab=notifications' : '/vendor/dashboard?tab=notifications';
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationBell;

