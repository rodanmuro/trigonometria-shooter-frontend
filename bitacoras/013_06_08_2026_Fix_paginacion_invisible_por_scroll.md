# 013 - 06/08/2026 - Fix: paginación invisible por falta de scroll

## Contexto

El usuario reportó ver "Mostrando 1-10 de 22 sesiones" en un reporte pero sin botón
"Siguiente" visible. Se reprodujo localmente con un servidor mock (sin depender de auth
real de Google) sirviendo una respuesta fija de 22 sesiones/10 por página, y capturas
con Playwright. La paginación (`Página 1 de 3` + botón "Siguiente →") **sí se genera
correctamente** — el bug no estaba en la lógica de paginación en sí.

## Causa real

`body` en `style.css` usaba `display:flex; place-items:center;` (centrado también
vertical) sin `overflow` habilitado. Cuando el contenido (canvas de 800px + padding) es
más alto que la ventana del navegador, el centrado recorta partes de arriba **y de
abajo** del contenido, sin ninguna forma de hacer scroll para alcanzarlas — el botón de
paginación, al fondo de la vista, quedaba fuera de la pantalla visible. Confirmado con
Playwright en una ventana de 700px de alto: el botón no era visible ni alcanzable hasta
corregir el CSS.

De paso, revisando esto se encontró un segundo problema relacionado: las barras de
filtro (overlays HTML con `position:absolute`, agregadas sobre el canvas) usaban un
`top` fijo en píxeles relativo a toda la página, sin sumar el offset real del canvas en
esa página (por el padding de `#app`, etc.) — con ventanas de distinto tamaño esto podía
hacer que la barra de filtros tapara parte del resumen (confirmado visualmente en la
primera captura de prueba).

## Cambios realizados

- `src/style.css`: `body` pasa de `place-items: center` (centrado horizontal y
  vertical) a `justify-content: center` (solo horizontal) + `overflow-y: auto`, para que
  la página scrollee cuando el contenido no entra en la ventana.
- `scenes/AdminScene.ts` y `scenes/StatsScene.ts`: nuevo método privado
  `getCanvasTopOffset()` (`this.game.canvas.getBoundingClientRect().top`), sumado al
  `top` fijo de las 3 barras de filtro HTML (`createUsersFilterBar`,
  `createSessionsFilterBar` en admin, `createFilterBar` en stats), para que se alineen
  con las coordenadas reales del canvas en la página en vez de asumir que el canvas
  siempre arranca en `y=0`.

## Testing

- [x] `npx tsc --noEmit` y `npm run build` sin errores.
- [x] **Verificado visualmente con Playwright** contra un servidor mock local (sin
      depender de auth real de Google, ya que la vista necesita datos reales
      autenticados): con ventana de 700px de alto, antes del fix la paginación quedaba
      fuera de pantalla sin scroll posible; después del fix, scrolleando hacia abajo se
      ve "Página 1 de 3" y el botón "Siguiente →" correctamente. También se confirmó que
      ya no hay superposición entre la barra de resumen y la barra de filtros.

## Despliegue

Pendiente.

## Checkpoint

✅ Bug reproducido, causa raíz identificada y corregida, verificado visualmente
end-to-end (con datos simulados). Pendiente desplegar a producción.
