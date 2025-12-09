import { useEffect, useRef } from 'react';
import { useSocket } from './useSocket';

/**
 * Hook to listen for real-time vendor location updates
 * @param {string|null} vendorId - Specific vendor ID to track, or null for all vendors
 * @param {Function} onLocationUpdate - Callback when location updates
 */
export const useVendorLocationUpdates = (vendorId, onLocationUpdate) => {
  const { socket, isConnected } = useSocket();
  const callbackRef = useRef(onLocationUpdate);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Subscribe to specific vendor if vendorId provided
    if (vendorId) {
      socket.emit('subscribe_vendor_location', vendorId);
    }

    // Listen for location updates
    const handleLocationUpdate = (data) => {
      // If tracking specific vendor, only process that vendor's updates
      if (!vendorId || data.vendorId === vendorId) {
        if (callbackRef.current) {
          callbackRef.current(data);
        }
      }
    };

    socket.on('vendor_location_update', handleLocationUpdate);

    return () => {
      socket.off('vendor_location_update', handleLocationUpdate);
      if (vendorId) {
        socket.emit('unsubscribe_vendor_location', vendorId);
      }
    };
  }, [socket, isConnected, vendorId]);

  return { socket, isConnected };
};

