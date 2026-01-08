import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, ShoppingCart, Sparkles, Crown, Check } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import BookingModal from '../modals/BookingModal';
import { useCart } from '../../hooks';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const PackageCard = memo(({
  packageData: pkg,
  onBookNow,
  onViewDetails,
  showBookNow = true,
  showViewDetails = true,
  className = ''
}) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const {
    _id,
    title = 'Untitled Package',
    description = 'No description available',
    basePrice = 0,
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

  const formatCategory = (cat) => {
    if (!cat) return 'General';
    return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderStars = (rating, size = 'sm') => {
    const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${starSize} transition-all duration-200 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current drop-shadow-sm' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleAddToCart = async (packageId, customization, extra) => {
    setIsAddingToCart(true);
    try {
      await addToCart(packageId, customization, extra);
      // Success handled by the modal
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToCartClick = () => {
    if (!isSignedIn) {
      navigate('/login', { state: { from: `/packages/${_id}` } });
      return;
    }
    setShowBookingModal(true);
  };

  return (
    <Card
      hover
      className={`group relative overflow-hidden bg-white border-2 border-gray-100 shadow-xl hover:shadow-2xl rounded-2xl transition-all duration-500 ${className}`}
    >
      {/* Decorative gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>


      {/* Image Section - Compact with Rating Overlay */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop';
          }}
        />
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {/* Rating on Image - Always Visible */}
        <div className="absolute bottom-2 right-2 z-10">
          <div className="flex items-center gap-0.5 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
            {renderStars(rating, 'sm')}
            <span className="ml-1 text-xs font-bold text-gray-900">{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Category Badge on Image */}
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-white/95 backdrop-blur-sm text-pink-600 font-semibold px-2 py-0.5 text-xs shadow-md border-0">
            {formatCategory(category)}
          </Badge>
        </div>

        {/* Premium Badge on Image */}
        {isPremium && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold px-2 py-0.5 text-xs shadow-lg border-0 flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section - Compact */}
      <div className="p-4 bg-white">
        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-pink-600 transition-colors duration-300">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-xs mb-3 line-clamp-2 leading-snug">
          {description}
        </p>

        {/* Features - Compact */}
        {displayFeatures && displayFeatures.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {displayFeatures.slice(0, 2).map((feature, index) => (
                <span
                  key={index}
                  className="text-xs bg-gradient-to-r from-pink-50 to-red-50 text-pink-700 font-medium px-2 py-0.5 rounded-full border border-pink-200"
                >
                  {typeof feature === 'string' ? feature : feature.name || feature}
                </span>
              ))}
              {displayFeatures.length > 2 && (
                <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                  +{displayFeatures.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price - Compact */}
        <div className="mb-3 p-2.5 bg-gradient-to-r from-pink-50 to-red-50 rounded-lg border border-pink-100">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-gray-600 font-medium block mb-0.5">Starting from</span>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                {formatPrice(basePrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions - Compact */}
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {showViewDetails && (
              <Link to={`/packages/${_id}`} className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs py-1.5 border border-gray-300 hover:border-pink-500 hover:bg-pink-50 hover:text-pink-600 font-medium transition-all duration-300"
                >
                  View Details
                </Button>
              </Link>
            )}
            {showBookNow && (
              <Button
                variant="primary"
                size="sm"
                className="flex-1 text-xs py-1.5 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                onClick={handleAddToCartClick}
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                Add to Cart
              </Button>
            )}
          </div>

          {/* Hire Event Manager - Compact */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs py-1.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-all duration-300"
            onClick={() => {
              navigate('/contact');
            }}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Hire Event Manager
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onAddToCart={handleAddToCart}
        packageData={pkg}
        loading={isAddingToCart}
      />
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.packageData?._id === nextProps.packageData?._id &&
    prevProps.showBookNow === nextProps.showBookNow &&
    prevProps.showViewDetails === nextProps.showViewDetails &&
    prevProps.className === nextProps.className
  );
});

PackageCard.displayName = 'PackageCard';

export default PackageCard;
