import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error, customMessage = null) => {
    console.error('Error occurred:', error);
    
    let errorMessage = customMessage || 'An unexpected error occurred';
    
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    setError(errorMessage);
    toast.error(errorMessage);
  }, []);

  const handleAsync = useCallback(async (asyncFunction, customMessage = null) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await asyncFunction();
      return result;
    } catch (error) {
      handleError(error, customMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiError = useCallback((error) => {
    if (error?.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    } else if (error?.response?.status === 403) {
      // Forbidden
      handleError(error, 'You do not have permission to perform this action');
    } else if (error?.response?.status === 404) {
      // Not found
      handleError(error, 'The requested resource was not found');
    } else if (error?.response?.status >= 500) {
      // Server error
      handleError(error, 'Server error. Please try again later');
    } else if (error?.code === 'NETWORK_ERROR') {
      // Network error
      handleError(error, 'Network error. Please check your connection');
    } else {
      // Generic error
      handleError(error);
    }
  }, [handleError]);

  return {
    error,
    isLoading,
    handleError,
    handleAsync,
    handleApiError,
    clearError
  };
};

export default useErrorHandler;

