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

if (!CLERK_PK) {
  console.error('❌ CRITICAL: No Clerk publishable key found for User portal!');
  console.error('   Expected: VITE_CLERK_PUBLISHABLE_KEY_USER in .env file');
  console.error('   Fallback: VITE_CLERK_PUBLISHABLE_KEY in .env file');
  console.error('   Please check your .env file and rebuild the application.');
  
  // Show error message to user
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ Configuration Error</h1>
          <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">Clerk authentication key is missing.</p>
          <p style="font-size: 1rem; opacity: 0.9;">Please contact support or check the browser console for details.</p>
        </div>
      </div>
    `;
  }
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ClerkProvider 
        publishableKey={CLERK_PK} 
        signInUrl="/login"
        signUpUrl="/register"
        afterSignInUrl="/sign-in/complete" 
        afterSignUpUrl="/sign-up/complete"
      >
        <UserApp />
      </ClerkProvider>
    </StrictMode>,
  )
}
