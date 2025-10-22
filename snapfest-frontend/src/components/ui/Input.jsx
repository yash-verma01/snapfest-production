import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  icon,
  iconPosition = 'left',
  showPasswordToggle = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [inputType, setInputType] = React.useState(type);

  React.useEffect(() => {
    if (type === 'password' && showPassword) {
      setInputType('text');
    } else if (type === 'password' && !showPassword) {
      setInputType('password');
    } else {
      setInputType(type);
    }
  }, [type, showPassword]);

  const baseClasses = 'w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent';
  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500';
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';
  const iconClasses = icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';
  const passwordClasses = showPasswordToggle ? 'pr-10' : '';

  const classes = `${baseClasses} ${errorClasses} ${disabledClasses} ${iconClasses} ${passwordClasses} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={classes}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;





