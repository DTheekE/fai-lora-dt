import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/fai-lora-dt', // 👈 Correctly sets the base path for GitHub Pages
  plugins: [react()],   // 👈 Enables React plugin
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 👈 Useful alias, keeps your imports clean
    },
  },
})
