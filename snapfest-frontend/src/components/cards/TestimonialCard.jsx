import React, { memo } from 'react';
import { Star, Quote } from 'lucide-react';
import Card from '../ui/Card';

const TestimonialCard = memo(({
  testimonial,
  className = ''
}) => {
  const {
    id,
    name,
    avatar,
    rating,
    review,
    event,
    date,
    location
  } = testimonial;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Card className={`relative ${className}`}>
      {/* Quote Icon */}
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
        <Quote className="w-4 h-4 text-primary-600" />
      </div>

      {/* Rating */}
      <div className="flex items-center mb-3">
        {renderStars(rating)}
      </div>

      {/* Review Text */}
      <blockquote className="text-gray-700 mb-4 italic">
        "{review}"
      </blockquote>

      {/* Event Info */}
      {event && (
        <div className="text-sm text-gray-600 mb-3">
          <span className="font-medium">Event:</span> {event}
          {location && <span className="ml-2">• {location}</span>}
        </div>
      )}

      {/* User Info */}
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
          <img
            src={avatar || '/api/placeholder/40/40'}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="font-semibold text-gray-900">{name}</div>
          {date && (
            <div className="text-sm text-gray-500">{date}</div>
          )}
        </div>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.testimonial?.id === nextProps.testimonial?.id &&
    prevProps.className === nextProps.className
  );
});

TestimonialCard.displayName = 'TestimonialCard';

export default TestimonialCard;





