import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToBlob, isBlobStorageAvailable, isBlobUrl, deleteFromBlob, generateBlobUrl } from '../services/blobStorage.js';

// ==================== STORAGE CONFIGURATION ====================

// Check if blob storage is available
const useBlobStorage = isBlobStorageAvailable();

// Create storage factory that accepts entity type
// Uses memory storage if blob storage is available, otherwise disk storage
const createStorage = (entityType) => {
  if (useBlobStorage) {
    // Use memory storage - files will be uploaded to blob storage after multer processes them
    return multer.memoryStorage();
  } else {
    // Fallback to disk storage for local development
    return multer.diskStorage({
      destination: (req, file, cb) => {
        // Determine upload path based on entity type
        const entityFolder = entityType || 'general';
        const uploadPath = `PUBLIC/uploads/${entityFolder}/`;
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
      }
    });
  }
};

// ==================== FILE FILTER ====================

// Allowed file types and extensions
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const fileFilter = (req, file, cb) => {
  // Check file extension (more reliable than mimetype alone)
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
  
  // Check MIME type (can be spoofed, but still useful)
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    return cb(new Error('Invalid file type. Only image files are allowed!'), false);
  }
  
  // Additional security: Check if mimetype matches extension
  const expectedMimeTypes = {
    '.jpg': ['image/jpeg', 'image/jpg'],
    '.jpeg': ['image/jpeg', 'image/jpg'],
    '.png': ['image/png'],
    '.gif': ['image/gif'],
    '.webp': ['image/webp']
  };
  
  const expectedTypes = expectedMimeTypes[ext];
  if (expectedTypes && !expectedTypes.includes(file.mimetype.toLowerCase())) {
    return cb(new Error('File extension and MIME type mismatch. Possible file spoofing detected.'), false);
  }
  
  cb(null, true);
};

// ==================== MULTER CONFIGURATION ====================

// Create multer instance factory
const createMulterInstance = (entityType) => {
  return multer({
    storage: createStorage(entityType),
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 10 // Maximum 10 files
    }
  });
};

// ==================== POST-UPLOAD PROCESSING ====================

/**
 * Process uploaded file(s) and upload to blob storage if configured
 * This middleware should be called after multer middleware
 * @param {Object} req - Express request object
 * @param {string} entityType - Entity type (packages, events, venues, beatbloom, profiles)
 * @returns {Promise<void>}
 */
export const processUploadedFiles = async (req, entityType = 'packages') => {
  if (!useBlobStorage) {
    // If blob storage not available, files are already saved to disk
    return;
  }

  try {
    // Process single file upload
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = `${baseName}-${uniqueSuffix}${ext}`;
      const blobName = `uploads/${entityType}/${fileName}`;

      // Determine content type
      const contentTypeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      const contentType = contentTypeMap[ext] || file.mimetype || 'image/jpeg';

      // Upload to blob storage
      const blobUrl = await uploadToBlob(file.buffer, blobName, contentType);
      
      if (blobUrl) {
        // Store blob URL in file object for generatePublicUrl to use
        req.file.blobUrl = blobUrl;
        req.file.path = blobName; // Store blob name for reference
        console.log(`✅ Uploaded to blob storage: ${blobName}`);
      }
    }

    // Process multiple file uploads
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `${baseName}-${uniqueSuffix}${ext}`;
        const blobName = `uploads/${entityType}/${fileName}`;

        const contentTypeMap = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        };
        const contentType = contentTypeMap[ext] || file.mimetype || 'image/jpeg';

        const blobUrl = await uploadToBlob(file.buffer, blobName, contentType);
        
        if (blobUrl) {
          file.blobUrl = blobUrl;
          file.path = blobName;
          console.log(`✅ Uploaded to blob storage: ${blobName}`);
        }
      }
    }

    // Process mixed uploads (fields)
    if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
      for (const fieldName in req.files) {
        const files = Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [req.files[fieldName]];
        for (const file of files) {
          const ext = path.extname(file.originalname).toLowerCase();
          const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const fileName = `${baseName}-${uniqueSuffix}${ext}`;
          const blobName = `uploads/${entityType}/${fileName}`;

          const contentTypeMap = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
          };
          const contentType = contentTypeMap[ext] || file.mimetype || 'image/jpeg';

          const blobUrl = await uploadToBlob(file.buffer, blobName, contentType);
          
          if (blobUrl) {
            file.blobUrl = blobUrl;
            file.path = blobName;
            console.log(`✅ Uploaded to blob storage: ${blobName}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error processing uploaded files:', error);
    throw error;
  }
};

// ==================== UPLOAD MIDDLEWARE ====================

// Single image upload
export const uploadSingle = (fieldName, entityType = 'profiles') => {
  const upload = createMulterInstance(entityType);
  return upload.single(fieldName);
};

// Multiple images upload
export const uploadMultiple = (fieldName, maxCount = 10, entityType = 'packages') => {
  const upload = createMulterInstance(entityType);
  return upload.array(fieldName, maxCount);
};

// Mixed upload (single + multiple)
export const uploadMixed = (fields, entityType = 'packages') => {
  const upload = createMulterInstance(entityType);
  return upload.fields(fields);
};

// ==================== PUBLIC URL GENERATION ====================

/**
 * Generate a public URL for an uploaded file
 * @param {string|Object} filePathOrFile - The local file path or file object (e.g., "PUBLIC/uploads/packages/photo-123.jpg" or req.file)
 * @param {string} entityType - The entity type (packages, events, venues, beatbloom, profiles)
 * @param {Object} req - Express request object (optional, for getting protocol and host)
 * @returns {string} - Public URL (blob URL if blob storage is used, otherwise local URL)
 */
export const generatePublicUrl = (filePathOrFile, entityType = 'packages', req = null) => {
  // Handle file object (from multer with blob storage)
  if (filePathOrFile && typeof filePathOrFile === 'object' && filePathOrFile.blobUrl) {
    return filePathOrFile.blobUrl;
  }

  // Extract file path if it's an object
  const filePath = typeof filePathOrFile === 'object' ? filePathOrFile?.path : filePathOrFile;

  // If filePath is already a full URL (blob URL, Cloudinary, etc.), return as is
  if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
    return filePath;
  }

  // If no filePath, return empty string
  if (!filePath) {
    return '';
  }

  // If blob storage is available and path looks like a blob name (uploads/...)
  if (useBlobStorage && filePath.startsWith('uploads/')) {
    const blobUrl = generateBlobUrl(filePath);
    if (blobUrl) {
      return blobUrl;
    }
  }

  // Fallback to local storage URL generation
  // Normalize the path - remove leading slash if present
  let normalizedPath = filePath.replace(/^\/+/, '');
  
  // If path doesn't start with PUBLIC, add it
  if (!normalizedPath.startsWith('PUBLIC/')) {
    normalizedPath = `PUBLIC/uploads/${entityType}/${path.basename(normalizedPath)}`;
  }

  // Generate URL based on environment
  const defaultPort = process.env.PORT || 5001;
  const defaultHost = `localhost:${defaultPort}`;
  
  if (req) {
    // Use request object to get protocol and host
    const protocol = req.protocol || 'http';
    // Try multiple methods to get the host
    let host = req.get('host');
    
    // If host doesn't include port, add it
    if (host && !host.includes(':')) {
      host = `${host}:${defaultPort}`;
    }
    
    // Fallback to default if host is still not available
    host = host || defaultHost;
    
    return `${protocol}://${host}/${normalizedPath}`;
  } else {
    // Fallback for cases where req is not available
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.BACKEND_URL || defaultHost;
    return `${protocol}://${host}/${normalizedPath}`;
  }
};

// ==================== IMAGE DELETION ====================

/**
 * Delete an image file from storage (blob storage or local filesystem)
 * @param {string} imageUrl - The image URL (can be full URL or relative path)
 * @returns {Promise<boolean>} - True if deleted successfully, false otherwise
 */
export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return false;
    }

    // If it's a Cloudinary URL (old uploads), skip deletion
    if (imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary.com')) {
      console.log('Skipping deletion of Cloudinary URL:', imageUrl);
      return true; // Return true to avoid errors, but don't actually delete
    }

    // Check if it's a blob storage URL
    if (isBlobUrl(imageUrl)) {
      const deleted = await deleteFromBlob(imageUrl);
      return deleted;
    }

    // Fallback to local filesystem deletion
    // Extract file path from URL
    let filePath = imageUrl;
    
    // If it's a full URL, extract the path
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Extract path after domain (e.g., "PUBLIC/uploads/packages/photo.jpg")
      const urlObj = new URL(imageUrl);
      filePath = urlObj.pathname.substring(1); // Remove leading slash
    }

    // Ensure path starts with PUBLIC
    if (!filePath.startsWith('PUBLIC/')) {
      // Try to construct path from URL
      const parts = filePath.split('/');
      const filename = parts[parts.length - 1];
      // Try to find which entity folder it might be in
      if (filePath.includes('packages')) {
        filePath = `PUBLIC/uploads/packages/${filename}`;
      } else if (filePath.includes('events')) {
        filePath = `PUBLIC/uploads/events/${filename}`;
      } else if (filePath.includes('venues')) {
        filePath = `PUBLIC/uploads/venues/${filename}`;
      } else if (filePath.includes('beatbloom')) {
        filePath = `PUBLIC/uploads/beatbloom/${filename}`;
      } else if (filePath.includes('profiles')) {
        filePath = `PUBLIC/uploads/profiles/${filename}`;
      } else {
        filePath = `PUBLIC/uploads/${filename}`;
      }
    }

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Deleted file:', filePath);
      return true;
    } else {
      console.log('File not found:', filePath);
      return false;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// ==================== IMAGE PROCESSING ====================

/**
 * Process image (placeholder for future image processing needs)
 * Currently returns the file path as-is since we're using local storage
 * @param {string} imagePath - The image path
 * @param {Object} transformations - Transformation options (for future use)
 * @returns {Promise<string>} - The processed image path
 */
export const processImage = async (imagePath, transformations = {}) => {
  // For local storage, just return the path as-is
  // Future: Can add image processing using sharp or similar library
  return imagePath;
};

// ==================== IMAGE VALIDATION ====================

export const validateImage = (file) => {
  const errors = [];
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    errors.push('Image size must be less than 5MB');
  }
  
  // Check minimum file size (prevent empty files)
  if (file.size < 100) {
    errors.push('File is too small. Minimum size is 100 bytes');
  }
  
  // Check file extension
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
  
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype?.toLowerCase())) {
    errors.push('Only JPEG, PNG, GIF, and WebP images are allowed');
  }
  
  // Check if mimetype matches extension
  const expectedMimeTypes = {
    '.jpg': ['image/jpeg', 'image/jpg'],
    '.jpeg': ['image/jpeg', 'image/jpg'],
    '.png': ['image/png'],
    '.gif': ['image/gif'],
    '.webp': ['image/webp']
  };
  
  const expectedTypes = expectedMimeTypes[ext];
  if (expectedTypes && !expectedTypes.includes(file.mimetype?.toLowerCase())) {
    errors.push('File extension and MIME type mismatch. Possible file spoofing detected.');
  }
  
  // Check filename for path traversal attempts
  if (file.originalname && (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\'))) {
    errors.push('Invalid filename. Path traversal detected.');
  }
  
  // Check dimensions (optional)
  // You can add dimension validation here if needed
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default multer;
