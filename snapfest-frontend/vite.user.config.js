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
      }
    },
    // Copy staticwebapp.config.json to output
    copyPublicDir: true
  }
})
