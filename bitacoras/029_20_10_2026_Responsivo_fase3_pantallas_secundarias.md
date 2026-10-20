# Bitácora 029 - 20/10/2026

## Responsivo, fase 3: pantallas secundarias

---

## Resumen
Última fase del plan responsivo (bitácora 026). Cuatro frentes: navegador incrustado, panel de administración, resumen de sesión y Estadísticas, más el anclaje de las barras de filtros HTML al canvas. Se revisó el resultado en capturas a 844×390 y con pruebas de geometría. **No probado aún en un celular real.**

**Estado:** ✅ Completada. E2E 235/235 (224 anteriores + 11 nuevas), Vitest 164/164 (+14), `tsc`, `typecheck:e2e` y build sin errores.

## 1. Aviso de navegador incrustado (login con Google)
Google bloquea el inicio de sesión en el navegador de WhatsApp, Instagram, Facebook… (`disallowed_useragent`).
- `utils/environment.ts`: `detectInAppBrowser(userAgent)` (Instagram, Facebook, WhatsApp, TikTok, Snapchat, LinkedIn, Line, WeChat, Twitter, Telegram, WebView genérico de Android `; wv)` y de iOS sin "Safari"), probado con User-Agents reales.
- `LoginScene`: en ese caso no inicializa Google Sign-In y muestra "Google no permite iniciar sesión dentro de {app}", "Abre este enlace en Chrome o Safari" y un botón **Copiar enlace**. Se revisó en captura: queda separado del subtítulo.
- Relacionado con la bitácora de la referencia OAuth: el enlace que se copia usa el origen real de la página; compartir siempre `https://voyeducando.com/trigonometria/`.

## 2. Panel de administración solo en escritorio
`layout.compact` (escala de visualización < 0,75). Con el canvas así de reducido `AdminScene` muestra "El panel de administración está disponible solo en computador." con botón "← Volver al Menú" y **no pide datos** al backend (ni usuarios ni grupos).

## 3. Resumen de sesión y confirmación
`SessionSummaryOverlay` calcula cuánto crece el HUD (`hudScale − 1`, 0 en escritorio): título, estadísticas y "Haz clic…" se agrandan y se separan; SÍ/NO crecen a ≥ 48 px en pantalla y se alejan entre sí. En escritorio las posiciones y tamaños son exactamente los de antes (probado: título y=250, "Haz clic" y=550, SÍ en 500,480).

## 4. Estadísticas
En pantallas compactas:
- Tabla con `SESSION_COLUMNS_COMPACT` (en `ui/sessionTable.ts`): sin "Hora" ni "Disparos", fecha corta `28/03 10:30` (`formatDateTimeShort`), texto agrandado (`textScale`).
- Resumen en dos líneas cortas con el texto agrandado; se omiten el nombre del usuario y "Mostrando x–y de z".
- Título, botón de volver y paginación escalados.
- Barra de filtros compacta de **una sola fila** (letra 11 px, etiquetas "Fecha:" y "Pts:", campos de fecha de 108 px). La primera captura mostró que en dos filas tapaba el encabezado de la tabla.

## 5. Barras de filtros ancladas al canvas
`FilterBar.anchorToCanvas(scene, worldTop)` coloca la barra con el rectángulo del canvas (se recalcula en `resize` y en cada fotograma, porque el centrado del Scale Manager puede cambiar sin ese evento). Sustituye a `mount(top)` y a `getCanvasTopOffset()`. Se aplica a Estadísticas y a las dos barras del panel admin.

**Hallazgo:** la barra estaba en `position: absolute` (respecto al documento). Con la página desplazada 50 px (el canvas centrado queda más bajo que el documento) la barra quedaba 50 px más arriba que lo calculado. Se cambió a `position: fixed`, coherente con calcular su posición con el rectángulo del canvas.

### Instantáneas regeneradas (a propósito)
Las 5 instantáneas del DOM (`stats-lista-paginada`, `stats-vacio`, `admin-usuarios`, `admin-usuarios-ordenada`, `admin-sesiones`) cambian solo por esto: `top`/`left` salen (dependen de la ventana y se comprueban ahora por geometría contra el canvas) y `position` pasa de `absolute` a `fixed`. `git diff` confirma que no hay ningún otro cambio. Las instantáneas de Phaser no cambiaron.

## Pruebas nuevas
- Vitest (+14): `environment` (User-Agents reales, `isTouchDevice`), `formatDateTimeShort`.
- `login.cy.ts` (+3): aviso en Instagram sin iniciar Google Sign-In, copiar enlace, navegador normal sin cambios. `visitApp` admite `userAgent`.
- `mobile-secondary.cy.ts` (8): panel admin (aviso sin pedir datos y escritorio intacto), resumen (no se pisa, botones ≥ 48 px, escritorio idéntico), Estadísticas (columnas, sin solapes ni salirse del mundo, barra anclada y compacta sin tapar el encabezado; en escritorio, a 135 del borde del canvas).

## Observaciones / pendiente
- Estadísticas compactas: la letra de las filas queda en ~10 px en pantalla; legible pero pequeña. Ajustar tras probar en un celular real.
- El aviso de rotación y el de navegador incrustado no se han visto en un celular real.
- El panel admin en una tableta pequeña (escala < 0,75) también muestra el aviso.
- `LoginScene` conserva un `shutdown()` muerto (anotado en la bitácora 022).

## Próximo paso
Probar en un celular real (`npm run dev:lan` + `?demo=1`) y ajustar; después la etapa de **mundo ancho** (`computeWorldWidth`, alto 800 y ancho 1200–1800 según la pantalla) y, solo cuando se pida, el despliegue a `public_html/trigonometria/`.

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 20 de octubre de 2026
**Estado:** Fase 3 completada
