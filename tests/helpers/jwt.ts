import type { GoogleTokenPayload } from '../../src/types/auth';

function base64url(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Construye un JWT sin firma válida. Alcanza para el frontend, que solo
 * decodifica el payload con jwt-decode (la verificación real la hace el backend).
 */
export function makeJwt(overrides: Partial<GoogleTokenPayload> = {}): string {
  const payload: GoogleTokenPayload = {
    iss: 'https://accounts.google.com',
    azp: 'client-id.apps.googleusercontent.com',
    aud: 'client-id.apps.googleusercontent.com',
    sub: '106839451234567890123',
    email: 'estudiante@cevu.edu.co',
    email_verified: true,
    name: 'Ana Pérez',
    picture: 'https://example.com/ana.png',
    given_name: 'Ana',
    family_name: 'Pérez',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
  return `${base64url({ alg: 'RS256', typ: 'JWT' })}.${base64url(payload)}.firma`;
}
