export interface AuthTokenPayload {
  sub: number;
  email: string;
  role: 'farmer' | 'agronomist' | 'admin';
  name: string;
}
