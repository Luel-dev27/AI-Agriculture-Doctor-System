const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = '';

    try {
      const parsed = JSON.parse(errorText);
      parsedMessage = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    } catch {}

    throw new Error(parsedMessage || errorText || `API request failed: ${response.status}`);
  }

  return response.json();
}
