import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// User App Configuration - Port 3000
export default defineConfig({
  plugins: [react()],
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
    }
  }
})
