# Bitácora 019 - 19/10/2026

## Refactor, etapa 1: `theme.ts` (tamaños de fuente y colores)

---

## Resumen

Primera etapa del refactor de la bitácora 014. Los `fontSize` y los colores que estaban repartidos como literales por escenas y componentes pasan a tokens de un único módulo, `src/ui/theme.ts`. Es un cambio mecánico: **los valores son exactamente los mismos**, así que la salida visual no cambia (las instantáneas de la fase D lo comprueban).

**Estado:** ✅ Completada. E2E 195/195 (incluidas las 7 instantáneas, sin regenerarlas), Vitest 116/116, `tsc` y `npm run build` sin errores.

## Cambios

- Nuevo `src/ui/theme.ts`:
  - `FONT_SIZE`: 16 tamaños (`xs` 14 px … `logo` 72 px). Se conservaron los valores "raros" (15, 26, 30, 42, 52, 56 y 72 px) para no alterar nada; unificarlos es decisión de diseño y se toma en el plan responsivo.
  - `COLOR`: 15 colores que se repetían (`white`, `black`, `yellow`, `red`, `green`, `grayLight`, `grayMid`, `grayDark`, `grayPale`, `teal`, `mint`, `amber`, `salmon`, `navy`, `successDark`).
- Sustituidos en 11 archivos: `QuestionDisplay`, `ScoreDisplay`, `SessionTimer`, `TriangleDisplay`, `Card`, `gameConfig`, `BaseGameScene`, `LoginScene`, `MenuScene`, `StatsScene`, `AdminScene`. 161 líneas cambiadas.
- Hecho con un script (expresión regular sobre `fontSize: 'NNpx'` y `'#rrggbb'` entre comillas, ignorando las líneas del DOM con `.style.` o `cssText`), no a mano.

## Qué NO se tocó (a propósito)

- Los colores usados una sola vez: `#ff8800` (temporizador), `#cccc00` (encabezado no ordenable), `#757575`, `#666666`, `#4285f4` (botón de Google), `#0066cc`, `#004400` y `#440000` (SÍ/NO).
- Los colores numéricos de formas (`0xffffff`, `0x1a1a2e`…) de rectángulos, círculos y gráficos.
- Los estilos HTML (`style.cssText` y `.style.color = '#aaa'`): pasan a clases CSS en la etapa 4.
- `utils/constants.ts` (`QUESTION_FONT_SIZE: '38px'`, `QUESTION_COLOR`, `SCORE_FONT_SIZE`): quedan en `UI_CONFIG`.
- No se creó aún `textStyle('title'|'body'|'hud')` de la bitácora 014: con 16 tamaños sin patrón claro, agruparlos en roles ahora sería inventar diseño. Se hará junto con los tokens de `layout.ts` en el plan responsivo.

## Verificación

- `tsc --noEmit`, `npm run build` y `npm test` sin errores; el recuento del diff (161 líneas quitadas, 161 puestas) confirma que no se perdió ni se añadió nada más que los imports.
- `npm run e2e`: 195/195. Las instantáneas de la escena (que guardan `fontSize` y `color` de cada texto) pasaron sin cambios, lo que confirma que los valores no se alteraron.

## Próximo paso

Etapa 2: `utils/format.ts` (duración y fechas, corrigiendo la inconsistencia de formato con prueba previa) y `utils/download.ts`.

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 19 de octubre de 2026
**Estado:** Etapa 1 completada
