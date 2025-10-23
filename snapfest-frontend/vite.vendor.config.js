import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vendor App Configuration - Port 3001
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true
  },
  build: {
    outDir: 'dist/vendor',
    rollupOptions: {
      input: {
        main: './index.vendor.html'
      }
    }
  }
})
