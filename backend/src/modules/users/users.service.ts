import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getProfile() {
    return { id: 1, name: 'Demo User', role: 'farmer' };
  }
}
