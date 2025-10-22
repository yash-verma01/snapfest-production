import React from 'react';
import { Card } from '../ui';

const StatsCard = ({
  title,
  value,
  icon,
  change,
  changeType = 'positive',
  description,
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

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <div className={`flex items-center text-sm ${getChangeColor()}`}>
              <span className="mr-1">{getChangeIcon()}</span>
              <span>{change}</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;





