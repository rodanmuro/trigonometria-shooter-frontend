import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthManager } from '../../src/managers/AuthManager';
import { makeJwt } from '../helpers/jwt';

const TOKEN_KEY = 'google_auth_token';
const USER_KEY = 'google_user_data';

// AuthManager es un singleton que lee localStorage en el constructor;
// se reinicia entre pruebas para simular una carga de página nueva.
function freshAuthManager(): AuthManager {
  (AuthManager as unknown as { instance?: AuthManager }).instance = undefined;
  return AuthManager.getInstance();
}

const nowSec = () => Math.floor(Date.now() / 1000);

describe('AuthManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getInstance siempre devuelve la misma instancia', () => {
    const a = freshAuthManager();
    expect(AuthManager.getInstance()).toBe(a);
  });

  it('sin sesión guardada arranca sin autenticar', () => {
    const auth = freshAuthManager();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.getUser()).toBeNull();
    expect(auth.getToken()).toBeNull();
  });

  describe('login', () => {
    it('con un token válido autentica y mapea los datos del usuario', () => {
      const auth = freshAuthManager();
      const token = makeJwt();

      expect(auth.login(token)).toBe(true);
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.getToken()).toBe(token);
      expect(auth.getUser()).toEqual({
        id: '106839451234567890123',
        email: 'estudiante@cevu.edu.co',
        name: 'Ana Pérez',
        picture: 'https://example.com/ana.png',
        given_name: 'Ana',
        family_name: 'Pérez',
        profile: 'student',
      });
    });

    it('guarda token y usuario en localStorage', () => {
      const auth = freshAuthManager();
      const token = makeJwt();
      auth.login(token);

      expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
      expect(JSON.parse(localStorage.getItem(USER_KEY)!).email).toBe('estudiante@cevu.edu.co');
    });

    it('rechaza un token expirado y no deja rastro', () => {
      const auth = freshAuthManager();
      expect(auth.login(makeJwt({ exp: nowSec() - 10 }))).toBe(false);
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getUser()).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('rechaza un token mal formado', () => {
      const auth = freshAuthManager();
      expect(auth.login('esto-no-es-un-jwt')).toBe(false);
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('limpia el estado y localStorage', () => {
      const auth = freshAuthManager();
      auth.login(makeJwt());
      auth.logout();

      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getUser()).toBeNull();
      expect(auth.getToken()).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('cierra la sesión sola cuando el token expira', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-01T10:00:00Z'));
      const auth = freshAuthManager();
      auth.login(makeJwt({ exp: nowSec() + 60 }));
      expect(auth.isAuthenticated()).toBe(true);

      vi.advanceTimersByTime(61_000);

      expect(auth.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('restauración de sesión al cargar', () => {
    const saveSession = (token: string, profile = 'student') => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({ id: '1', email: 'a@b.co', name: 'Ana', picture: '', profile })
      );
    };

    it('restaura una sesión vigente', () => {
      saveSession(makeJwt(), 'teacher');
      const auth = freshAuthManager();

      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.getUser()?.profile).toBe('teacher');
    });

    it('descarta una sesión con token expirado', () => {
      saveSession(makeJwt({ exp: nowSec() - 10 }));
      const auth = freshAuthManager();

      expect(auth.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });

    it('descarta una sesión con datos de usuario corruptos', () => {
      localStorage.setItem(TOKEN_KEY, makeJwt());
      localStorage.setItem(USER_KEY, '{no es json');
      const auth = freshAuthManager();

      expect(auth.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('si falta el usuario o el token, no restaura nada', () => {
      localStorage.setItem(TOKEN_KEY, makeJwt());
      const auth = freshAuthManager();
      expect(auth.getUser()).toBeNull();
    });
  });

  describe('updateUserFromBackend', () => {
    it('actualiza el perfil y lo persiste', () => {
      const auth = freshAuthManager();
      auth.login(makeJwt());
      auth.updateUserFromBackend({ profile: 'admin' });

      expect(auth.getUser()?.profile).toBe('admin');
      expect(JSON.parse(localStorage.getItem(USER_KEY)!).profile).toBe('admin');
    });

    it('conserva el resto de datos del usuario', () => {
      const auth = freshAuthManager();
      auth.login(makeJwt());
      auth.updateUserFromBackend({ profile: 'teacher' });

      expect(auth.getUser()?.email).toBe('estudiante@cevu.edu.co');
      expect(auth.getUser()?.name).toBe('Ana Pérez');
    });

    it('no hace nada si no hay usuario autenticado', () => {
      const auth = freshAuthManager();
      auth.updateUserFromBackend({ profile: 'admin' });

      expect(auth.getUser()).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });
  });
});
