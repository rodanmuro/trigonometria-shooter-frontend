# 001 - 29/07/2026 - Planeación de desarrollo incremental (Frontend)

## Resumen

Planeación maestra de `trigonometria-shooter-frontend`, proyecto hermano de `multiplication-shooter-frontend` (Phaser 3 + TypeScript + Vite). Se reutiliza casi 1:1 la arquitectura del proyecto anterior (AuthManager singleton, cliente axios con interceptores, escenas Phaser, sistema de tarjetas cayendo), adaptando la mecánica de juego de "tablas de multiplicar" a "razones trigonométricas".

## Mecánica del juego (incremento 1)

- Carta superior central: nombre de la razón a identificar — **seno**, **coseno** o **tangente** (elegida al azar).
- Cartas que caen/flotan en pantalla: las 3 fórmulas posibles — `CO/H`, `CA/H`, `CO/CA`.
- El jugador dispara con el mouse; si acierta la carta cuya fórmula corresponde a la razón pedida, suma puntos (`+10`); si dispara una fórmula incorrecta, resta (`-5`, sin bajar de 0).
- Sesión de duración fija (2 minutos para esta prueba conceptual), sin sistema de niveles/progresión todavía (dificultad constante).
- Cada sesión se crea/cierra contra el backend, y cada disparo que impacta una carta se registra vía API.

## Decisiones de reutilización

- **Reutilizados casi sin cambios**: `vite.config.ts`, `tsconfig.json`, `main.ts`, `AuthManager.ts` (Singleton, localStorage `google_auth_token`/`google_user_data`), `apiService.ts` (axios + interceptor Bearer), `authApiService.ts`, `LoginScene.ts` (solo textos), `PreloadScene.ts`, `Crosshair.ts`, `ShotMarker.ts`, `AudioManager.ts`, `CardExplosion.ts`.
- **Rediseñados para trigonometría**: `QuestionGenerator` → `TrigQuestionGenerator` (mucho más simple: elige 1 de 3 razones, no hay dificultad/tabla), `mathHelpers.generateWrongAnswers` → función trivial que retorna las 2 fórmulas restantes, `constants.ts` (sin `DIFFICULTY_CONFIG`/`PROGRESSION_CONFIG` de tablas), `Card.ts`/`CardSpawner.ts`/`QuestionDisplay.ts` (texto de fórmula en vez de número), `GameScene.ts` (sin `ProgressionManager`), tipos `Question`/`RecordShotPayload`.
- **Google OAuth**: mismo Client ID que multiplication-shooter-frontend.

## Incrementos planeados

1. **Incremento 1 (este)**: Login Google + mecánica completa de disparo de 3 razones básicas + sesión/disparos persistidos en backend.
2. **Incremento 2 (futuro)**: Pantalla de historial de sesiones (`StatsScene`).
3. **Incremento 3 (futuro)**: Panel de administración (`AdminScene`).
4. **Incremento 4 (futuro)**: Razones recíprocas (H/CO, H/CA, CA/CO) como variantes adicionales.
5. **Incremento 5 (futuro)**: Ajustes de despliegue a producción (`vite base`, `.htaccess`) en el mismo hosting cPanel.

## Checkpoint

⏳ Planeación completa. Siguiente paso: scaffold del proyecto Vite y copia de módulos base. NO AVANZAR al incremento 2 sin validar el incremento 1 completo (partida jugable de principio a fin contra el backend real).
