import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==================== CLOUDINARY STORAGE ====================

// Cloudinary storage configuration
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'snapfest',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

// ==================== LOCAL STORAGE ====================

// Local storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ==================== FILE FILTER ====================

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// ==================== MULTER CONFIGURATION ====================

// Choose storage based on environment
const storage = process.env.NODE_ENV === 'production' ? cloudinaryStorage : localStorage;

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
});

// ==================== UPLOAD MIDDLEWARE ====================

// Single image upload
export const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Multiple images upload
export const uploadMultiple = (fieldName, maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Mixed upload (single + multiple)
export const uploadMixed = (fields) => {
  return upload.fields(fields);
};

// ==================== IMAGE PROCESSING ====================

export const processImage = async (imagePath, transformations = {}) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'snapfest/processed',
      ...transformations
    });
    return result.secure_url;
  } catch (error) {
    throw new Error('Image processing failed: ' + error.message);
  }
};

// ==================== IMAGE DELETION ====================

export const deleteImage = async (imageUrl) => {
  try {
    // Extract public ID from URL
    const publicId = imageUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`snapfest/${publicId}`);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// ==================== IMAGE VALIDATION ====================

export const validateImage = (file) => {
  const errors = [];
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    errors.push('Image size must be less than 5MB');
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('Only JPEG, PNG, GIF, and WebP images are allowed');
  }
  
  // Check dimensions (optional)
  // You can add dimension validation here if needed
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default upload;
