import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== DIRECTORY SETUP ====================

const PUBLIC_DIR = path.join(__dirname, '../../PUBLIC');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

// Subdirectories for different entity types
const SUBDIRECTORIES = {
  packages: 'packages',
  events: 'events',
  venues: 'venues',
  beatbloom: 'beatbloom',
  profiles: 'profiles'
};

// Ensure all directories exist
const ensureDirectories = () => {
  const dirs = [
    PUBLIC_DIR,
    UPLOADS_DIR,
    ...Object.values(SUBDIRECTORIES).map(sub => path.join(UPLOADS_DIR, sub))
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Initialize directories on module load
ensureDirectories();

// ==================== GET UPLOAD SUBDIRECTORY ====================

const getUploadSubdirectory = (req) => {
  const url = req.url || req.originalUrl || '';
  const path = req.path || '';
  
  if (url.includes('/packages') || path.includes('/packages')) return SUBDIRECTORIES.packages;
  if (url.includes('/events') || path.includes('/events')) return SUBDIRECTORIES.events;
  if (url.includes('/venues') || path.includes('/venues')) return SUBDIRECTORIES.venues;
  if (url.includes('/beatbloom') || url.includes('/addon')) return SUBDIRECTORIES.beatbloom;
  if (url.includes('/profile')) return SUBDIRECTORIES.profiles;
  
  return SUBDIRECTORIES.packages; // default
};

// ==================== LOCAL STORAGE CONFIGURATION ====================

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = getUploadSubdirectory(req);
    const uploadPath = path.join(UPLOADS_DIR, subDir);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `${sanitizedName}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// ==================== FILE FILTER ====================

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// ==================== MULTER CONFIGURATION ====================

const upload = multer({
  storage: localStorage,
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

// ==================== HELPER FUNCTIONS ====================

// Generate public URL for uploaded file
export const getPublicUrl = (file) => {
  if (!file) return null;
  
  const filePath = file.path || file.destination;
  let subDir = '';
  
  if (filePath) {
    const pathParts = filePath.split(path.sep);
    const uploadsIndex = pathParts.indexOf('uploads');
    if (uploadsIndex !== -1 && pathParts.length > uploadsIndex + 1) {
      subDir = pathParts[uploadsIndex + 1];
    }
  }
  
  const filename = file.filename || path.basename(file.path);
  return `/PUBLIC/uploads/${subDir}/${filename}`;
};

// Process uploaded files and return public URLs
export const processUploadedFiles = (files) => {
  if (!files) return [];
  
  const fileArray = Array.isArray(files) ? files : [files];
  return fileArray
    .map(file => getPublicUrl(file))
    .filter(Boolean);
};

// Delete local file
export const deleteLocalFile = async (filePath) => {
  try {
    let fullPath;
    
    if (filePath.startsWith('/PUBLIC/')) {
      fullPath = path.join(__dirname, '../../', filePath);
    } else if (filePath.startsWith('PUBLIC/')) {
      fullPath = path.join(__dirname, '../../', filePath);
    } else if (path.isAbsolute(filePath)) {
      fullPath = filePath;
    } else {
      fullPath = path.join(UPLOADS_DIR, filePath);
    }
    
    fullPath = path.normalize(fullPath);
    const publicDirNormalized = path.normalize(PUBLIC_DIR);
    
    if (!fullPath.startsWith(publicDirNormalized)) {
      console.error('❌ Security: Attempted to delete file outside PUBLIC directory');
      return false;
    }
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return false;
  }
};

// Legacy function name for backward compatibility
export const deleteImage = deleteLocalFile;

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
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default upload;
