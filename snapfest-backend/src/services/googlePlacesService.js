import { GoogleAuth } from 'google-auth-library';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { logInfo, logError, logDebug } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Google Auth with service account from file path in environment variable
let authClient = null;

const getAuthClient = () => {
  if (!authClient) {
    try {
      // Read file path from environment variable
      const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      
      if (!serviceAccountPath) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set. Please add the service account file path to .env file.');
      }

      // Resolve path (handle both relative and absolute paths)
      let resolvedPath;
      if (serviceAccountPath.startsWith('/')) {
        // Absolute path
        resolvedPath = serviceAccountPath;
      } else {
        // Relative path - resolve from backend root directory
        resolvedPath = join(__dirname, '../../', serviceAccountPath);
      }

      // Check if file exists
      if (!existsSync(resolvedPath)) {
        logError('Service account file not found', {
          providedPath: serviceAccountPath,
          resolvedPath: resolvedPath,
          hint: 'Make sure the file path in GOOGLE_SERVICE_ACCOUNT_JSON is correct'
        });
        throw new Error(`Service account file not found at: ${resolvedPath}`);
      }

      // Initialize Google Auth with file path
      authClient = new GoogleAuth({
        keyFile: resolvedPath,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      logInfo('Google Places Service initialized', {
        projectId: 'snap-map-480617',
        projectName: 'Snap-map',
        serviceAccountPath: resolvedPath
      });
    } catch (error) {
      logError('Failed to initialize Google Auth', { 
        error: error.message,
        providedPath: process.env.GOOGLE_SERVICE_ACCOUNT_JSON
      });
      throw error;
    }
  }
  return authClient;
};

/**
 * Get access token using service account
 */
const getAccessToken = async () => {
  try {
    const auth = getAuthClient();
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
  } catch (error) {
    logError('Failed to get access token', { error: error.message });
    throw new Error('Failed to authenticate with Google Cloud');
  }
};

/**
 * Fetch autocomplete predictions using Places API (New)
 * @param {string} input - User input text
 * @param {Object} options - Additional options (locationBias, etc.)
 */
export const getAutocompletePredictions = async (input, options = {}) => {
  try {
    if (!input || input.length < 3) {
      return { success: false, message: 'Input must be at least 3 characters' };
    }

    const accessToken = await getAccessToken();

    const requestBody = {
      input: input,
      locationBias: options.locationBias || {
        circle: {
          center: {
            latitude: 26.8467,  // Lucknow coordinates (default)
            longitude: 80.9462
          },
          radius: 50000.0  // 50km radius
        }
      },
      includedRegionCodes: options.includedRegionCodes || ['IN'],  // Restrict to India
      languageCode: options.languageCode || 'en'
    };

    if (process.env.NODE_ENV === 'development') {
      logDebug('Fetching autocomplete predictions', {
        input: input.substring(0, 20) + '...',
        hasLocationBias: !!requestBody.locationBias
      });
    }

    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError('Places API autocomplete failed', {
        status: response.status,
        error: errorData.error?.message
      });
      return {
        success: false,
        message: errorData.error?.message || `HTTP ${response.status}`,
        status: response.status
      };
    }

    const data = await response.json();

    if (data.suggestions && data.suggestions.length > 0) {
      // Transform new API format to match frontend structure
      const transformedPredictions = data.suggestions
        .filter(suggestion => suggestion.placePrediction)
        .map(suggestion => {
          const prediction = suggestion.placePrediction;
          const textObj = prediction.text || {};
          const fullText = textObj.text || '';

          // Extract main text and secondary text
          let mainText = fullText;
          let secondaryText = '';

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

      if (process.env.NODE_ENV === 'development') {
        logDebug('Autocomplete predictions fetched', {
          count: transformedPredictions.length
        });
      }

      return {
        success: true,
        predictions: transformedPredictions
      };
    }

    return {
      success: true,
      predictions: []
    };
  } catch (error) {
    logError('Error in getAutocompletePredictions', { error: error.message });
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Fetch place details using Places API (New)
 * @param {string} placeId - Google Place ID
 */
export const getPlaceDetails = async (placeId) => {
  try {
    if (!placeId) {
      return { success: false, message: 'Place ID is required' };
    }

    const accessToken = await getAccessToken();

    if (process.env.NODE_ENV === 'development') {
      logDebug('Fetching place details', {
        placeId: placeId.substring(0, 20) + '...'
      });
    }

    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError('Places API details failed', {
        status: response.status,
        error: errorData.error?.message
      });
      return {
        success: false,
        message: errorData.error?.message || `HTTP ${response.status}`,
        status: response.status
      };
    }

    const data = await response.json();

    const placeDetails = {
      formatted_address: data.formattedAddress || data.displayName?.text || '',
      name: data.displayName?.text || '',
      geometry: {
        location: data.location ? {
          lat: data.location.latitude,
          lng: data.location.longitude
        } : null
      },
      address_components: data.addressComponents || []
    };

    if (process.env.NODE_ENV === 'development') {
      logDebug('Place details fetched', {
        name: placeDetails.name
      });
    }

    return {
      success: true,
      place: placeDetails
    };
  } catch (error) {
    logError('Error in getPlaceDetails', { error: error.message });
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Reverse Geocoding - Convert coordinates to address
 * @param {number} latitude 
 * @param {number} longitude 
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!latitude || !longitude) {
      return { success: false, message: 'Latitude and longitude are required' };
    }

    const accessToken = await getAccessToken();

    if (process.env.NODE_ENV === 'development') {
      logDebug('Reverse geocoding', { latitude, longitude });
    }

    // Use Places API (New) for reverse geocoding
    // Format: places/{placeId} where placeId can be coordinates
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${latitude},${longitude}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Goog-FieldMask': 'formattedAddress,addressComponents'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError('Reverse geocoding failed', {
        status: response.status,
        error: errorData.error?.message
      });
      return {
        success: false,
        message: errorData.error?.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();

    return {
      success: true,
      address: data.formattedAddress || '',
      components: data.addressComponents || []
    };
  } catch (error) {
    logError('Error in reverseGeocode', { error: error.message });
    return {
      success: false,
      message: error.message
    };
  }
};

export default {
  getAutocompletePredictions,
  getPlaceDetails,
  reverseGeocode
};

