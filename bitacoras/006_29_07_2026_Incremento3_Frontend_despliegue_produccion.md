# 006 - 29/07/2026 - Incremento 3: Despliegue a producción (Frontend)

## Resumen

Despliegue del frontend al mismo hosting compartido, en la subcarpeta `/trigonometria/`, junto al backend recién desplegado.

## Cambios de configuración

- `vite.config.ts`: `base` ahora es condicional según el comando (`command === 'build' ? '/trigonometria/' : '/'`), en vez de un valor fijo — así el build de producción sirve desde la subcarpeta pero el dev local (`npm run dev`) sigue funcionando en la raíz sin tener que navegar a una subruta.
- `.env.production` (nuevo, gitignored): `VITE_API_URL=https://voyeducando.com/trigonometria/api`, mismo `VITE_GOOGLE_CLIENT_ID`.
- `.htaccess.production` (nuevo, mismo patrón que multiplication-shooter): SPA routing a `index.html`, excluyendo `/trigonometria/api/`, compresión gzip, cache de assets.

## Proceso de despliegue

1. `npm run build` (usa automáticamente `.env.production`) → `dist/` con solo 13 archivos (~1.5 MB).
2. Se copió `.htaccess.production` → `dist/.htaccess`.
3. Al ser pocos archivos, se subieron directo por FTP (`lftp mirror -R`) a `/home/heverdar/public_html/trigonometria/`, sin necesidad de zip/unzip (a diferencia del backend, que sí lo necesitó por la cantidad de archivos de `vendor/`).

## Verificación

- `curl https://voyeducando.com/trigonometria/` → 200, HTML con las rutas de assets correctas (`/trigonometria/assets/...`).
- Bundle JS contiene la URL de API de producción (`voyeducando.com/trigonometria/api`).
- Captura de pantalla con Playwright confirma: pantalla de login renderiza correctamente, con el botón real de Google ("Acceder con Google") — **sin errores de origen no autorizado**, confirmando que no hizo falta tocar Google Cloud Console (mismo dominio y Client ID ya autorizados por el despliegue de multiplication-shooter).

## Pendiente

- [ ] El usuario debe probar el login real con su cuenta de Google y jugar una partida de cada juego en producción para confirmar persistencia end-to-end.

## Checkpoint

✅ Frontend desplegado y verificado visualmente en `https://voyeducando.com/trigonometria/`. Incremento 3 (despliegue) completo en ambos proyectos.
