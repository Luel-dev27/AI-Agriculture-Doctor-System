import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      name: 'AI Agriculture Doctor System API',
      status: 'ok',
    };
  }
}
