import { asyncHandler } from '../middleware/errorHandler.js';
import { getAutocompletePredictions, getPlaceDetails } from '../services/googlePlacesService.js';

/**
 * @route   POST /api/places/autocomplete
 * @desc    Get autocomplete predictions for places
 * @access  Public
 */
export const autocomplete = asyncHandler(async (req, res) => {
  const { input, locationBias, includedRegionCodes, languageCode } = req.body;

  if (!input || input.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Input must be at least 3 characters long'
    });
  }

  const result = await getAutocompletePredictions(input, {
    locationBias,
    includedRegionCodes,
    languageCode
  });

  if (!result.success) {
    return res.status(result.status || 500).json({
      success: false,
      message: result.message
    });
  }

  res.json({
    success: true,
    predictions: result.predictions
  });
});

/**
 * @route   GET /api/places/:placeId
 * @desc    Get place details by place ID
 * @access  Public
 */
export const placeDetails = asyncHandler(async (req, res) => {
  const { placeId } = req.params;

  if (!placeId) {
    return res.status(400).json({
      success: false,
      message: 'Place ID is required'
    });
  }

  const result = await getPlaceDetails(placeId);

  if (!result.success) {
    return res.status(result.status || 500).json({
      success: false,
      message: result.message
    });
  }

  res.json({
    success: true,
    place: result.place
  });
});

