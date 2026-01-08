/**
 * Security Utility Functions
 * Provides sanitization and validation functions to prevent security vulnerabilities
 */

/**
 * Sanitize input for use in MongoDB regex queries
 * Prevents NoSQL injection and ReDoS (Regular Expression Denial of Service) attacks
 * 
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized string safe for regex use
 */
export const sanitizeRegex = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Escape all regex special characters
  // This prevents injection attacks and ReDoS
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitize input for use in MongoDB queries
 * Removes potentially dangerous characters
 * 
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and other control characters
  return input
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
};

/**
 * Validate and sanitize search query
 * Combines sanitization for safe database queries
 * 
 * @param {string} query - Search query from user
 * @param {number} maxLength - Maximum allowed length (default: 100)
 * @returns {string|null} - Sanitized query or null if invalid
 */
export const sanitizeSearchQuery = (query, maxLength = 100) => {
  if (!query || typeof query !== 'string') {
    return null;
  }

  // Trim and limit length
  let sanitized = query.trim();
  
  if (sanitized.length === 0) {
    return null;
  }

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove control characters
  sanitized = sanitizeInput(sanitized);

  return sanitized;
};

/**
 * Create safe regex pattern for MongoDB queries
 * Sanitizes input and creates case-insensitive regex
 * 
 * @param {string} input - User input
 * @returns {Object} - MongoDB regex query object
 */
export const createSafeRegex = (input) => {
  const sanitized = sanitizeRegex(input);
  
  if (!sanitized) {
    return null;
  }

  return {
    $regex: sanitized,
    $options: 'i' // Case-insensitive
  };
};

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number format (Indian)
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Indian phone number: 10 digits starting with 6-9
  return /^[6-9]\d{9}$/.test(digits);
};

/**
 * Sanitize file name to prevent path traversal attacks
 * 
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove Windows reserved characters
    .trim();
};

/**
 * Validate and limit string length
 * 
 * @param {string} input - Input string
 * @param {number} maxLength - Maximum allowed length
 * @param {number} minLength - Minimum required length (default: 0)
 * @returns {string|null} - Validated string or null if invalid
 */
export const validateLength = (input, maxLength, minLength = 0) => {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
};

export default {
  sanitizeRegex,
  sanitizeInput,
  sanitizeSearchQuery,
  createSafeRegex,
  isValidEmail,
  isValidPhone,
  sanitizeFilename,
  validateLength
};

