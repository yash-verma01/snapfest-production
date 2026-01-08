import api from './api';

export const uploadAPI = {
  // Profile image upload
  uploadProfileImage: (formData) => {
    return api.post('/upload/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Package image upload (Admin only)
  uploadPackageImages: (packageId, formData) => {
    return api.post(`/upload/package/${packageId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Addon image upload (Vendor/Admin)
  uploadAddonImages: (addonId, formData) => {
    return api.post(`/upload/addon/${addonId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Bulk image upload
  uploadBulkImages: (formData) => {
    return api.post('/upload/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete image
  deleteImage: (imageUrl) => {
    return api.delete('/upload/image', {
      data: { imageUrl }
    });
  },

  // Get image info
  getImageInfo: (imageUrl) => {
    return api.get('/upload/image-info', {
      params: { imageUrl }
    });
  },

  // Additional missing upload endpoints
  uploadPackageImages: (packageId, formData) => {
    return api.post(`/upload/package/${packageId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadAddonImages: (addonId, formData) => {
    return api.post(`/upload/addon/${addonId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadBulkImages: (formData) => {
    return api.post('/upload/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteImage: (imageUrl) => {
    return api.delete('/upload/image', {
      data: { imageUrl }
    });
  }
};

export default uploadAPI;
