// Se ejecuta antes de cada spec.

beforeEach(() => {
  // Red de seguridad: cualquier llamada a la API que el test no haya simulado
  // responde 501 y queda a la vista, en lugar de intentar llegar a un backend real.
  // (Los intercepts definidos después tienen prioridad sobre este.)
  cy.intercept('/api/**', {
    statusCode: 501,
    body: { success: false, error: 'Llamada a la API sin simular en E2E' },
  }).as('unstubbed');

  // Google Identity Services se carga desde un CDN externo; se sustituye por un script vacío
  // para que las pruebas no dependan de la red. Cada test define window.google si lo necesita.
  cy.intercept('GET', 'https://accounts.google.com/gsi/client', {
    headers: { 'content-type': 'application/javascript' },
    body: '',
  });
});
