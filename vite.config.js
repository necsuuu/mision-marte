import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' para que el build funcione en cualquier carpeta/hosting
export default defineConfig({
  plugins: [react()],
  base: './',
  // Las imágenes de personajes se incrustan en el JS (base64): así funcionan en cualquier hosting
  build: { chunkSizeWarningLimit: 3000, assetsInlineLimit: 200 * 1024 },
})
