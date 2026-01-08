import { useState, useEffect, useCallback } from 'react';
import { bookingAPI } from '../services/api';

const useBookings = (initialFilters = {}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchBookings = useCallback(async (page = 1, newFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: pagination.limit,
        ...newFilters
      };

      const response = await bookingAPI.getBookings(params);
      const { bookings: data, pagination: paginationData } = response.data.data;

      setBookings(data);
      setPagination(paginationData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBookings(1, newFilters);
  }, [fetchBookings]);

  const createBooking = useCallback(async (bookingData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await bookingAPI.createBooking(bookingData);
      const newBooking = response.data.data.booking;
      
      setBookings(prev => [newBooking, ...prev]);
      return newBooking;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBookingStatus = useCallback(async (bookingId, status) => {
    setLoading(true);
    setError(null);

    try {
      const response = await bookingAPI.updateBookingStatus(bookingId, { status });
      const updatedBooking = response.data.data.booking;
      
      setBookings(prev => 
        prev.map(booking => 
          booking._id === bookingId ? updatedBooking : booking
        )
      );
      return updatedBooking;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId, reason) => {
    setLoading(true);
    setError(null);

    try {
      const response = await bookingAPI.cancelBooking(bookingId, { reason });
      const updatedBooking = response.data.data.booking;
      
      setBookings(prev => 
        prev.map(booking => 
          booking._id === bookingId ? updatedBooking : booking
        )
      );
      return updatedBooking;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    refresh
  };
};

export default useBookings;





