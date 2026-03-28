import { apiRequest } from './api.js';

const AUTH_STORAGE_KEY = 'authSession';

export function login(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function register(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function refreshSession(refreshToken) {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  });
}

export function getProfile() {
  return apiRequest('/users/me');
}

export function getStoredAuthSession() {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getStoredAccessToken() {
  return getStoredAuthSession()?.accessToken || '';
}

export function getStoredRefreshToken() {
  return getStoredAuthSession()?.refreshToken || '';
}

export function saveAuthSession(session) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('authchange'));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event('authchange'));
}
