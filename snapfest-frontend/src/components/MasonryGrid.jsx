import React, { useState, useEffect, useRef } from 'react';

const MasonryGrid = ({ 
  children, 
  columns = 3, 
  gap = 16, 
  className = '' 
}) => {
  const [columnHeights, setColumnHeights] = useState([]);
  const [items, setItems] = useState([]);
  const gridRef = useRef(null);

  useEffect(() => {
    if (children && children.length > 0) {
      setItems(Array.isArray(children) ? children : [children]);
    }
  }, [children]);

  useEffect(() => {
    const calculateLayout = () => {
      if (!gridRef.current || items.length === 0) return;

      const gridWidth = gridRef.current.offsetWidth;
      const columnWidth = (gridWidth - (gap * (columns - 1))) / columns;
      const newColumnHeights = new Array(columns).fill(0);
      const newItems = [];

      items.forEach((item, index) => {
        // Find the shortest column
        const shortestColumn = newColumnHeights.indexOf(Math.min(...newColumnHeights));
        
        newItems.push({
          ...item,
          column: shortestColumn,
          top: newColumnHeights[shortestColumn],
          left: shortestColumn * (columnWidth + gap)
        });

        // Estimate item height (you might want to make this more sophisticated)
        const estimatedHeight = 300 + Math.random() * 200; // Random height for demo
        newColumnHeights[shortestColumn] += estimatedHeight + gap;
      });

      setColumnHeights(newColumnHeights);
    };

    calculateLayout();
    
    const handleResize = () => {
      setTimeout(calculateLayout, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [items, columns, gap]);

  return (
    <div 
      ref={gridRef}
      className={`relative ${className}`}
      style={{ height: Math.max(...columnHeights) }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="absolute transition-all duration-300 ease-in-out"
          style={{
            width: `${(100 / columns) - (gap / gridRef.current?.offsetWidth * 100)}%`,
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


