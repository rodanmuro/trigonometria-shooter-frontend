# Bitácora 027 - 19/10/2026

## Responsivo, fase 1: base (escalado, CSS táctil, aviso de rotación, botón de Google)

---

## Resumen
Primera fase del plan de la bitácora 026. El canvas se ajusta al espacio disponible sin deformarse, la página deja de desplazarse o hacer zoom con el dedo, y el botón de Google del login se coloca sobre el botón dibujado aunque el canvas esté escalado.

**Estado:** ✅ Completada. E2E 204/204 (195 anteriores + 9 nuevas), Vitest 130/130, `tsc`, `typecheck:e2e` y build sin errores. **No probado en un celular real** (solo viewport de 844×390 en el navegador de pruebas).

## Cambios
| Archivo | Cambio |
|---------|--------|
| `config/gameConfig.ts` | `scale: { mode: FIT, autoCenter: CENTER_BOTH, 1200×800, max: 1200×800 }`: se reduce para caber, nunca se agranda |
| `index.html` | `viewport` con `maximum-scale=1, user-scalable=no, viewport-fit=cover`; aviso `#rotate-notice` |
| `style.css` | Se retira el maquetado de la plantilla de Vite (`body` flex, `#app` con padding y ancho máximo). `html/body` al 100 % con el color del juego, `overflow: hidden`, `overscroll-behavior: none`, sin selección ni *callout* táctil (salvo `input`/`select`), `#app` a `100vw × 100dvh`, `touch-action: none` en el canvas |
| `style.css` | Aviso de rotación con `@media (orientation: portrait) and (pointer: coarse)` |
| `LoginScene.ts` | El `div` de Google pasa a `position: fixed` y se coloca con `placeOverCanvas` (rectángulo del canvas × escala), recalculado en cada `resize`; se desuscribe en SHUTDOWN |

## Instantáneas regeneradas (a propósito)
Se quitó el `padding: 2rem` de `#app`, así que el canvas pasó de `top = 32 px` a `0` y las barras de filtros HTML (que suman ese desplazamiento) subieron 32 px. Cinco instantáneas del DOM (`stats-lista-paginada`, `stats-vacio`, `admin-usuarios`, `admin-usuarios-ordenada`, `admin-sesiones`) fallaron **solo** por ese `top`. Se regeneraron y `git diff` confirma que cambió únicamente esa línea en cada una (167→135, 222→190, 117→85). Las instantáneas de Phaser (coordenadas del mundo) no cambiaron.

## Pruebas nuevas (`cypress/e2e/mobile-base.cy.ts`, 9)
Con 844×390 y 390×844: el canvas cabe, centrado, 3:2 y usa todo el alto; sin desborde de la página; `touch-action`, `overscroll-behavior` y `user-select`; sin aviso en horizontal; botón de Google centrado sobre el dibujado; un movimiento en el centro llega al mundo como (600, 400); Estadísticas se abre con el canvas escalado; en vertical el aviso existe y su regla solo aplica a `pointer: coarse` (Cypress no emula puntero táctil, se comprueba la regla y no la visibilidad); con ratón no se tapa el juego.

Nota: la primera corrida falló 5 de las 9 porque las pruebas llamaban a `gameScene()` sin abrir un juego (el menú no es una escena de juego); el fallo del botón de Google fue un efecto en cadena. Se corrigió con `startGame(RATIO_GAME)` y el spec pasó 9/9.

## Limitaciones conocidas
- En vertical solo se tapa con el aviso; la partida sigue corriendo detrás (el tiempo es por reloj).
- Tarjetas (140×80), HUD, triángulo y puntería táctil siguen sin compensar la escala (a ~0,49× quedan ilegibles): fase 2.
- Barras de filtros aún posicionadas respecto a la página; aviso de navegador incrustado y panel admin solo escritorio: fase 3.

## Próximo paso
Fase 2, jugabilidad táctil: `layout.ts` con `computeLayout`, escala de tarjetas/HUD/mira/triángulo, tolerancia de impacto, `setResolution`, pantalla completa.

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 19 de octubre de 2026
**Estado:** Fase 1 completada
