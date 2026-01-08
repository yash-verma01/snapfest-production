import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { publicAPI } from '../services/api';

const GooglePlacesAutocomplete = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter event location",
  className = "",
  error = false,
  required = false,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const predictionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debug logging (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('✅ Using Google Places API via backend (Service Account)');
      console.log('📋 Project: snap-map-480617 (Snap-map)');
    }
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Fetch autocomplete predictions via backend API
  const fetchAutocompletePredictions = useCallback(async (input) => {
    if (!input || input.length < 3) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await publicAPI.getPlacesAutocomplete({
        input: input,
        locationBias: {
          circle: {
            center: {
              latitude: 26.8467,  // Lucknow coordinates
              longitude: 80.9462
            },
            radius: 50000.0  // 50km radius
          }
        },
        includedRegionCodes: ['IN'],  // Restrict to India
        languageCode: 'en'
      });

      if (response.data.success && response.data.predictions) {
        const predictions = response.data.predictions;
        
        if (import.meta.env.DEV && predictions.length > 0) {
          console.log(`✅ Found ${predictions.length} place predictions`);
        }
        
        setPredictions(predictions);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('❌ Error fetching autocomplete predictions:', error);
      if (import.meta.env.DEV) {
        console.error('Error details:', error.response?.data?.message || error.message);
        console.error('💡 Make sure backend service account is configured correctly');
      }
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newValue.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Debounce API calls (wait 300ms after user stops typing)
    debounceTimerRef.current = setTimeout(() => {
      fetchAutocompletePredictions(newValue);
    }, 300);
  };

  // Fetch place details via backend API
  const fetchPlaceDetails = useCallback(async (placeId) => {
    if (!placeId) {
      return null;
    }

    try {
      const response = await publicAPI.getPlaceDetails(placeId);
      
      if (response.data.success && response.data.place) {
        const place = response.data.place;
        return {
          formatted_address: place.formatted_address || '',
          name: place.name || '',
          geometry: {
            location: place.geometry?.location ? {
              lat: () => place.geometry.location.lat,
              lng: () => place.geometry.location.lng
            } : null
          },
          address_components: place.address_components || []
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching place details:', error);
      if (import.meta.env.DEV) {
        console.error('Error details:', error.response?.data?.message || error.message);
      }
      return null;
    }
  }, []);

  // Handle place selection
  const handlePlaceSelect = async (place) => {
    if (!place.place_id) {
      // Fallback if no place_id
      setInputValue(place.description || '');
      onChange(place.description || '');
      setShowPredictions(false);
      setPredictions([]);
      return;
    }

    // Fetch full place details
    const details = await fetchPlaceDetails(place.place_id);
    
    if (details) {
      const locationText = details.formatted_address || details.name || place.description || '';
      setInputValue(locationText);
      onChange(locationText);
      
      // Call optional callback with full place details
      if (onPlaceSelect) {
        onPlaceSelect({
          address: locationText,
          placeId: place.place_id,
          coordinates: details.geometry?.location ? {
            lat: details.geometry.location.lat(),
            lng: details.geometry.location.lng()
          } : null,
          components: details.address_components
        });
      }
    } else {
      // Fallback if details fetch fails
      setInputValue(place.description || '');
      onChange(place.description || '');
    }
    
    setShowPredictions(false);
    setPredictions([]);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowPredictions(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          required={required}
          disabled={disabled}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
          </div>
        )}
      </div>

      {/* Predictions Dropdown */}
      {showPredictions && predictions.length > 0 && (
        <div
          ref={predictionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <div
              key={prediction.place_id || index}
              onClick={() => handlePlaceSelect(prediction)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </p>
                  {prediction.structured_formatting?.secondary_text && (
                    <p className="text-xs text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
