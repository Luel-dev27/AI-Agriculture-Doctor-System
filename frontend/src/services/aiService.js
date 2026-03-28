import { apiRequest } from './api.js';

export function getAiStatus() {
  return apiRequest('/ai/status');
}
