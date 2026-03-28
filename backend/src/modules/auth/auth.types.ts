export interface AuthTokenPayload {
  sub: number;
  email: string;
  role: 'farmer' | 'agronomist' | 'admin';
  name: string;
  sessionVersion: number;
  tokenType: 'access' | 'refresh';
}
