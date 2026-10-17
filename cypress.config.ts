import { defineConfig } from 'cypress';
import fs from 'node:fs';
import path from 'node:path';

const SNAPSHOT_DIR = path.join(process.cwd(), 'cypress', 'snapshots');

/** Arreglos con un elemento por línea (los cambios se leen bien en `git diff`); el resto, indentado. */
function formatSnapshot(data: unknown): string {
  const lines = (items: unknown[], indent: string) =>
    `[\n${items.map((item) => `${indent}  ${JSON.stringify(item)}`).join(',\n')}\n${indent}]`;

  if (Array.isArray(data)) return `${lines(data, '')}\n`;
  if (data && typeof data === 'object') {
    const body = Object.entries(data as Record<string, unknown>).map(([key, value]) =>
      Array.isArray(value)
        ? `  ${JSON.stringify(key)}: ${lines(value, '  ')}`
        : `  ${JSON.stringify(key)}: ${JSON.stringify(value, null, 2).replace(/\n/g, '\n  ')}`
    );
    return `{\n${body.join(',\n')}\n}\n`;
  }
  return JSON.stringify(data, null, 2) + '\n';
}

/** Primeras líneas que difieren, en formato legible. */
function describeDiff(expected: string, actual: string): string {
  const e = expected.split('\n');
  const a = actual.split('\n');
  const lines: string[] = [];
  for (let i = 0; i < Math.max(e.length, a.length) && lines.length < 24; i++) {
    if (e[i] !== a[i]) {
      if (e[i] !== undefined) lines.push(`- (esperado, línea ${i + 1}) ${e[i]}`);
      if (a[i] !== undefined) lines.push(`+ (actual,   línea ${i + 1}) ${a[i]}`);
    }
  }
  return lines.join('\n');
}

// El servidor de pruebas lo levanta `npm run e2e` (start-server-and-test) en el puerto 5174,
// con la API apuntando a /api (mismo origen, así cy.intercept evita CORS) y sin tocar el backend real.
export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:5174',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 900,
    video: false,
    defaultCommandTimeout: 8000,
    retries: 0,
    setupNodeEvents(on) {
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },

        /**
         * Compara `data` con cypress/snapshots/<name>.json.
         * Con UPDATE_SNAPSHOTS=1 escribe el archivo en lugar de comparar (npm run e2e:update-snapshots).
         * Si no existe y no se está actualizando, falla: un snapshot ausente nunca debe pasar en silencio.
         */
        matchSnapshot({ name, data }: { name: string; data: unknown }) {
          const file = path.join(SNAPSHOT_DIR, `${name}.json`);
          const actual = formatSnapshot(data);

          if (process.env.UPDATE_SNAPSHOTS) {
            fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
            fs.writeFileSync(file, actual);
            return `snapshot "${name}" actualizado`;
          }
          if (!fs.existsSync(file)) {
            throw new Error(`No existe el snapshot "${name}". Créalo con: npm run e2e:update-snapshots`);
          }
          const expected = fs.readFileSync(file, 'utf8');
          if (expected !== actual) {
            throw new Error(
              `El snapshot "${name}" difiere de cypress/snapshots/${name}.json.\n` +
                `Si el cambio es intencional, revisa el diff y ejecuta: npm run e2e:update-snapshots\n\n` +
                describeDiff(expected, actual)
            );
          }
          return null;
        },
      });
    },
  },
});
