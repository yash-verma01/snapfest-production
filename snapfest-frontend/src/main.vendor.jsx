import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import VendorApp from './VendorApp.jsx'
import { ClerkProvider } from '@clerk/clerk-react';

// Vendor portal uses VENDOR-specific key
const CLERK_PK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_VENDOR || 
                 import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                 'pk_test_d2VsY29tZWQtZ3JvdXBlci03MC5jbGVyay5hY2NvdW50cy5kZXYk';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PK} afterSignInUrl="/vendor/dashboard" afterSignUpUrl="/vendor/dashboard">
      <VendorApp />
    </ClerkProvider>
  </StrictMode>,
)
