import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Admin App Configuration - Port 3002
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    host: true
  },
  build: {
    outDir: 'dist/admin',
    rollupOptions: {
      input: {
        main: './index.admin.html'
      }
    }
  }
})
