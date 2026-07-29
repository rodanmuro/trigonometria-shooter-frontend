import { jwtDecode } from 'jwt-decode';
import type { GoogleUser, GoogleTokenPayload, AuthState } from '../types/auth';

/**
 * Gestiona la autenticación de usuarios con Google OAuth
 * Almacena el token en localStorage y mantiene el estado de sesión
 */
export class AuthManager {
  private static instance: AuthManager;
  private authState: AuthState;
  private readonly TOKEN_KEY = 'google_auth_token';
  private readonly USER_KEY = 'google_user_data';

  private constructor() {
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null
    };

    this.restoreSession();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Procesa el login con el token de Google
   */
  public login(googleToken: string): boolean {
    try {
      const payload = jwtDecode<GoogleTokenPayload>(googleToken);

      const now = Date.now() / 1000;
      if (payload.exp < now) {
        console.error('Token de Google expirado');
        return false;
      }

      const user: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
        profile: 'student' // Default, será actualizado por el backend
      };

      this.authState = {
        isAuthenticated: true,
        user,
        token: googleToken
      };

      this.saveSession();

      console.log('Login exitoso:', user.name);
      return true;
    } catch (error) {
      console.error('Error al procesar login:', error);
      return false;
    }
  }

  public logout(): void {
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null
    };

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    console.log('Logout exitoso');
  }

  public isAuthenticated(): boolean {
    if (!this.authState.token) {
      return false;
    }

    try {
      const payload = jwtDecode<GoogleTokenPayload>(this.authState.token);
      const now = Date.now() / 1000;

      if (payload.exp < now) {
        console.log('Token expirado, cerrando sesión');
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al validar token:', error);
      this.logout();
      return false;
    }
  }

  public getUser(): GoogleUser | null {
    return this.authState.user;
  }

  public getToken(): string | null {
    return this.authState.token;
  }

  /**
   * Actualiza los datos del usuario con información del backend
   */
  public updateUserFromBackend(backendUser: any): void {
    if (this.authState.user) {
      this.authState.user = {
        ...this.authState.user,
        profile: backendUser.profile
      };
      this.saveSession();
      console.log('Usuario actualizado con datos del backend. Profile:', backendUser.profile);
    }
  }

  private saveSession(): void {
    if (this.authState.token) {
      localStorage.setItem(this.TOKEN_KEY, this.authState.token);
    }
    if (this.authState.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(this.authState.user));
    }
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as GoogleUser;

        const payload = jwtDecode<GoogleTokenPayload>(token);
        const now = Date.now() / 1000;

        if (payload.exp >= now) {
          this.authState = {
            isAuthenticated: true,
            user,
            token
          };
          console.log('Sesión restaurada:', user.name);
        } else {
          console.log('Sesión expirada, limpiando...');
          this.logout();
        }
      } catch (error) {
        console.error('Error al restaurar sesión:', error);
        this.logout();
      }
    }
  }
}
