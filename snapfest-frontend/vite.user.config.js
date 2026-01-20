import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// User App Configuration - Port 3000
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist/user',
    rollupOptions: {
      input: {
        main: './index.user.html'
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Rename index.user.html to index.html for Azure Static Web Apps
          if (assetInfo.name === 'index.user.html') {
            return 'index.html';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Copy staticwebapp.config.json to output
    copyPublicDir: true
  }
})
