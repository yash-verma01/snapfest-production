import toast from 'react-hot-toast';

/**
 * Extracts user-friendly error messages from API errors
 */
export const getErrorMessage = (error) => {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorData = error.response?.data || error.data || {};
  const status = error.response?.status || error.status;

  // Handle validation errors with field-specific messages
  if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
    return formatValidationErrors(errorData.errors);
  }

  // Handle specific error messages from backend
  if (errorData.message) {
    return formatBackendMessage(errorData.message, status);
  }

  // Handle HTTP status codes
  if (status) {
    return formatStatusError(status);
  }

  // Handle network errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please check your internet connection and try again.';
  }

  if (error.message?.includes('Network Error')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Fallback
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Formats validation errors into user-friendly messages
 */
const formatValidationErrors = (errors) => {
  const fieldLabels = {
    'rating': 'Rating',
    'comment': 'Feedback',
    'feedback': 'Feedback',
    'bookingId': 'Booking',
    'name': 'Name',
    'email': 'Email',
    'phone': 'Phone Number',
    'password': 'Password',
    'eventDate': 'Event Date',
    'location': 'Location',
    'guests': 'Number of Guests',
    'subject': 'Subject',
    'message': 'Message'
  };

  const formattedErrors = errors.map(err => {
    const fieldLabel = fieldLabels[err.field] || err.field;
    let message = err.message;

    // Enhance common validation messages
    if (message.includes('required')) {
      message = `${fieldLabel} is required. Please fill in this field.`;
    } else if (message.includes('at least')) {
      message = `${fieldLabel}: ${err.message}. Please make it longer.`;
    } else if (message.includes('less than') || message.includes('maximum')) {
      message = `${fieldLabel}: ${err.message}. Please shorten it.`;
    } else if (message.includes('between')) {
      message = `${fieldLabel}: ${err.message}. Please adjust the value.`;
    } else if (message.includes('valid')) {
      message = `${fieldLabel}: ${err.message}. Please check the format.`;
    } else {
      message = `${fieldLabel}: ${err.message}`;
    }

    return message;
  });

  if (formattedErrors.length === 1) {
    return formattedErrors[0];
  }

  return `Please fix the following errors:\n\n${formattedErrors.map((err, i) => `${i + 1}. ${err}`).join('\n')}`;
};

/**
 * Formats backend error messages to be more user-friendly
 */
const formatBackendMessage = (message, status) => {
  // Common backend error patterns
  const errorPatterns = {
    'Validation failed': 'Please check your input and try again.',
    'Validation error': 'Please check your input and try again.',
    'required': 'This field is required. Please fill it in.',
    'invalid': 'The information you entered is invalid. Please check and try again.',
    'not found': 'The requested item was not found. Please try again.',
    'already exists': 'This information already exists. Please use different details.',
    'unauthorized': 'You are not authorized to perform this action. Please log in.',
    'forbidden': 'You do not have permission to perform this action.',
    'too common': 'This password is too common. Please choose a stronger, unique password.',
    'breach': 'This password has been found in a data breach. Please choose a different, unique password for your security.',
    'at least 10 characters': 'Your feedback must be at least 10 characters long. Please provide more details.',
    'less than 1000 characters': 'Your feedback is too long. Please keep it under 1000 characters.',
    'between 1 and 5': 'Please select a rating between 1 and 5 stars.',
    'completed bookings': 'You can only review completed bookings.',
    'already exists for this booking': 'You have already submitted a review for this booking.'
  };

  // Check for patterns and provide helpful messages
  for (const [pattern, friendlyMessage] of Object.entries(errorPatterns)) {
    if (message.toLowerCase().includes(pattern.toLowerCase())) {
      return friendlyMessage;
    }
  }

  return message;
};

/**
 * Formats HTTP status code errors
 */
const formatStatusError = (status) => {
  const statusMessages = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'You are not logged in. Please log in and try again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested item was not found.',
    409: 'This information already exists. Please use different details.',
    422: 'The information you provided is invalid. Please check and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. Please try again later or contact support if the problem persists.',
    503: 'Service temporarily unavailable. Please try again later.'
  };

  return statusMessages[status] || `An error occurred (Error ${status}). Please try again.`;
};

/**
 * Shows error toast with proper formatting
 */
export const showErrorToast = (error, customMessage = null) => {
  const message = customMessage || getErrorMessage(error);
  
  toast.error(message, {
    duration: 6000,
    position: 'top-right',
    style: {
      background: '#fee2e2',
      color: '#991b1b',
      padding: '16px',
      borderRadius: '8px',
      maxWidth: '500px',
      borderLeft: '4px solid #dc2626',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    iconTheme: {
      primary: '#dc2626',
      secondary: '#fff'
    }
  });
};

/**
 * Shows validation errors in a formatted way
 */
export const showValidationErrors = (errors) => {
  if (!errors || errors.length === 0) return;

  const message = Array.isArray(errors) 
    ? formatValidationErrors(errors)
    : errors;

  showErrorToast(null, message);
};

