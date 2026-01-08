import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import UserApp from './UserApp.jsx'
import { ClerkProvider } from '@clerk/clerk-react';

// User portal uses USER-specific key
const CLERK_PK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_USER || 
                 import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Debug logging to verify which key is being used
console.log('🔑 User Portal Clerk Key Debug:', {
  userKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_USER ? '✅ Found' : '❌ Missing',
  fallbackKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? '✅ Found' : '❌ Missing',
  finalKey: CLERK_PK ? CLERK_PK.substring(0, 30) + '...' : '❌ UNDEFINED!',
  fullKey: CLERK_PK || 'NOT SET'
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={CLERK_PK} 
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/sign-in/complete" 
      afterSignUpUrl="/sign-up/complete"
    >
      <UserApp />
    </ClerkProvider>
  </StrictMode>,
)
