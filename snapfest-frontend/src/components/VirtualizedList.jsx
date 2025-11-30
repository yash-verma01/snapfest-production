import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Lightweight virtualization component using Intersection Observer
 * Only renders items that are visible in the viewport
 */
const VirtualizedList = ({ 
  items, 
  renderItem, 
  itemHeight = 200,
  containerHeight = 600,
  overscan = 3, // Number of items to render outside viewport
  className = ''
}) => {
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(10, items.length) });
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setScrollTop(scrollTop);
      
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const end = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      );
      
      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [items.length, itemHeight, containerHeight, overscan]);

  // Calculate total height for scroll container
  const totalHeight = items.length * itemHeight;
  
  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange.start, visibleRange.end]);

  // Offset for items before visible range
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(VirtualizedList);







