import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight, X, Menu, Search, Filter } from 'lucide-react';

// Mobile-optimized Swipeable Carousel
export const MobileCarousel = ({ children, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleSwipe = (direction) => {
    if (direction === 'left' && currentIndex < children.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'right' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('left'),
    onSwipedRight: () => handleSwipe('right'),
    onSwiping: () => setIsDragging(true),
    onSwiped: () => setIsDragging(false)
  });

  return (
    <div className={`relative ${className}`}>
      <div
        {...swipeHandlers}
        className="overflow-hidden"
      >
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
            width: `${children.length * 100}%`
          }}
        >
          {children.map((child, index) => (
            <div key={index} className="w-full flex-shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {children.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Mobile-optimized Filter Drawer
export const MobileFilterDrawer = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Touch-friendly Floating Action Button
export const FloatingActionButton = ({ 
  icon, 
  onClick, 
  className = '',
  position = 'bottom-right',
  size = 'lg'
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} ${sizeClasses[size]} bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 touch-manipulation`}
    >
      {icon}
    </button>
  );
};

// Mobile-optimized Search Bar
export const MobileSearchBar = ({ 
  value, 
  onChange, 
  onSearch, 
  placeholder = "Search...",
  showFilters = false,
  onFilterClick
}) => {
  return (
    <div className="flex items-center space-x-2 p-4 bg-white border-b border-gray-200">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
        />
      </div>
      {showFilters && (
        <button
          onClick={onFilterClick}
          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          <Filter className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
};

// Touch-optimized Card with micro-interactions
export const TouchCard = ({ 
  children, 
  onClick, 
  className = '',
  disabled = false 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      className={`
        relative transition-all duration-200 cursor-pointer
        ${isPressed ? 'scale-95 shadow-md' : 'scale-100 shadow-sm hover:shadow-md'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
      onClick={disabled ? undefined : onClick}
      onTouchStart={() => !disabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </div>
  );
};

// Mobile-optimized Bottom Navigation
export const MobileBottomNav = ({ currentPath, onNavigate }) => {
  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/packages', icon: '📦', label: 'Packages' },
    { path: '/events', icon: '🎉', label: 'Events' },
    { path: '/venues', icon: '🏢', label: 'Venues' },
    { path: '/user/profile', icon: '👤', label: 'Profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentPath === item.path 
                ? 'text-primary-600 bg-primary-50' 
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default {
  MobileCarousel,
  MobileFilterDrawer,
  FloatingActionButton,
  MobileSearchBar,
  TouchCard,
  MobileBottomNav
};
