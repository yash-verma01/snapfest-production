import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, RefreshCw, Power, Clock } from 'lucide-react';
import { vendorAPI } from '../../services/api';
import LocationService from '../../services/locationService';
import { Card, Button, Badge } from '../ui';
import toast from 'react-hot-toast';

const VendorLocationTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    loadLocationStatus();
  }, []);

  const loadLocationStatus = async () => {
    try {
      const response = await vendorAPI.getLocation();
      if (response.data.success) {
        setCurrentLocation(response.data.data.location);
        setIsTracking(response.data.data.isTrackingEnabled || false);
      }
    } catch (error) {
      console.error('Error loading location:', error);
    }
  };

  const updateLocation = useCallback(async (coords) => {
    try {
      const response = await vendorAPI.updateLocation({
        latitude: coords.latitude,
        longitude: coords.longitude
      });

      if (response.data.success) {
        setCurrentLocation(response.data.data.location);
        toast.success('Location updated');
      }
    } catch (error) {
      toast.error('Failed to update location');
    }
  }, []);

  const handleGetLocation = async () => {
    try {
      setIsLoading(true);
      const coords = await LocationService.getCurrentLocation();
      await updateLocation(coords);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTracking = async () => {
    try {
      const newState = !isTracking;
      const response = await vendorAPI.toggleLocationTracking({ enabled: newState });
      
      if (response.data.success) {
        setIsTracking(newState);
        
        if (newState) {
          const id = LocationService.watchPosition(async (coords, error) => {
            if (error) {
              toast.error('Location tracking error');
              return;
            }
            if (coords) {
              await updateLocation(coords);
            }
          });
          setWatchId(id);
          toast.success('Real-time tracking enabled');
        } else {
          if (watchId) {
            LocationService.clearWatch(watchId);
            setWatchId(null);
          }
          toast.success('Tracking disabled');
        }
      }
    } catch (error) {
      toast.error('Failed to toggle tracking');
    }
  };

  useEffect(() => {
    return () => {
      if (watchId) {
        LocationService.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Current Location
        </h3>
        <Badge className={isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {isTracking ? 'Tracking Active' : 'Tracking Off'}
        </Badge>
      </div>

      {currentLocation?.latitude ? (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Latitude:</span>
                <p className="font-mono">{currentLocation.latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-gray-600">Longitude:</span>
                <p className="font-mono">{currentLocation.longitude.toFixed(6)}</p>
              </div>
            </div>
            {currentLocation.address && (
              <div className="mt-3">
                <span className="text-gray-600 text-sm">Address:</span>
                <p className="text-gray-900 mt-1">{currentLocation.address}</p>
              </div>
            )}
            {currentLocation.lastUpdated && (
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Last updated: {new Date(currentLocation.lastUpdated).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGetLocation} disabled={isLoading} variant="outline" className="flex-1">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Update Now
            </Button>
            <Button onClick={toggleTracking} className={`flex-1 ${isTracking ? 'bg-red-600' : 'bg-green-600'}`}>
              <Power className="w-4 h-4 mr-2" />
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No location set</p>
          <Button onClick={handleGetLocation} disabled={isLoading}>
            <Navigation className="w-4 h-4 mr-2" />
            {isLoading ? 'Getting Location...' : 'Get My Location'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default VendorLocationTracker;

