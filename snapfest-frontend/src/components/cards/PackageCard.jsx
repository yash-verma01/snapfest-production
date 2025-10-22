import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const PackageCard = ({
  packageData: pkg,
  onBookNow,
  onViewDetails,
  showBookNow = true,
  showViewDetails = true,
  className = ''
}) => {
  const {
    _id,
    title = 'Untitled Package',
    description = 'No description available',
    basePrice = 0,
    perGuestPrice = 0,
    category = 'GENERAL',
    rating = 0,
    images = [],
    primaryImage,
    isPremium = false,
    features = [],
    highlights = []
  } = pkg || {};

  // Use primaryImage if available, otherwise use first image from images array
  const displayImage = primaryImage || (images && images[0]) || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop';
  
  // Use highlights if available, otherwise use features
  const displayFeatures = highlights.length > 0 ? highlights : features;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Card
      hover
      className={`group relative overflow-hidden ${className}`}
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="primary" size="sm">
            Premium
          </Badge>
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category */}
        <div className="mb-2">
          <Badge variant="secondary" size="sm">
            {category}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            {renderStars(rating)}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {rating.toFixed(1)}/5.0
          </span>
        </div>

        {/* Features */}
        {displayFeatures && displayFeatures.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {displayFeatures.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {feature}
                </span>
              ))}
              {displayFeatures.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{displayFeatures.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-primary-600">
              {formatPrice(perGuestPrice)}
            </span>
            <span className="text-gray-500 ml-1">per guest</span>
          </div>
          {basePrice && (
            <div className="text-sm text-gray-600">
              Base price: {formatPrice(basePrice)}
            </div>
          )}
        </div>


        {/* Actions */}
        <div className="flex gap-2">
          {showViewDetails && (
            <Link to={`/packages/${_id}`}>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 w-full"
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
          {showBookNow && (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => onBookNow?.(pkg)}
            >
              Book Now
            </Button>
          )}
        </div>

        {/* Hire Event Manager */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm"
            onClick={() => {
              // TODO: Implement hire event manager flow
              console.log('Hire Event Manager clicked');
            }}
          >
            Hire Event Manager
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PackageCard;
