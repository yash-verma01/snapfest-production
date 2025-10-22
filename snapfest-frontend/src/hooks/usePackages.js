import { useState, useEffect, useCallback } from 'react';
import { publicAPI } from '../services/api';
import { dummyPackages } from '../data';

const usePackages = (initialFilters = {}) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const fetchPackages = useCallback(async (page = 1, newFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      // Build params, omitting empty strings/undefined/null
      const rawParams = {
        page,
        limit: 12,
        ...newFilters,
      };
      const params = Object.fromEntries(
        Object.entries(rawParams).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
      );

      const response = await publicAPI.getPackages(params);
      
      // Parse backend response correctly
      if (response.data.success && response.data.data) {
        const data = response.data.data.packages || [];
        const pagination = response.data.data.pagination || {};
        
        const paginationData = {
          page: pagination.current || 1,
          limit: 12,
          total: pagination.total || data.length,
          totalPages: pagination.pages || 1,
        };
        
        setPackages(data);
        setPagination(paginationData);
      } else {
        throw new Error('Invalid response format from backend');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch packages');
      // Graceful fallback so UI doesn't go empty
      try {
        if (Array.isArray(dummyPackages) && dummyPackages.length > 0) {
          setPackages(dummyPackages.slice(0, 12));
          setPagination({ page: 1, limit: 12, total: dummyPackages.length, totalPages: Math.ceil(dummyPackages.length / 12) });
        }
      } catch (_) {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, [filters]); // Add filters as dependency

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPackages(1, newFilters);
  }, [fetchPackages]);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages && !loading) {
      fetchPackages(pagination.page + 1);
    }
  }, [pagination.page, pagination.totalPages, loading, fetchPackages]);

  const refresh = useCallback(() => {
    fetchPackages(1);
  }, [fetchPackages]);

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    loadMore,
    refresh,
    hasMore: pagination.page < pagination.totalPages
  };
};

export default usePackages;
