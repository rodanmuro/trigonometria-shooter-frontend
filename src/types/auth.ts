/**
 * Tipos relacionados con autenticación OAuth de Google
 */

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  profile: 'student' | 'teacher' | 'admin';
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
  clientId?: string;
}

export interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  token: string | null;
}
