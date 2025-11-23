import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const MasonryGrid = ({ 
  children, 
  columns = 3, 
  gap = 16, 
  className = '' 
}) => {
  const [columnHeights, setColumnHeights] = useState([]);
  const [items, setItems] = useState([]);
  const gridRef = useRef(null);
  const itemRefs = useRef([]);

  // Memoize items to avoid unnecessary recalculations
  useEffect(() => {
    if (children && children.length > 0) {
      setItems(Array.isArray(children) ? children : [children]);
    }
  }, [children]);

  // Optimized layout calculation with actual height measurement
  const calculateLayout = useCallback(() => {
    if (!gridRef.current || items.length === 0) return;

    const gridWidth = gridRef.current.offsetWidth;
    if (gridWidth === 0) return; // Skip if not visible

    const columnWidth = (gridWidth - (gap * (columns - 1))) / columns;
    const newColumnHeights = new Array(columns).fill(0);
    const newItems = [];

    items.forEach((item, index) => {
      // Find the shortest column
      const shortestColumn = newColumnHeights.indexOf(Math.min(...newColumnHeights));
      
      // Try to get actual height from ref, otherwise estimate
      let itemHeight = 300; // Default estimate
      if (itemRefs.current[index]?.offsetHeight) {
        itemHeight = itemRefs.current[index].offsetHeight;
      }
      
      newItems.push({
        ...item,
        column: shortestColumn,
        top: newColumnHeights[shortestColumn],
        left: shortestColumn * (columnWidth + gap),
        width: columnWidth
      });

      newColumnHeights[shortestColumn] += itemHeight + gap;
    });

    setColumnHeights(newColumnHeights);
  }, [items, columns, gap]);

  // Debounced resize handler
  const debouncedCalculateLayout = useMemo(
    () => debounce(calculateLayout, 150),
    [calculateLayout]
  );

  useEffect(() => {
    // Initial calculation
    calculateLayout();
    
    // Use ResizeObserver for better performance than window resize
    let resizeObserver;
    if (gridRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(debouncedCalculateLayout);
      resizeObserver.observe(gridRef.current);
    }
    
    // Fallback to window resize if ResizeObserver not available
    const handleResize = debouncedCalculateLayout;
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (resizeObserver && gridRef.current) {
        resizeObserver.unobserve(gridRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateLayout, debouncedCalculateLayout]);

  return (
    <div 
      ref={gridRef}
      className={`relative ${className}`}
      style={{ height: Math.max(...columnHeights) }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          ref={(el) => { itemRefs.current[index] = el; }}
          className="absolute transition-all duration-300 ease-in-out"
          style={{
            width: item.width ? `${item.width}px` : `${(100 / columns) - (gap / (gridRef.current?.offsetWidth || 1) * 100)}%`,
            left: `${item.left}px`,
            top: `${item.top}px`
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;


