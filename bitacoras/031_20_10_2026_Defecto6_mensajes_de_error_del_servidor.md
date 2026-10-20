# Bitácora 031 - 20/10/2026

## Defecto 6: los errores muestran el mensaje del servidor

---

## Problema
Al pasar a axios, `adminApiService` (y el resto de servicios) dejó de mostrar el mensaje que envía el backend: los avisos de error decían "Request failed with status code N" en lugar de, por ejemplo, "Acceso denegado" o "CSV inválido: Falta la columna group". La versión con `fetch` sí los mostraba (`error`, o `error: message`). Estaba anotado como defecto 6 en la bitácora 014 y lo dejé a decidir; el usuario pidió corregirlo.

## Corrección
- `utils/serverError.ts`: `serverErrorMessage(data)` toma `error` y/o `message` del cuerpo (`error: message` si vienen los dos; `undefined` si no hay ninguno utilizable) y `serverErrorMessageFrom(data)` lo hace también para cuerpos que llegan como **Blob** (las exportaciones piden `responseType: 'blob'`, así que el JSON de error llega como Blob; se lee con `FileReader` porque `Blob.text()` no existe en jsdom).
- `apiService`: el interceptor de respuesta (ahora `async`) sustituye `error.message` por el del servidor cuando lo hay. Cubre a todos los servicios a la vez; el error original (`error.response`, `code`…) llega intacto. Sin mensaje en el cuerpo se conserva el de axios.

## Efecto visible
- Estadísticas, panel admin (usuarios, sesiones), carga de CSV y exportaciones muestran el mensaje del backend.
- Un 500 sin cuerpo útil sigue mostrando "Request failed with status code 500".

## Pruebas
- Vitest (+14, total 183): `serverError` (error, message, ambos, vacíos y tipos inválidos, Blob JSON y Blob no JSON) y dos pruebas de `apiService` (mensaje del servidor y conservar el de axios).
- E2E 238/238 (+1): las pruebas que fijaban "Request failed…" se invirtieron (`stats`, `admin-sessions`, `admin-users`, `admin-actions`) y se añadió "exportar falla con un mensaje del servidor (Blob)". Se mantiene la de 500 sin cuerpo con el mensaje genérico.
- Instantáneas regeneradas a propósito: `admin-error` y `stats-error-carga` (solo cambia el texto del error: de "Request failed with status code N" a "Acceso denegado" / "Error simulado").

## Incidencia
Un `sed` para cambiar una expectativa tocó también una línea de la prueba negativa vecina y la dejó contradictoria (esperar y no esperar el mismo texto); lo detecté al revisar la salida y lo restauré antes de la corrida final.

## Estado de los defectos de la bitácora 014
1 a 6 corregidos.

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 20 de octubre de 2026
**Estado:** Defecto 6 corregido
