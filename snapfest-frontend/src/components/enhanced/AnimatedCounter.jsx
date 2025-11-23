import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSpring, animated } from '@react-spring/web';

const AnimatedCounter = ({ 
  value, 
  duration = 2000,
  suffix = '',
  prefix = '',
  className = ''
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.5
  });

  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0
    : value;

  const { number } = useSpring({
    number: inView ? numericValue : 0,
    from: { number: 0 },
    config: { duration },
  });

  return (
    <span ref={ref} className={className}>
      <animated.span>
        {number.to((n) => {
          if (typeof value === 'string' && value.includes('+')) {
            return `${Math.floor(n).toLocaleString()}+`;
          }
          if (typeof value === 'string' && value.includes('%')) {
            return `${Math.floor(n)}%`;
          }
          return `${prefix}${Math.floor(n).toLocaleString()}${suffix}`;
        })}
      </animated.span>
    </span>
  );
};

export default AnimatedCounter;

