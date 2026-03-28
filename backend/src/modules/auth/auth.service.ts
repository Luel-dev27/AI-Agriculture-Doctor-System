import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(email: string, password: string) {
    void password;

    return {
      accessToken: 'placeholder-token',
      user: { id: 1, email },
    };
  }
}
