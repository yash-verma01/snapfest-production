import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';

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

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Debug logging to verify API key is loaded (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 Google Maps API Key Debug:', {
        keyExists: !!GOOGLE_MAPS_API_KEY,
        keyLength: GOOGLE_MAPS_API_KEY?.length || 0,
        keyPreview: GOOGLE_MAPS_API_KEY ? GOOGLE_MAPS_API_KEY.substring(0, 20) + '...' : 'MISSING',
        allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('GOOGLE')),
        mode: import.meta.env.MODE,
      });
      
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('❌ Google Maps API key not found!');
        console.error('📝 Add VITE_GOOGLE_MAPS_API_KEY to snapfest-frontend/.env');
        console.error('📋 Format: VITE_GOOGLE_MAPS_API_KEY=your_key_here');
        console.error('⚠️  Restart dev server after adding the key');
      } else {
        console.log('✅ Using Places API (New) - REST endpoints');
      }
    }
  }, [GOOGLE_MAPS_API_KEY]);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Fetch autocomplete predictions using Places API (New)
  const fetchAutocompletePredictions = useCallback(async (input) => {
    if (!GOOGLE_MAPS_API_KEY || !input || input.length < 3) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text'
        },
        body: JSON.stringify({
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
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        // Transform new API format to match existing component structure
        const transformedPredictions = data.suggestions
          .filter(suggestion => suggestion.placePrediction)
          .map(suggestion => {
            const prediction = suggestion.placePrediction;
            const textObj = prediction.text || {};
            const fullText = textObj.text || '';
            
            // Extract main text and secondary text from the structured text
            // The API returns text with matches array indicating highlighted portions
            let mainText = fullText;
            let secondaryText = '';
            
            // If there are matches, try to extract secondary text
            if (textObj.matches && textObj.matches.length > 0) {
              const firstMatch = textObj.matches[0];
              if (firstMatch.matchedSubstring) {
                const matchLength = firstMatch.matchedSubstring.length || 0;
                mainText = fullText.substring(0, matchLength);
                secondaryText = fullText.substring(matchLength);
              }
            }
            
            return {
              place_id: prediction.placeId,
              description: fullText,
              structured_formatting: {
                main_text: mainText || fullText,
                secondary_text: secondaryText
              }
            };
          });

        if (import.meta.env.DEV && transformedPredictions.length > 0) {
          console.log(`✅ Found ${transformedPredictions.length} place predictions`);
        }
        
        setPredictions(transformedPredictions);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('❌ Error fetching autocomplete predictions:', error);
      if (import.meta.env.DEV) {
        console.error('Error details:', error.message);
        console.error('💡 Make sure Places API (New) is enabled in Google Cloud Console');
        console.error('💡 Check: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
      }
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsLoading(false);
    }
  }, [GOOGLE_MAPS_API_KEY]);

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

  // Fetch place details using Places API (New)
  const fetchPlaceDetails = useCallback(async (placeId) => {
    if (!GOOGLE_MAPS_API_KEY || !placeId) {
      return null;
    }

    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        formatted_address: data.formattedAddress || data.displayName?.text || '',
        name: data.displayName?.text || '',
        geometry: {
          location: data.location ? {
            lat: () => data.location.latitude,
            lng: () => data.location.longitude
          } : null
        },
        address_components: data.addressComponents || []
      };
    } catch (error) {
      console.error('❌ Error fetching place details:', error);
      if (import.meta.env.DEV) {
        console.error('Error details:', error.message);
      }
      return null;
    }
  }, [GOOGLE_MAPS_API_KEY]);

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
