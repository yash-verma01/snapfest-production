import React from 'react';

// Skeleton components for different content types
export const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
);

export const SkeletonPackageCard = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
);

export const SkeletonEventCard = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1"></div>
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-6 py-4 border-b border-gray-100">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-3 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonList = ({ items = 3 }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md p-6">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    ))}
  </div>
);

export const SkeletonProfile = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="flex items-center space-x-4 mb-6">
      <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

export default {
  SkeletonCard,
  SkeletonPackageCard,
  SkeletonEventCard,
  SkeletonTable,
  SkeletonList,
  SkeletonDashboard,
  SkeletonProfile
};

