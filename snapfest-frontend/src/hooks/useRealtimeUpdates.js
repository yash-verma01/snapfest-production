import { useEffect, useRef } from 'react';
import { useSocket } from './useSocket';

/**
 * Custom hook for real-time updates via WebSocket
 * @param {Function} onNewBooking - Callback when new booking is received
 * @param {Function} onNewEnquiry - Callback when new enquiry is received
 * @param {Function} onNewPayment - Callback when new payment is received
 */
export const useRealtimeUpdates = (onNewBooking, onNewEnquiry, onNewPayment) => {
  const { socket, isConnected } = useSocket();
  const callbacksRef = useRef({ onNewBooking, onNewEnquiry, onNewPayment });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onNewBooking, onNewEnquiry, onNewPayment };
  }, [onNewBooking, onNewEnquiry, onNewPayment]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleAdminNotification = (data) => {
      console.log('📬 Admin notification received:', data);
      
      if (data.relatedType === 'Booking' && callbacksRef.current.onNewBooking) {
        callbacksRef.current.onNewBooking(data);
      } else if (data.relatedType === 'Enquiry' && callbacksRef.current.onNewEnquiry) {
        callbacksRef.current.onNewEnquiry(data);
      } else if (data.relatedType === 'Payment' && callbacksRef.current.onNewPayment) {
        callbacksRef.current.onNewPayment(data);
      }
    };

    // Listen for admin-specific notifications
    socket.on('admin_notification', handleAdminNotification);
    socket.on('new_notification', handleAdminNotification);

    return () => {
      socket.off('admin_notification', handleAdminNotification);
      socket.off('new_notification', handleAdminNotification);
    };
  }, [socket, isConnected]);
};



