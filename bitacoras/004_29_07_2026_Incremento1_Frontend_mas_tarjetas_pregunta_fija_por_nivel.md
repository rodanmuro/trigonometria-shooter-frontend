# 004 - 29/07/2026 - Ajuste al Incremento 1: más tarjetas en pantalla y pregunta fija por nivel (Frontend)

## Resumen

Dos ajustes de balance de juego pedidos por el usuario tras probar el Incremento 1:

1. Había muy pocas tarjetas objetivo en pantalla (5 como máximo). Se revisó `multiplication-shooter-frontend` y se igualó su configuración.
2. La razón trigonométrica cambiaba en cada acierto (seno → coseno → tangente muy rápido), lo cual no da tiempo a practicar. Ahora la razón se mantiene fija durante todo el nivel y solo cambia al subir de nivel.

## Cambios realizados

- `utils/constants.ts` (`CARD_CONFIG`): `MAX_CARDS_ON_SCREEN` 5 → 20, `SPAWN_INTERVAL` 900 → 500ms, `MAX_SPEED` 120 → 150. Valores calcados de `multiplication-shooter-frontend` (`WRONG_ANSWERS_COUNT`/probabilidad ya coincidían).
- `scenes/GameScene.ts`:
  - `onShoot()`: se quitó la llamada a `generateNewQuestion()` que se disparaba en cada acierto. Ahora un acierto solo suma puntaje, destruye la carta y registra el disparo — la ronda (razón + fórmulas cayendo) sigue igual.
  - `onLevelUp()`: al terminar la animación de la notificación "¡NIVEL N!" (`tween.onComplete`), ahí sí se llama a `generateNewQuestion()`, que elige una nueva razón y reinicia el spawn de cartas. Es decir, el cambio de razón ahora está atado exclusivamente a la subida de nivel, igual que en el proyecto anterior (donde el cambio de tabla de multiplicar también ocurría solo al subir de nivel).

## Testing manual

- [x] Verificado con Playwright (bypass de login + disparos automatizados): con ~9 aciertos/fallos mezclados no se generó ninguna "Nueva pregunta" hasta la primera subida de nivel; en la captura de pantalla se ve la razón "SENO" fija junto con la notificación "¡NIVEL 2!" y muchas más tarjetas en pantalla (llenando el canvas, no solo 5).
- [x] `npx tsc --noEmit` y `npm run build` sin errores.

## Archivos modificados

`src/utils/constants.ts`, `src/scenes/GameScene.ts`.

## Checkpoint

✅ Ajustes verificados. El Incremento 1 sigue completo con este refinamiento de balance de juego.
