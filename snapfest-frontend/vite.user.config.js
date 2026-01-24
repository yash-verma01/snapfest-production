import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// User App Configuration - Port 3000
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rename-index-html',
      closeBundle() {
        const indexPath = resolve(__dirname, 'dist/user/index.user.html');
        const targetPath = resolve(__dirname, 'dist/user/index.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, targetPath);
          console.log('✅ Created index.html from index.user.html');
        }
      }
    }
  ],
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
