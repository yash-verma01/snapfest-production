import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    // Code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - separate large dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'clerk-vendor': ['@clerk/clerk-react'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          // Feature chunks - group related pages
          'admin': [
            './src/pages/AdminDashboard',
            './src/components/admin/BookingManagement',
            './src/components/admin/EnquiryManagement'
          ],
          'vendor': [
            './src/pages/VendorDashboard',
            './src/pages/VendorBookings',
            './src/pages/VendorEarnings'
          ],
          'user': [
            './src/pages/Profile',
            './src/pages/Bookings',
            './src/pages/Payments',
            './src/pages/Cart',
            './src/pages/Checkout'
          ]
        }
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Source maps for production (set to false for smaller builds)
    sourcemap: false,
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@clerk/clerk-react']
  }
})
