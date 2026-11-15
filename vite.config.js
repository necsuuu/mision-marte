import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dos formas de compilar:
//  · npm run build         → para hosting (Vercel, Netlify, GitHub Pages): el motor 3D y las imágenes van en
//                            archivos separados, así el título carga rápido y el navegador guarda todo en caché.
//  · npm run build:single  → todo incrustado en un solo JS (para subirlo a lugares que no dejan cargar imágenes aparte).
const single = process.env.SINGLE === '1'

// base: './' para que el build funcione en cualquier carpeta/hosting
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 3000,
    assetsInlineLimit: single ? 200 * 1024 : 4096,
    rolldownOptions: single ? { output: { codeSplitting: false } } : {},
  },
})
