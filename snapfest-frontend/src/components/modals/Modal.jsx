import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={closeOnOverlayClick ? onClose : () => {}}
        static
      >
        <div className="min-h-screen px-4 text-center">
          {/* Overlay - Using a div instead of Dialog.Overlay for v2 compatibility */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          {/* Modal Panel */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95 translate-y-4"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`relative inline-block w-full ${sizeClasses[size]} bg-white rounded-lg shadow-2xl text-left align-middle transform transition-all ${className}`}
            >
              <Dialog.Panel>
                {/* Header */}
                {title && (
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      {title}
                    </Dialog.Title>
                    {showCloseButton && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Content */}
                <div className="p-6">
                  {children}
                </div>
              </Dialog.Panel>
            </motion.div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;





