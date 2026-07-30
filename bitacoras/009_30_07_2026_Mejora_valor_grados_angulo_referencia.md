# 009 - 30/07/2026 - Mejora: valor en grados para el ángulo de referencia (Juego 2)

## Resumen

El usuario notó que resaltar el ángulo de referencia (A o B) solo con un color en la letra podía ser confuso para los estudiantes. Se reemplaza el resaltado por un **valor decorativo en grados** (ej. "63°") mostrado junto al vértice de referencia, mientras la otra letra queda en blanco normal, sin color especial.

## Cambios realizados

- `types/index.ts`: `TriangleQuestion` ahora incluye `angleDegrees: number`.
- `systems/TriangleQuestionGenerator.ts`: genera `angleDegrees = randomInt(20, 70)` — **puramente decorativo**, no interviene en el cálculo de `correctFunction` (que sigue dependiendo únicamente de qué lados se muestran, según la tabla de roles ya validada). Se documentó explícitamente en el código para que quede claro que no hay que buscarle consistencia trigonométrica real con los valores de los lados.
- `components/TriangleDisplay.ts`: se quitó el color de resaltado (`HIGHLIGHT_COLOR`) de los vértices A/B (ambos quedan en blanco siempre); se agregó un texto nuevo (`angleValueText`) posicionado hacia el interior del triángulo desde el vértice de referencia (`ANGLE_VALUE_OFFSET` con coordenadas fijas para A y para B), mostrando `${angleDegrees}°` en verde.

## Testing manual

- [x] `npx tsc --noEmit` sin errores.
- [x] Verificado con Playwright: el valor en grados aparece correctamente posicionado junto al vértice de referencia (probado con B en varias rondas: "63°", "23°"), ambas letras A/B en blanco normal, funciona igual tras subir de nivel (nueva pregunta, nuevo valor de grados).

## Despliegue

Build de producción regenerado y subido por FTP a `public_html/trigonometria/`.

## Checkpoint

✅ Mejora desplegada y verificada.
