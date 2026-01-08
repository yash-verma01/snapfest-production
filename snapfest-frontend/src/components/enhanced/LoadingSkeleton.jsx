import React from 'react';

const LoadingSkeleton = ({ 
  type = 'card',
  className = '',
  count = 1 
}) => {
  const SkeletonCard = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 animate-pulse">
      <div className="h-48 bg-gradient-to-r from-pink-100 to-red-100 rounded-2xl mb-4"></div>
      <div className="h-6 bg-gradient-to-r from-pink-200 to-red-200 rounded-lg mb-2 w-3/4"></div>
      <div className="h-4 bg-gradient-to-r from-pink-100 to-red-100 rounded-lg w-1/2"></div>
    </div>
  );

  const SkeletonText = () => (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-gradient-to-r from-pink-200 to-red-200 rounded-lg w-full"></div>
      <div className="h-4 bg-gradient-to-r from-pink-200 to-red-200 rounded-lg w-5/6"></div>
      <div className="h-4 bg-gradient-to-r from-pink-200 to-red-200 rounded-lg w-4/6"></div>
    </div>
  );

  const SkeletonImage = () => (
    <div className="bg-gradient-to-r from-pink-100 to-red-100 rounded-2xl animate-pulse aspect-video"></div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <SkeletonCard />;
      case 'text':
        return <SkeletonText />;
      case 'image':
        return <SkeletonImage />;
      default:
        return <SkeletonCard />;
    }
  };

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={count > 1 ? 'mb-4' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;







