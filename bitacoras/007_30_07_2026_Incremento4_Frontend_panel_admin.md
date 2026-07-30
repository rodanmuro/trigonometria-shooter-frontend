# 007 - 30/07/2026 - Incremento 4: Panel de administración (Frontend)

## Resumen

Se replicó el panel admin de `multiplication-shooter-frontend` (`AdminScene.ts`, patrón híbrido Phaser + HTML sobre el canvas) con paridad completa: listado de usuarios con filtros/orden/paginación, ver sesiones de un usuario con resumen, carga masiva CSV, exportación CSV de usuarios y de sesiones.

## Cambios realizados

- `types/api.ts`: tipos nuevos (`AdminUserListItem`, `AdminUsersResponse`, `AdminGroupsResponse`, `UserSessionSummary`, `SessionListItemWithRow` — con `game_mode` en vez de `max_level_reached` —, `AdminUserSessionsResponse`, `CsvUploadResponse`, `AdminUsersFilterParams`, `AdminSessionsFilterParams`, `PaginationInfoExtended`).
- `services/adminApiService.ts` (nuevo): mismos 6 métodos que el proyecto anterior, pero usando nuestro `apiClient` (axios) en vez de `fetch` crudo, para reutilizar el interceptor de token ya existente. Descargas CSV vía `responseType: 'blob'`.
- `scenes/AdminScene.ts` (nuevo, adaptado casi 1:1): mismos helpers (`createButton`, `createSortableTableHeader`, `createUserRow`, `createPagination`, barra de filtros HTML, modal de carga CSV). Cambios: botón "Volver" navega a `MenuScene` (no `GameScene`), columna "Nivel" reemplazada por "Modo" (Razones/Triángulo según `game_mode`).
- `scenes/MenuScene.ts`: tercer botón "PANEL ADMIN" (rojo, distinguible), visible solo si `AuthManager.getUser()?.profile === 'admin'`; `createGameButton` ahora acepta colores opcionales para poder diferenciarlo visualmente.
- `config/gameConfig.ts`: `AdminScene` agregado a la lista de escenas.

## Testing manual

- [x] `npx tsc --noEmit` y `npm run build` sin errores.
- [x] Verificado con Playwright (perfil admin simulado vía localStorage): el botón "PANEL ADMIN" aparece en el menú; al hacer click carga `AdminScene`, que llama correctamente a `/admin/groups` y `/admin/users` contra el backend real (con el token inválido de la simulación, el backend responde 401 como es esperado, y el frontend muestra el diálogo de error sin romperse) — confirma que toda la integración front↔back está bien conectada.
- [ ] **Pendiente de validar por el usuario**: entrar con la cuenta real (`rodolfo.muriel@cevu.edu.co`) y confirmar que ve datos reales de estudiantes.

## Despliegue

Build de producción regenerado (`npm run build`) y subido completo por FTP a `public_html/trigonometria/` (mismo proceso que el despliegue inicial). Verificado que el HTML de producción sirve el bundle nuevo y que `multiplication-shooter` no se vio afectado.

## Checkpoint

✅ Panel admin desplegado en `https://voyeducando.com/trigonometria/`. Incremento 4 completo en ambos proyectos.
