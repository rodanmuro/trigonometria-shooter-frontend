# Bitácora 028 - 19/10/2026

## Responsivo, fase 2: jugabilidad táctil

---

## Resumen
Con el canvas a ≈ 0,49× en un celular horizontal (844×390), las tarjetas de 140×80 medían ~68×39 px, el HUD y el triángulo quedaban ilegibles y el impacto exigía el punto exacto. Ahora todo se compensa desde **un único módulo**, `src/ui/layout.ts`; con escala 1 (escritorio) cada valor es neutro.

Esta fase junta lo que en multiplicación fueron la fase 2 y los ajustes tras la prueba en un celular real (bitácoras 025 y 026 de ese proyecto): tope de tarjeta 1,35×, máximo de tarjetas reducido, `setResolution` en los textos y pantalla completa.

**Estado:** ✅ Completada. E2E 224/224 (204 anteriores + 20 nuevas), Vitest 150/150 (+20), `tsc`, `typecheck:e2e` y build sin errores. El build **no** incluye el modo demostración. **No probado en un celular real.**

## `src/ui/layout.ts`
`computeLayout(displayScale)` (función pura, probada con Vitest): a escala 1 devuelve `cardScale 1, hudScale 1, hitSlop 0, crosshairScale 1, maxCardsFactor 1, compact false`.

| Valor | Fórmula | A ≈ 0,49 |
|-------|---------|----------|
| `cardScale` | `56 / (80·s)` acotado a 1–1,35 | 1,35 |
| `hudScale` | `0,7 / s` acotado a 1–1,6 | ≈ 1,43 |
| `hitSlop` | `24·(1−s)/s` px del mundo | ≈ 25 |
| `crosshairScale` | `1 / (1,2·s)` acotado a 1–1,8 | ≈ 1,7 |
| `maxCardsFactor` | `1 − 0,8·(1−s)` acotado a 0,6–1 | ≈ 0,6 → 12 tarjetas |
| `compact` | `s < 0,75` | sí (lo usará la fase 3) |

`getDisplayScale(scene)` = tamaño mostrado / tamaño del mundo. `computeWorldWidth` (mundo ancho) queda para su propia etapa.

## Dónde se aplica
- `Card`: `setScale(cardScale)` y `labelText.setResolution(cardScale)`. `CardSpawner.checkHit` usa el tamaño escalado de cada tarjeta más `hitSlop`; `getMaxCards()` reduce el máximo simultáneo (20 → 12).
- `Crosshair`: escala base; el pulso anima relativo a ella.
- `QuestionDisplay` (Juego 1): escala fondo y texto (no el contenedor, cuya animación de entrada anima de 0 a 1).
- `ScoreDisplay`: escala el contenedor. `SessionTimer`: escala y baja con la caja de la pregunta (`50 + 40·hudScale`; 90 px a escala 1).
- **`TriangleDisplay` (Juego 2, propio de este proyecto):** escala `hudScale` mediante un `baseScale` (la animación de entrada pasa de `0,85·base` a `base`), textos con `setResolution`, y baja `150·(hudScale−1)` px para que el vértice A no quede bajo el temporizador, que también crece. Tiene profundidad 80 frente a 50 de las tarjetas, así que las tarjetas pasan **detrás** del triángulo y no lo tapan.
- `ui/fullscreen.ts` + `utils/environment.ts` (`isTouchDevice`): botón ⛶ (esquina superior izquierda, solo en táctiles que admiten la API) y primer toque; pide `documentElement` y bloquea la orientación horizontal si se puede. En iPhone no hace nada.
- `devDemo.ts` + `npm run dev:lan`: con `?demo=1` guarda una sesión ficticia (solo en desarrollo) para probar en un celular real por la red local. Verificado que `npm run build` no lo incluye.

## Pruebas nuevas
- Vitest (+20): `layout` (7), `fullscreen` (11) y `environment` (2).
- `cypress/e2e/mobile-play.cy.ts` (20), para **cada juego** a 844×390: tarjetas agrandadas con alto en pantalla ≥ 50 px; un toque 8 px fuera del borde acierta; uno a 120 px no; máximo de 12 tarjetas; texto a mayor resolución; HUD y mira agrandados con el temporizador bajo la caja de la pregunta; acertar con un toque suma 10. A 1280×900: todo a tamaño natural, temporizador en y = 90, 20 tarjetas y el impacto sigue siendo exacto. Más 2 pruebas del triángulo (celular y escritorio).
- Instantáneas **sin regenerar**: el escritorio no cambia.

## Incidencias
- El triángulo quedaba con el vértice A (117 px) por encima del fondo del temporizador (131 px) con el desplazamiento inicial de 80 px: se subió a 150 px y la prueba lo comprueba.
- Las dos pruebas del triángulo leían `scaleX` a mitad de la animación de entrada (0,85 y luego 1,0136 por el rebote `Back`). Una medición temporal confirmó que la animación termina en 1 antes de 500 ms; para no depender del momento de lectura, las pruebas comprueban `baseScale`.

## Límites
- Las tarjetas creadas conservan su tamaño si el canvas cambia de escala a media partida; el HUD tampoco se recalcula al instante.
- Sin revisar: audio en móvil, rendimiento en gama baja, pantalla completa real, aviso de rotación real.
- El mundo sigue siendo 1200×800: en pantallas alargadas quedan franjas laterales (etapa "mundo ancho").

## Próximo paso
Fase 3, pantallas secundarias: resumen y confirmación compensados por escala, Estadísticas compactas, filtros HTML anclados al canvas, admin solo escritorio, aviso de navegador incrustado. Antes conviene una prueba en celular real (`npm run dev:lan` + `?demo=1`).

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 19 de octubre de 2026
**Estado:** Fase 2 completada
