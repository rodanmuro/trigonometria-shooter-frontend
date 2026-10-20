# Bitácora 033 - 20/10/2026

## Despliegue a producción (`https://voyeducando.com/trigonometria/`)

---

## Qué se desplegó
Código en `main` (commit `a6300bc`): pruebas, refactor de 7 etapas, defectos 1–6, responsivo (fases 1–3), mundo ancho y botón "Menú principal". Solo frontend; el backend (`api/`) no se tocó. Antes del despliegue: E2E 242/242, Vitest 183/183, `tsc` y build sin errores.

## Pasos (hosting compartido, FTP con `lftp`, TLS explícito)
1. **Copia de seguridad** de lo que servía producción (`index.html`, `.htaccess`, `favicon.svg`) en `trigonometria-shooter/backup-produccion-frontend-2026-10-20/` (fuera del repositorio). Producción servía `assets/index-xWjMhAU8.js` + `index-ROG6WCNG.css`.
2. `rm -rf dist && npm run build` (usa `.env.production`). Comprobado en el bundle: API `https://voyeducando.com/trigonometria/api`, Client ID de producción, `SESSION_DURATION` = 3e5 (5 min), **sin** `localhost:8000`, sin modo demostración y sin el Client ID de pruebas.
3. `.htaccess` y `favicon.svg` del servidor eran idénticos a los del repositorio y los sonidos no cambiaron: **no se subieron**.
4. Subida en este orden: los dos assets nuevos (`index-UQTnVQK5.js` 1,3 MB, `index-NOvUM9Sv.css`) → comprobado que se servían con el tamaño exacto (HTTP 200) → **`index.html` al final** (el cambio efectivo). No se usó `mirror --delete`.
5. Verificación: la página sirve los assets nuevos y el botón ⛶ y el aviso de rotación; `favicon.svg`, `sounds/shoot.mp3` y el bundle anterior responden 200; la API responde 401 sin token (viva). Cypress en solo lectura contra producción: carga `LoginScene`; el mundo mide **1200×800** en escritorio (1280×900) y **1730×800** en celular (844×390), con el lienzo llenando el ancho (843×390).

## No verificado
- En esa corrida de Cypress el botón de Google **no apareció** (el script real de Google Identity Services no suele inicializarse en el Electron de pruebas, y la escena de login sí cargó). El inicio de sesión real con Google, el juego completo y los datos reales **requieren una prueba manual** con cuenta.
- Probar siempre con `https://voyeducando.com/trigonometria/` (con http o www Google da `origin_mismatch`; ver la nota del 19/10/2026).

## Reversión
Subir `backup-produccion-frontend-2026-10-20/index.html` a `public_html/trigonometria/`. Los assets antiguos siguen en el servidor (no se borraron), así que el `index.html` antiguo funciona tal cual.

## Limpieza pendiente (opcional)
En `public_html/trigonometria/assets/` quedan 10 JS y 2 CSS antiguos (~1,3 MB cada JS). No se tocaron.

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 20 de octubre de 2026
**Estado:** Desplegado
