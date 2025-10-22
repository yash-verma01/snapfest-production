import { useState, useEffect } from 'react';
import { publicAPI } from '../services/api';

const useRecommendations = (userId, userPreferences = {}) => {
  const [recommendations, setRecommendations] = useState({
    packages: [],
    events: [],
    venues: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setRecommendations(prev => ({ ...prev, loading: true, error: null }));

        // Load personalized recommendations
        const [packagesRes, eventsRes, venuesRes] = await Promise.all([
          publicAPI.getRecommendedPackages(userId, userPreferences),
          publicAPI.getRecommendedEvents(userId, userPreferences),
          publicAPI.getRecommendedVenues(userId, userPreferences)
        ]);

        setRecommendations({
          packages: packagesRes.data.data.packages || [],
          events: eventsRes.data.data.events || [],
          venues: venuesRes.data.data.venues || [],
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error loading recommendations:', error);
        setRecommendations(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    if (userId) {
      loadRecommendations();
    }
  }, [userId, userPreferences]);

  const refreshRecommendations = () => {
    if (userId) {
      loadRecommendations();
    }
  };

  return {
    ...recommendations,
    refreshRecommendations
  };
};

export default useRecommendations;


