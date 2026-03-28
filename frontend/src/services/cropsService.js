import { apiRequest } from './api.js';

export function getCrops() {
  return apiRequest('/crops');
}
