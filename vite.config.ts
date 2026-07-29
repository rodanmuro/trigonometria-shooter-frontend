import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Base path para producción en subdirectorio (se ajustará en el incremento de despliegue)
  base: '/',

  server: {
    port: 5173,
    open: true
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000
  }
})
