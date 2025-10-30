import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react';

const CLERK_PK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_d2VsY29tZWQtZ3JvdXBlci03MC5jbGVyay5hY2NvdW50cy5kZXYk';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PK}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
