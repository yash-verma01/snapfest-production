import React, { useState, useRef, useEffect } from 'react';
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
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Debug logging to verify API key is loaded
  useEffect(() => {
    console.log('🔍 Google Maps API Key Debug:', {
      keyExists: !!GOOGLE_MAPS_API_KEY,
      keyLength: GOOGLE_MAPS_API_KEY?.length || 0,
      keyPreview: GOOGLE_MAPS_API_KEY ? GOOGLE_MAPS_API_KEY.substring(0, 20) + '...' : 'MISSING',
      allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('GOOGLE')),
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD
    });
  }, []);

  // Initialize Google Maps services
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ Google Maps API key not found!');
      console.error('📝 Please add VITE_GOOGLE_MAPS_API_KEY to your .env file in the frontend directory');
      console.error('📁 Expected location: snapfest-frontend/.env');
      console.error('📋 Format: VITE_GOOGLE_MAPS_API_KEY=your_key_here');
      console.error('⚠️  Make sure:');
      console.error('   - Variable name starts with VITE_');
      console.error('   - No quotes around the value');
      console.error('   - No spaces around the = sign');
      console.error('   - Dev server was restarted after adding the key');
      return;
    }

    console.log('✅ Google Maps API key found, initializing...');

    // Check if script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeServices();
      setScriptLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for script to load
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          initializeServices();
          setScriptLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      return () => clearInterval(checkGoogle);
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google Maps script loaded successfully');
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeServices();
        setScriptLoaded(true);
        console.log('✅ Google Maps services initialized');
      } else {
        console.error('❌ Google Maps script loaded but services not available');
      }
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps script');
      console.error('Error details:', error);
      console.error('Script URL:', script.src);
      console.error('Possible causes:');
      console.error('  - Invalid API key');
      console.error('  - API key restrictions blocking localhost');
      console.error('  - Places API not enabled in Google Cloud Console');
      console.error('  - Network connectivity issues');
    };
    document.head.appendChild(script);
  }, [GOOGLE_MAPS_API_KEY]);

  const initializeServices = () => {
    try {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      console.log('✅ Google Maps services initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Maps services:', error);
      console.error('Error stack:', error.stack);
    }
  };

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Get predictions from Google Places API
    if (autocompleteServiceRef.current && scriptLoaded) {
      setIsLoading(true);
      
      // Bias results to Lucknow, Uttar Pradesh, India
      const request = {
        input: newValue,
        componentRestrictions: { country: 'in' }, // Restrict to India
        location: new window.google.maps.LatLng(26.8467, 80.9462), // Lucknow coordinates
        radius: 50000, // 50km radius from Lucknow
        types: ['establishment', 'geocode'] // Get both places and addresses
      };

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          console.log(`✅ Found ${predictions.length} place predictions`);
          setPredictions(predictions);
          setShowPredictions(true);
        } else {
          console.warn('⚠️  Places API returned status:', status);
          console.warn('Status meaning:', {
            'OK': 'Request was successful',
            'ZERO_RESULTS': 'No results found',
            'OVER_QUERY_LIMIT': 'Quota exceeded',
            'REQUEST_DENIED': 'Request denied (check API key and restrictions)',
            'INVALID_REQUEST': 'Invalid request parameters'
          }[status] || 'Unknown status');
          setPredictions([]);
          setShowPredictions(false);
        }
      });
    }
  };

  // Handle place selection
  const handlePlaceSelect = (place) => {
    if (placesServiceRef.current && scriptLoaded) {
      placesServiceRef.current.getDetails(
        {
          placeId: place.place_id,
          fields: ['formatted_address', 'name', 'geometry', 'address_components']
        },
        (details, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && details) {
            // Use formatted address or name
            const locationText = details.formatted_address || details.name || place.description;
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
            
            setShowPredictions(false);
            setPredictions([]);
          }
        }
      );
    } else {
      // Fallback if service not ready
      setInputValue(place.description);
      onChange(place.description);
      setShowPredictions(false);
      setPredictions([]);
    }
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
                    {prediction.structured_formatting.main_text}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {prediction.structured_formatting.secondary_text}
                  </p>
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


