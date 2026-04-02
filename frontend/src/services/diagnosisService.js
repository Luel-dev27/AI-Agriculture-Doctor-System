import { apiRequest } from './api.js';

export function diagnoseCrop(payload) {
  return apiRequest('/diagnosis', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function diagnoseCropImage({ cropName, file }) {
  const formData = new FormData();
  formData.append('cropName', cropName);
  formData.append('image', file);

  return apiRequest('/diagnosis', {
    method: 'POST',
    body: formData,
  });
}

export function diagnoseCropImageWithNotes({ cropName, file, fieldNotes }) {
  const formData = new FormData();
  formData.append('cropName', cropName);
  formData.append('image', file);

  if (fieldNotes?.trim()) {
    formData.append('fieldNotes', fieldNotes.trim());
  }

  return apiRequest('/diagnosis', {
    method: 'POST',
    body: formData,
  });
}

export function getDiagnosisHistory() {
  return apiRequest('/diagnosis/history');
}

export function reviewDiagnosis(id, payload) {
  return apiRequest(`/diagnosis/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
