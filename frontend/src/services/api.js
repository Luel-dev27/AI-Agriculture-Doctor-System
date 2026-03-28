import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  refreshSession,
  saveAuthSession,
} from './userService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function apiRequest(path, options = {}) {
  return apiRequestInternal(path, options, true);
}

async function apiRequestInternal(path, options = {}, allowRefresh = true) {
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;
  const accessToken = getStoredAccessToken();

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (
    response.status === 401 &&
    allowRefresh &&
    !path.startsWith('/auth/') &&
    getStoredRefreshToken()
  ) {
    try {
      const refreshedSession = await refreshSession(getStoredRefreshToken());
      saveAuthSession({
        accessToken: refreshedSession.accessToken,
        refreshToken: refreshedSession.refreshToken,
        user: refreshedSession.user,
      });

      return apiRequestInternal(path, options, false);
    } catch {
      clearAuthSession();
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = '';

    try {
      const parsed = JSON.parse(errorText);
      parsedMessage = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    } catch {
      parsedMessage = '';
    }

    throw new Error(parsedMessage || errorText || `API request failed: ${response.status}`);
  }

  return response.json();
}
