import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

const ModalPortal = ({ children, isOpen }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;
  
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {children}
    </div>,
    document.body
  );
};

export default ModalPortal;
