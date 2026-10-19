/**
 * Modo demostración, SOLO en desarrollo (`npm run dev` / `npm run dev:lan`).
 *
 * Abrir la app con `?demo=1` guarda una sesión ficticia en localStorage para saltarse el login de
 * Google, que no funciona desde un celular conectado por IP de red local. El juego corre igual;
 * las llamadas al backend fallarán o no existirán y el juego continúa sin sincronizar.
 *
 * En `npm run build` `import.meta.env.DEV` es `false` y todo este bloque se elimina.
 * Este módulo debe importarse primero en `main.ts`, antes de que AuthManager lea localStorage.
 */
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo')) {
  const base64url = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = { sub: 'demo', email: 'demo@local', name: 'Demo Celular', exp, iat: exp - 3600 };
  const token = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(payload)}.demo`;

  localStorage.setItem('google_auth_token', token);
  localStorage.setItem(
    'google_user_data',
    JSON.stringify({
      id: 'demo',
      email: 'demo@local',
      name: 'Demo Celular',
      picture: '',
      given_name: 'Demo',
      family_name: 'Celular',
      profile: 'student',
    })
  );
  console.warn('Modo demostración: sesión ficticia (solo desarrollo)');
}
