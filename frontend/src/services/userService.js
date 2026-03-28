import { apiRequest } from './api.js';

export function login(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getProfile() {
  return apiRequest('/users/me');
}
