import React from 'react';
import { Card } from '../ui';

const VendorStatsCard = ({
  title,
  value,
  icon,
  change,
  changeType = 'positive',
  description,
  trend,
  className = ''
}) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-green-600';
    if (changeType === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return '↗';
    if (changeType === 'negative') return '↘';
    return '→';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'bg-green-100 text-green-800';
    if (trend === 'down') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={`p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 truncate">{value}</p>
          {change && (
            <div className={`flex items-center text-xs sm:text-sm ${getChangeColor()}`}>
              <span className="mr-1">{getChangeIcon()}</span>
              <span className="truncate">{change}</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-1 truncate">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-50 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
      {trend && (
        <div className="mt-3 sm:mt-4">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trend}
          </div>
        </div>
      )}
    </Card>
  );
};

export default VendorStatsCard;





