import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import VendorApp from './VendorApp.jsx'
import { ClerkProvider } from '@clerk/clerk-react';

// Vendor portal uses VENDOR-specific key
const CLERK_PK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_VENDOR || 
                 import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Debug logging to verify which key is being used
console.log('🔑 Vendor Portal Clerk Key Debug:', {
  vendorKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_VENDOR ? '✅ Found' : '❌ Missing',
  fallbackKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? '✅ Found' : '❌ Missing',
  finalKey: CLERK_PK ? CLERK_PK.substring(0, 30) + '...' : '❌ UNDEFINED!',
  fullKey: CLERK_PK || 'NOT SET'
});

if (!CLERK_PK) {
  console.error('❌ CRITICAL: No Clerk publishable key found for Vendor portal!');
  console.error('   Expected: VITE_CLERK_PUBLISHABLE_KEY_VENDOR in .env file');
  console.error('   Fallback: VITE_CLERK_PUBLISHABLE_KEY in .env file');
  console.error('   Please check your .env file and restart the dev server.');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={CLERK_PK || ''} 
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/sign-in/complete" 
      afterSignUpUrl="/sign-up/complete"
    >
      <VendorApp />
    </ClerkProvider>
  </StrictMode>,
)
