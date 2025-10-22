import React from 'react';

const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  ...props
}) => {
  const baseClasses = 'bg-white border border-gray-200 transition-all duration-200';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };
  
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  };
  
  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';
  
  const classes = `${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${roundedClasses[rounded]} ${hoverClasses} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;





