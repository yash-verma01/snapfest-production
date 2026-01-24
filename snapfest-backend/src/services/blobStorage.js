import { BlobServiceClient } from '@azure/storage-blob';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// ==================== CONFIGURATION ====================

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads';
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL || 
  (accountName ? `https://${accountName}.blob.core.windows.net` : null);

// Check if blob storage is configured
const isBlobStorageConfigured = !!(connectionString || accountName);

// ==================== BLOB SERVICE CLIENT ====================

let blobServiceClient = null;
let containerClient = null;

/**
 * Initialize blob service client
 * @returns {BlobServiceClient|null}
 */
const getBlobServiceClient = () => {
  if (!isBlobStorageConfigured) {
    console.warn('⚠️ Azure Blob Storage not configured. Using local storage fallback.');
    return null;
  }

  if (!blobServiceClient) {
    try {
      if (connectionString) {
        blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      } else {
        console.warn('⚠️ Azure Blob Storage connection string not found.');
        return null;
      }
      
      containerClient = blobServiceClient.getContainerClient(containerName);
      console.log('✅ Azure Blob Storage client initialized');
    } catch (error) {
      console.error('❌ Error initializing blob storage:', error.message);
      return null;
    }
  }

  return blobServiceClient;
};

/**
 * Get container client
 * @returns {ContainerClient|null}
 */
const getContainerClient = () => {
  if (!isBlobStorageConfigured) {
    return null;
  }

  if (!containerClient) {
    getBlobServiceClient();
  }

  return containerClient;
};

// ==================== UPLOAD FUNCTIONS ====================

/**
 * Upload a file to Azure Blob Storage
 * @param {Buffer|string} fileData - File buffer or file path
 * @param {string} blobName - Blob name (e.g., "packages/image-123.jpg")
 * @param {string} contentType - MIME type (e.g., "image/jpeg")
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Public URL of the uploaded blob
 */
export const uploadToBlob = async (fileData, blobName, contentType = 'image/jpeg', options = {}) => {
  // If blob storage not configured, return null (fallback to local storage)
  if (!isBlobStorageConfigured) {
    return null;
  }

  try {
    const client = getContainerClient();
    if (!client) {
      return null;
    }

    // Ensure container exists
    await client.createIfNotExists({
      access: 'blob' // Public read access
    });

    // Read file if it's a path
    let buffer;
    if (Buffer.isBuffer(fileData)) {
      buffer = fileData;
    } else if (typeof fileData === 'string' && fs.existsSync(fileData)) {
      buffer = fs.readFileSync(fileData);
    } else {
      throw new Error('Invalid file data provided');
    }

    // Get blob client
    const blobClient = client.getBlockBlobClient(blobName);

    // Upload options
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: 'public, max-age=31536000' // Cache for 1 year
      },
      ...options
    };

    // Upload blob
    await blobClient.upload(buffer, buffer.length, uploadOptions);

    // Generate public URL
    const publicUrl = blobClient.url;
    
    console.log(`✅ Uploaded to blob storage: ${blobName}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading to blob storage:', error.message);
    throw error;
  }
};

/**
 * Upload a file from local filesystem to blob storage
 * @param {string} localFilePath - Local file path
 * @param {string} entityType - Entity type (packages, events, venues, beatbloom, profiles)
 * @param {string} fileName - File name (optional, will use basename if not provided)
 * @returns {Promise<string>} - Public URL of the uploaded blob
 */
export const uploadFileToBlob = async (localFilePath, entityType = 'packages', fileName = null) => {
  if (!isBlobStorageConfigured) {
    return null;
  }

  try {
    // Validate file exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found: ${localFilePath}`);
    }

    // Get file info
    const stats = fs.statSync(localFilePath);
    const ext = path.extname(localFilePath).toLowerCase();
    const baseName = fileName || path.basename(localFilePath);

    // Determine content type
    const contentTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Construct blob name (maintain folder structure)
    const blobName = `uploads/${entityType}/${baseName}`;

    // Read file and upload
    const fileBuffer = fs.readFileSync(localFilePath);
    const publicUrl = await uploadToBlob(fileBuffer, blobName, contentType);

    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading file to blob:', error.message);
    throw error;
  }
};

// ==================== DELETE FUNCTIONS ====================

/**
 * Delete a blob from Azure Blob Storage
 * @param {string} blobUrl - Full blob URL or blob name
 * @returns {Promise<boolean>} - True if deleted successfully
 */
export const deleteFromBlob = async (blobUrl) => {
  if (!isBlobStorageConfigured) {
    return false;
  }

  try {
    const client = getContainerClient();
    if (!client) {
      return false;
    }

    // Extract blob name from URL
    let blobName;
    if (blobUrl.startsWith('http://') || blobUrl.startsWith('https://')) {
      // Extract blob name from full URL
      // Format: https://account.blob.core.windows.net/container/uploads/packages/image.jpg
      const urlObj = new URL(blobUrl);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // Remove container name (first part)
      if (pathParts[0] === containerName) {
        pathParts.shift();
      }
      
      blobName = pathParts.join('/');
    } else {
      // Assume it's already a blob name
      blobName = blobUrl;
    }

    // Get blob client and delete
    const blobClient = client.getBlockBlobClient(blobName);
    await blobClient.delete();

    console.log(`✅ Deleted from blob storage: ${blobName}`);
    return true;
  } catch (error) {
    // If blob doesn't exist, that's okay
    if (error.statusCode === 404) {
      console.log(`⚠️ Blob not found (already deleted?): ${blobUrl}`);
      return true;
    }
    console.error('❌ Error deleting from blob storage:', error.message);
    return false;
  }
};

// ==================== URL GENERATION ====================

/**
 * Generate a public URL for a blob
 * @param {string} blobName - Blob name (e.g., "uploads/packages/image.jpg")
 * @returns {string|null} - Public URL or null if not configured
 */
export const generateBlobUrl = (blobName) => {
  if (!isBlobStorageConfigured || !accountUrl) {
    return null;
  }

  // Ensure blob name doesn't start with container name
  let normalizedBlobName = blobName;
  if (blobName.startsWith(containerName + '/')) {
    normalizedBlobName = blobName.substring(containerName.length + 1);
  }

  return `${accountUrl}/${containerName}/${normalizedBlobName}`;
};

/**
 * Check if a URL is a blob storage URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export const isBlobUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return url.includes('.blob.core.windows.net') || 
         url.includes('blob.core.windows.net');
};

/**
 * Check if blob storage is configured and available
 * @returns {boolean}
 */
export const isBlobStorageAvailable = () => {
  return isBlobStorageConfigured;
};

// ==================== LISTING FUNCTIONS ====================

/**
 * List all blobs in a folder
 * @param {string} folderPath - Folder path (e.g., "uploads/packages")
 * @returns {Promise<Array>} - Array of blob names
 */
export const listBlobs = async (folderPath = '') => {
  if (!isBlobStorageConfigured) {
    return [];
  }

  try {
    const client = getContainerClient();
    if (!client) {
      return [];
    }

    const blobs = [];
    const prefix = folderPath ? `${folderPath}/` : '';

    for await (const blob of client.listBlobsFlat({ prefix })) {
      blobs.push({
        name: blob.name,
        url: generateBlobUrl(blob.name),
        size: blob.properties.contentLength,
        lastModified: blob.properties.lastModified
      });
    }

    return blobs;
  } catch (error) {
    console.error('❌ Error listing blobs:', error.message);
    return [];
  }
};

export default {
  uploadToBlob,
  uploadFileToBlob,
  deleteFromBlob,
  generateBlobUrl,
  isBlobUrl,
  isBlobStorageAvailable,
  listBlobs
};
