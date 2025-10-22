// Validation utility functions
const validationUtils = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone number validation (Indian format)
  isValidPhone: (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  },

  // Password strength validation
  validatePassword: (password) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: calculatePasswordStrength(password)
    };
  },

  // Calculate password strength
  calculatePasswordStrength: (password) => {
    let score = 0;
    
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  },

  // Name validation
  isValidName: (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  },

  // Required field validation
  isRequired: (value) => {
    return value !== null && value !== undefined && value !== '';
  },

  // Minimum length validation
  hasMinLength: (value, minLength) => {
    return value && value.length >= minLength;
  },

  // Maximum length validation
  hasMaxLength: (value, maxLength) => {
    return !value || value.length <= maxLength;
  },

  // Number validation
  isValidNumber: (value, min = null, max = null) => {
    const num = Number(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
  },

  // Date validation
  isValidDate: (date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },

  // Future date validation
  isFutureDate: (date) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d > today;
  },

  // URL validation
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Form validation helper
  validateForm: (data, rules) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const value = data[field];
      const fieldRules = rules[field];
      
      fieldRules.forEach(rule => {
        if (rule.required && !validationUtils.isRequired(value)) {
          errors[field] = errors[field] || [];
          errors[field].push(`${field} is required`);
        }
        
        if (rule.minLength && !validationUtils.hasMinLength(value, rule.minLength)) {
          errors[field] = errors[field] || [];
          errors[field].push(`${field} must be at least ${rule.minLength} characters`);
        }
        
        if (rule.maxLength && !validationUtils.hasMaxLength(value, rule.maxLength)) {
          errors[field] = errors[field] || [];
          errors[field].push(`${field} must be no more than ${rule.maxLength} characters`);
        }
        
        if (rule.email && value && !validationUtils.isValidEmail(value)) {
          errors[field] = errors[field] || [];
          errors[field].push(`${field} must be a valid email`);
        }
        
        if (rule.phone && value && !validationUtils.isValidPhone(value)) {
          errors[field] = errors[field] || [];
          errors[field].push(`${field} must be a valid phone number`);
        }
        
        if (rule.custom && !rule.custom(value)) {
          errors[field] = errors[field] || [];
          errors[field].push(rule.message || `${field} is invalid`);
        }
      });
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default validationUtils;





