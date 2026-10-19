# Bitácora 021 - 19/10/2026

## Refactor, etapa 3: widgets `Button`, `Pagination` y `Modal`

---

## Resumen

Los botones de texto, la paginación y el marco de los modales, que estaban escritos a mano en cada escena con pequeñas variaciones, pasan a tres funciones en `src/ui/widgets/` (las mismas que en multiplicación). Es un cambio sin efecto visible: cada llamada reproduce exactamente el estilo que tenía el código anterior.

**Estado:** ✅ Completada. E2E 195/195 (las 7 instantáneas sin regenerar), Vitest 130/130, `tsc` y `npm run build` sin errores.

## Widgets (`src/ui/widgets/`)
| Archivo | API | Notas |
|---------|-----|-------|
| `Button.ts` | `createButton(scene, {x, y, text, fontSize, bg, padding, color?, origin?, hover?, extra?, depth?, scale?, onClick?})` | `hover` admite `bg`, `alpha` y `scale`. `extra` lleva `fontStyle`/`stroke`. Copiado de multiplicación, incluidas las opciones de escala que usará el responsivo |
| `Pagination.ts` | `createPagination(scene, {centerX, y, currentPage, lastPage, onChange, label, buttonOffset, button, labelFontSize})` | Devuelve los textos creados; la escena los marca como `clearable` |
| `Modal.ts` | `createModalFrame(scene, {…, backdrop?})` → `{backdrop?, panel}` | Solo el marco (capa oscura bloqueante opcional + panel con borde). El contenido sigue en cada escena |

Nuevo `src/ui/buttonStyles.ts` con `LIST_BUTTON_STYLE`: el estilo de los botones pequeños de las listas (16 px, fondo gris oscuro, anclado a la izquierda, atenuado en hover), idéntico en Estadísticas y en Admin.

## Dónde se aplicó
- **StatsScene y AdminScene:** `createButton` y `createPagination` privados ahora delegan en los widgets (con `LIST_BUTTON_STYLE`); el marco del aviso de error usa `createModalFrame`. Los dos pares de métodos eran idénticos entre las dos escenas.
- **BaseGameScene:** los botones SÍ/NO de la confirmación de reinicio (hover por escala 1,1, trazo negro y profundidad 3001 vía `extra`/`depth`). La protección contra el doble clic (`choiceMade` y `disableInteractive()`) y los manejadores de `pointerdown` siguen en la escena.

Balance: −47 líneas netas en `AdminScene`, `StatsScene` y `BaseGameScene` (878 → 866, 427 → 415, 515 → 492).

## Qué no se unificó (a propósito)
- `MenuScene.createGameButton`: es un contenedor con un rectángulo y dos textos, no un botón de texto; el widget no lo cubre.
- El botón de Google de `LoginScene` (está en el DOM) y los encabezados ordenables de Admin (etapa 5, `DataTable`).
- El contenido de los modales: el aviso de error es idéntico en las dos escenas, pero el resumen de sesión y la confirmación tienen formas distintas (etapa 6).

## Próximo paso
Etapa 4: filtros HTML a clases CSS + `FilterBar`, y corrección del defecto 3 (las barras no se retiran si la escena se cierra sin pasar por sus botones), invirtiendo las dos pruebas que hoy lo fijan.

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 19 de octubre de 2026
**Estado:** Etapa 3 completada
