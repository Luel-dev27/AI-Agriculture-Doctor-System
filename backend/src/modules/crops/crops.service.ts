import { Injectable } from '@nestjs/common';

@Injectable()
export class CropsService {
  private readonly crops = [
    { id: 1, name: 'Tomato', variety: 'Roma' },
    { id: 2, name: 'Maize', variety: 'BH-546' },
    { id: 3, name: 'Wheat', variety: 'Kubsa' },
    { id: 4, name: 'Potato', variety: 'Gudene' },
    { id: 5, name: 'Coffee', variety: '74110' },
  ];

  findAll() {
    return this.crops;
  }
}
