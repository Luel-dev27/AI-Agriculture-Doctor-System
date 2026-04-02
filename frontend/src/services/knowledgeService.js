import { apiRequest } from './api.js';

export function getKnowledgeEntries(cropName = '') {
  const query = cropName.trim()
    ? `?cropName=${encodeURIComponent(cropName.trim())}`
    : '';

  return apiRequest(`/knowledge${query}`);
}

export function upsertKnowledgeEntry(payload) {
  return apiRequest('/knowledge', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
