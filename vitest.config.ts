import { defineConfig } from 'vitest/config';

// Configuración de pruebas unitarias e integración (sin navegador).
// Las escenas de Phaser se cubren con Cypress (E2E).
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/helpers/setup.ts'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
