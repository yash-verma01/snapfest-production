import toast from 'react-hot-toast';

// Notification utility functions
const notificationUtils = {
  // Success notification
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      ...options
    });
  },

  // Error notification
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      ...options
    });
  },

  // Warning notification
  warning: (message, options = {}) => {
    return toast(message, {
      icon: '⚠️',
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#fbbf24',
        color: '#fff'
      },
      ...options
    });
  },

  // Info notification
  info: (message, options = {}) => {
    return toast(message, {
      icon: 'ℹ️',
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#3b82f6',
        color: '#fff'
      },
      ...options
    });
  },

  // Loading notification
  loading: (message, options = {}) => {
    return toast.loading(message, {
      duration: Infinity,
      position: 'top-right',
      ...options
    });
  },

  // Promise notification
  promise: (promise, messages, options = {}) => {
    return toast.promise(promise, messages, {
      duration: 4000,
      position: 'top-right',
      ...options
    });
  },

  // Dismiss notification
  dismiss: (toastId) => {
    return toast.dismiss(toastId);
  },

  // Dismiss all notifications
  dismissAll: () => {
    return toast.dismiss();
  },

  // Custom notification
  custom: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      ...options
    });
  },

  // API error handler
  handleApiError: (error, defaultMessage = 'Something went wrong') => {
    const message = error?.response?.data?.message || error?.message || defaultMessage;
    return notificationUtils.error(message);
  },

  // Form validation errors
  showValidationErrors: (errors) => {
    Object.keys(errors).forEach(field => {
      const fieldErrors = errors[field];
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach(error => {
          notificationUtils.error(error);
        });
      } else {
        notificationUtils.error(fieldErrors);
      }
    });
  },

  // Booking notifications
  bookingCreated: (bookingId) => {
    return notificationUtils.success(`Booking #${bookingId} created successfully!`);
  },

  bookingUpdated: (bookingId) => {
    return notificationUtils.success(`Booking #${bookingId} updated successfully!`);
  },

  bookingCancelled: (bookingId) => {
    return notificationUtils.warning(`Booking #${bookingId} has been cancelled.`);
  },

  // Payment notifications
  paymentSuccess: (amount) => {
    return notificationUtils.success(`Payment of ₹${amount} completed successfully!`);
  },

  paymentFailed: (error) => {
    return notificationUtils.error(`Payment failed: ${error}`);
  },

  // Cart notifications
  itemAddedToCart: (itemName) => {
    return notificationUtils.success(`${itemName} added to cart!`);
  },

  itemRemovedFromCart: (itemName) => {
    return notificationUtils.warning(`${itemName} removed from cart.`);
  },

  cartCleared: () => {
    return notificationUtils.info('Cart cleared successfully.');
  },

  // Profile notifications
  profileUpdated: () => {
    return notificationUtils.success('Profile updated successfully!');
  },

  passwordChanged: () => {
    return notificationUtils.success('Password changed successfully!');
  },

  // System notifications
  sessionExpired: () => {
    return notificationUtils.warning('Your session has expired. Please log in again.');
  },

  networkError: () => {
    return notificationUtils.error('Network error. Please check your connection.');
  },

  // Confirmation dialog
  confirm: (message, onConfirm, onCancel) => {
    return toast((t) => {
      const div = document.createElement('div');
      div.className = 'flex flex-col space-y-2';
      div.innerHTML = `
        <span>${message}</span>
        <div class="flex space-x-2">
          <button class="px-3 py-1 bg-red-600 text-white rounded text-sm" data-action="confirm">
            Confirm
          </button>
          <button class="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm" data-action="cancel">
            Cancel
          </button>
        </div>
      `;
      
      div.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'confirm') {
          onConfirm();
          toast.dismiss(t.id);
        } else if (e.target.dataset.action === 'cancel') {
          onCancel?.();
          toast.dismiss(t.id);
        }
      });
      
      return div;
    }, {
      duration: Infinity,
      position: 'top-center'
    });
  }
};

export default notificationUtils;
