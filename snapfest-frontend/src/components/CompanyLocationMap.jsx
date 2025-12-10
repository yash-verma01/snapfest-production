import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import companyLocation from '../config/companyLocation';

const CompanyLocationMap = ({ 
  showAddressCard = true,
  height = '320px' // Default height, can be customized
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { address, companyName, latitude, longitude, zoom } = companyLocation;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center rounded-2xl" style={{ height }}>
        <div className="text-center p-8">
          <MapPin className="w-12 h-12 text-pink-600 mx-auto mb-4" />
          <p className="text-pink-800 font-bold">Map unavailable</p>
          <p className="text-sm text-pink-700">API key not configured</p>
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=${zoom}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl border-0">
      {/* Google Maps Embed */}
      <div className="relative w-full" style={{ height }}>
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={embedUrl}
          title={`${companyName} Location`}
        />
        {/* Address Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{companyName}</p>
              <p className="text-xs text-white/90">{address}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Address Details Card */}
      {showAddressCard && (
        <div className="p-6 bg-white">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-pink-100 to-red-100 p-3 rounded-xl flex-shrink-0">
              <MapPin className="w-6 h-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">Visit Our Office</h3>
              <p className="text-gray-700 text-sm mb-1">{address}</p>
              <a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-pink-600 hover:text-pink-700 text-sm font-medium transition-colors"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyLocationMap;

