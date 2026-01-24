/**
 * URL Transformation Utility
 * Converts old localhost URLs to Azure Blob Storage URLs
 */

import { isBlobStorageAvailable, generateBlobUrl } from '../services/blobStorage.js';

/**
 * Transform old localhost URLs to blob storage URLs
 * @param {string} url - Image URL (can be localhost, blob URL, or already correct)
 * @returns {string} - Transformed URL
 */
export const transformImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  // If already a blob URL, return as-is
  if (url.includes('.blob.core.windows.net')) {
    return url;
  }

  // If already a full URL (Cloudinary, etc.), check if it needs transformation
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Check if it's a localhost URL or incorrect Azure URL that needs transformation
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
    const isIncorrectAzureUrl = url.includes('azurewebsites.net') && (url.includes(':8080') || url.includes(':5001') || url.includes('/PUBLIC/'));
    
    if (isLocalhost || isIncorrectAzureUrl) {
      try {
        const urlObj = new URL(url);
        let path = urlObj.pathname;
        
        // Remove leading slash
        path = path.replace(/^\/+/, '');
        
        // If path starts with PUBLIC/uploads, convert to blob storage format
        if (path.startsWith('PUBLIC/uploads/')) {
          // Convert: PUBLIC/uploads/packages/image.jpg -> uploads/packages/image.jpg
          const blobPath = path.replace(/^PUBLIC\//, '');
          
          // Generate blob URL if blob storage is available
          if (isBlobStorageAvailable()) {
            const blobUrl = generateBlobUrl(blobPath);
            if (blobUrl) {
              return blobUrl;
            }
          }
          
          // Fallback: Use production backend URL (without port) if blob storage not available
          const backendUrl = process.env.BACKEND_URL || 'https://snapfest-api.azurewebsites.net';
          // Remove any port from backend URL
          const cleanBackendUrl = backendUrl.replace(/:\d+$/, '').replace(/:\d+\//, '/');
          return `${cleanBackendUrl}/${path}`;
        }
      } catch (error) {
        // If URL parsing fails, try to extract path manually
        console.warn('⚠️ URL parsing failed:', url, error.message);
        
        // Try to extract path from localhost URLs manually
        const localhostMatch = url.match(/\/PUBLIC\/uploads\/(.+)$/);
        if (localhostMatch) {
          const blobPath = `uploads/${localhostMatch[1]}`;
          
          if (isBlobStorageAvailable()) {
            const blobUrl = generateBlobUrl(blobPath);
            if (blobUrl) {
              return blobUrl;
            }
          }
          
          const backendUrl = process.env.BACKEND_URL || 'https://snapfest-api.azurewebsites.net';
          const cleanBackendUrl = backendUrl.replace(/:\d+$/, '').replace(/:\d+\//, '/');
          return `${cleanBackendUrl}/PUBLIC/uploads/${localhostMatch[1]}`;
        }
      }
    }
    
    // Other full URLs (Cloudinary, etc.) - return as-is
    return url;
  }

  // If it's a relative path (starts with PUBLIC/ or uploads/)
  if (url.startsWith('PUBLIC/uploads/') || url.startsWith('uploads/')) {
    let blobPath = url;
    
    // Remove PUBLIC/ prefix if present
    if (blobPath.startsWith('PUBLIC/')) {
      blobPath = blobPath.replace(/^PUBLIC\//, '');
    }
    
    // Generate blob URL if blob storage is available
    if (isBlobStorageAvailable()) {
      const blobUrl = generateBlobUrl(blobPath);
      if (blobUrl) {
        return blobUrl;
      }
    }
    
    // Fallback: Use backend URL (without port)
    const backendUrl = process.env.BACKEND_URL || 'https://snapfest-api.azurewebsites.net';
    const cleanBackendUrl = backendUrl.replace(/:\d+$/, '').replace(/:\d+\//, '/');
    return `${cleanBackendUrl}/${blobPath.startsWith('PUBLIC/') ? blobPath : `PUBLIC/uploads/${blobPath.replace(/^uploads\//, '')}`}`;
  }

  // Return as-is if no transformation needed
  return url;
};

/**
 * Transform image URLs in an object or array
 * @param {Object|Array|string} data - Data containing image URLs
 * @param {Array<string>} imageFields - Fields that contain image URLs (e.g., ['primaryImage', 'images', 'image'])
 * @returns {Object|Array|string} - Transformed data
 */
export const transformImageUrls = (data, imageFields = ['primaryImage', 'images', 'image', 'profileImage']) => {
  if (!data) {
    return data;
  }

  // If it's a string (single URL), transform it
  if (typeof data === 'string') {
    return transformImageUrl(data);
  }

  // If it's an array
  if (Array.isArray(data)) {
    return data.map(item => transformImageUrls(item, imageFields));
  }

  // If it's an object
  if (typeof data === 'object') {
    const transformed = { ...data };
    
    for (const field of imageFields) {
      if (transformed[field]) {
        if (Array.isArray(transformed[field])) {
          // Transform array of URLs
          transformed[field] = transformed[field].map(url => transformImageUrl(url));
        } else if (typeof transformed[field] === 'string') {
          // Transform single URL
          transformed[field] = transformImageUrl(transformed[field]);
        }
      }
    }
    
    // Recursively transform nested objects
    for (const key in transformed) {
      if (transformed[key] && typeof transformed[key] === 'object' && !Array.isArray(transformed[key])) {
        transformed[key] = transformImageUrls(transformed[key], imageFields);
      }
    }
    
    return transformed;
  }

  return data;
};

export default {
  transformImageUrl,
  transformImageUrls
};
