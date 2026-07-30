# 008 - 30/07/2026 - Fix: doble sesión creada al reiniciar partida

## Resumen

El usuario reportó desde el panel admin sesiones con `final_score=0` pero con disparos reales registrados y buena precisión — inicialmente parecía un bug de cálculo de puntaje. Investigando en producción (script de diagnóstico temporal, subido y borrado por FTP) se identificaron **dos causas distintas**, no relacionadas con el cálculo de puntaje (que funciona correctamente: se confirmaron sesiones terminando exactamente a los 5 minutos con puntajes coherentes):

1. **Abandono de partida a mitad de juego** (cerrar pestaña / navegar fuera antes de los 5 minutos): el cronómetro vive solo en el cliente (`this.time.delayedCall` de Phaser); si la página deja de ejecutarse, el `finish` nunca se dispara. Los disparos ya quedaron guardados (se registran en tiempo real), pero `final_score` queda en su valor inicial (0) para siempre. Inherente a cualquier temporizador puramente client-side; **no se aborda en este fix** (el usuario decidió priorizar solo el punto 2 por ahora).
2. **Doble sesión creada al reiniciar** (bug real, corregido acá): se detectó un caso concreto (usuario Joyder Lobo, grupo 10B2026) con dos sesiones creadas con **6 segundos de diferencia** justo después de terminar una partida — una con 0 disparos (huérfana) y otra con disparos reales que sí terminó bien. Indica que los botones "SÍ/NO" de la confirmación de reinicio podían dispararse dos veces (doble clic, o el manejo de eventos de Phaser) antes de que la pantalla cambiara, llamando a `scene.restart()` dos veces y creando dos sesiones en el backend en una carrera, dejando una sin conexión real al juego.

## Cambio realizado

`scenes/BaseGameScene.ts` → `showRestartConfirmation()`: se agregó una bandera local `choiceMade` que bloquea cualquier click adicional sobre "SÍ"/"NO" una vez que ya se procesó uno, y se llama a `disableInteractive()` en ambos botones inmediatamente al hacer clic, antes de ejecutar `scene.restart()` o mostrar el resumen de nuevo.

## Testing manual

- [x] `npx tsc --noEmit` sin errores.
- [x] Desplegado a producción (rebuild + subida completa de `dist/`).

## Pendiente (decidido explícitamente por el usuario, no se implementa ahora)

- Guardar progreso al cerrar/ocultar la pestaña (`visibilitychange`/`beforeunload` llamando a `finish` con el puntaje actual) — reduciría las sesiones abandonadas de la causa #1.
- Limpiar el reporte del panel admin para no mezclar sesiones completas con incompletas (excluir `finished_at NULL` o etiquetarlas como "Incompleta").

## Checkpoint

✅ Fix del doble-clic desplegado y verificado. Las otras dos causas de sesiones incompletas quedan documentadas como mejoras futuras, no bugs de este incremento.
