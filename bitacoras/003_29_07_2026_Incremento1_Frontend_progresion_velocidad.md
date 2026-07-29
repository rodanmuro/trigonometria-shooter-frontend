# 003 - 29/07/2026 - Ajuste al Incremento 1: progresión de velocidad por puntaje (Frontend)

## Resumen

Corrección de alcance sobre la bitácora 001: el plan original del Incremento 1 excluía explícitamente un sistema de niveles/progresión ("dificultad constante"). El usuario indicó que esto no era correcto — el juego debe ir aumentando la velocidad de las tarjetas a medida que suben los puntos, replicando el comportamiento de `multiplication-shooter`. Se agrega ahora, dentro del mismo incremento, antes de pasar a incrementos futuros.

## Cambios realizados

- `utils/constants.ts`: nuevo `PROGRESSION_CONFIG` — `POINTS_PER_LEVEL: 30` (3 aciertos correctos por nivel), `SPEED_SCALE` (multiplicador de 1.0x a 2.5x, incremento de 0.15 por nivel, tope en nivel 10).
- `managers/ProgressionManager.ts` (nuevo, versión simplificada del original: sin concepto de "tabla", solo nivel y multiplicador de velocidad — no aplica aquí porque no hay progresión de contenido, solo de velocidad): `updateProgress(score)` recalcula el nivel a partir del puntaje actual y devuelve si subió; `getSpeedMultiplier()` calcula el multiplicador según el nivel.
- `systems/CardSpawner.ts`: se agregó `speedMultiplier` (por defecto 1.0) y `setSpeedMultiplier()`; la velocidad de spawn de cada tarjeta nueva ahora es `randomInt(MIN_SPEED, MAX_SPEED) * speedMultiplier`.
- `scenes/GameScene.ts`: `scoreManager.setOnScoreChange` ahora también llama a `progressionManager.updateProgress(score)`; si subió de nivel, se actualiza la velocidad del spawner y se muestra una notificación "¡NIVEL N! Cartas más rápidas" (mismo estilo visual/animación que el proyecto anterior, sin mención a "tabla" porque no aplica).

## Nota de diseño

Al igual que en multiplication-shooter, el nivel se recalcula desde el puntaje actual en cada cambio (no es un contador monótono): si el jugador falla y el puntaje baja por debajo del umbral del nivel alcanzado, el nivel puede bajar silenciosamente y volver a subir (con nueva notificación) al recuperar puntos. Es el mismo comportamiento heredado del proyecto original, no una regresión introducida aquí.

## Testing manual

- [x] Verificado con Playwright (bypass de login, disparos automatizados ~55s): se registró en consola `¡SUBIDA DE NIVEL! Nivel 2 - Velocidad x1.15`, coincidiendo exactamente con la fórmula esperada (`1.0 + 1×0.15`).
- [x] `npx tsc --noEmit` sin errores tras los cambios.

## Archivos creados/modificados

`src/utils/constants.ts`, `src/managers/ProgressionManager.ts` (nuevo), `src/systems/CardSpawner.ts`, `src/scenes/GameScene.ts`.

## Checkpoint

✅ Progresión de velocidad agregada y verificada. El Incremento 1 queda ahora completo con esta corrección. NO AVANZAR al incremento 2 sin que el usuario confirme el login real y valide la sensación de progresión jugando.
