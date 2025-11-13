import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '../ui';
import { adminAPI } from '../../services/api';

const ImageUpload = ({ 
  entityType, 
  entityId, 
  onImagesUploaded, 
  maxImages = 10,
  existingImages = [],
  onImageRemove,
  isPrimary = false // Flag to indicate if this is for primary image
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== fileArray.length) {
      alert('Some files were rejected. Please ensure all files are images under 10MB.');
    }

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, maxImages));
    
    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls].slice(0, maxImages));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });
      
      // Add isPrimary flag for all entity types when uploading primary images
      if (isPrimary) {
        formData.append('isPrimary', 'true');
      }

      let response;
      if (entityType === 'package') {
        response = await adminAPI.uploadPackageImages(entityId, formData);
      } else if (entityType === 'event') {
        response = await adminAPI.uploadEventImages(entityId, formData);
      } else if (entityType === 'venue') {
        response = await adminAPI.uploadVenueImages(entityId, formData);
      } else if (entityType === 'beatbloom') {
        response = await adminAPI.uploadBeatBloomImages(entityId, formData);
      }

      if (response.data.success) {
        setSelectedFiles([]);
        setPreviewUrls([]);
        // For primary images, pass the new image URL; for gallery, pass all images
        if (isPrimary && response.data.data.newImages && response.data.data.newImages.length > 0) {
          onImagesUploaded?.(response.data.data.newImages[0]);
        } else {
          onImagesUploaded?.(response.data.data.images);
        }
        alert('Images uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeExistingImage = async (imageUrl) => {
    try {
      await adminAPI.deleteImage(imageUrl, entityType, entityId);
      onImageRemove?.(imageUrl);
      alert('Image removed successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to remove image. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {existingImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeExistingImage(image)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop images here, or click to select
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Select Images
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Max {maxImages} images, 10MB each
          </p>
        </div>
      </div>

      {/* Preview Selected Files */}
      {selectedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={previewUrls[index]}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={uploadImages}
              disabled={uploading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFiles([]);
                setPreviewUrls([]);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

