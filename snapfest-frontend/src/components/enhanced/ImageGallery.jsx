import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from '../LazyImage';

const ImageGallery = ({ 
  images, 
  currentIndex = 0,
  onClose,
  showThumbnails = true 
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0 || !onClose) return null;

  return (
    <AnimatePresence>
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-7xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main Image */}
            <div className="relative w-full h-[80vh] mb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <LazyImage
                    src={images[activeIndex]}
                    alt={`Gallery image ${activeIndex + 1}`}
                    className="w-full h-full object-contain rounded-2xl"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm">
                {activeIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails */}
            {showThumbnails && images.length > 1 && (
              <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      idx === activeIndex
                        ? 'border-pink-500 scale-110'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <LazyImage
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
    </AnimatePresence>
  );
};

export default ImageGallery;

