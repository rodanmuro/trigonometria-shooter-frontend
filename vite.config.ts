import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // En build de producción sirve desde /trigonometria/ (subcarpeta en el hosting
  // compartido); en dev local se mantiene en la raíz para probar más fácil.
  base: command === 'build' ? '/trigonometria/' : '/',

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
}))
