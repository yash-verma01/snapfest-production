import React from 'react';
import { MapPin, Clock } from 'lucide-react';

const VendorLocationMap = ({ 
  latitude, 
  longitude, 
  vendorName, 
  address,
  lastUpdated 
}) => {
  if (!latitude || !longitude) {
    return (
      <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
        <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No location data available</p>
      </div>
    );
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return (
      <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Google Maps API key not configured</p>
      </div>
    );
  }

  // Use Google Maps Embed API
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=15`;

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden border border-gray-200" style={{ height: '400px' }}>
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={embedUrl}
          title={`${vendorName} location`}
        />
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Coordinates:</span>
            <p className="font-mono text-gray-900">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>
          {lastUpdated && (
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <p className="text-gray-900">
                {new Date(lastUpdated).toLocaleString()}
              </p>
            </div>
          )}
        </div>
        {address && (
          <div className="mt-3">
            <span className="text-gray-600 text-sm">Address:</span>
            <p className="text-gray-900 mt-1">{address}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorLocationMap;

