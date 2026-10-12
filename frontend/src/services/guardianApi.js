// src/services/guardianApi.js
// API calls for the Guardian Circle model — replaces the old NGO dashboard API.
// There is no login/JWT flow here on purpose: guardians never hold an account,
// they only ever hold one encrypted share tied to a specific incident token.
//
// Backend teammate: these map to the `guardians` and `shares` tables in the
// team sync prompt. Adjust paths if your controller uses different ones.

import api from './api';

// Add a guardian to a victim's circle for a given incident/session token.
// Body: { token, guardianLabel, contactMethod }
// -> Response: { guardianId, shareIndex }
export const addGuardian = async ({ token, guardianLabel, contactMethod }) => {
  const response = await api.post('/guardians', { token, guardianLabel, contactMethod });
  return response.data;
};

// List guardians currently registered for a given incident/session token.
// -> Response: [{ guardianId, guardianLabel, contactMethod, shareIssued }]
export const listGuardians = async (token) => {
  const response = await api.get(`/guardians`, { params: { token } });
  return response.data;
};

// Remove a guardian (and invalidate their share) before shares are finalized.
export const removeGuardian = async (guardianId) => {
  const response = await api.delete(`/guardians/${guardianId}`);
  return response.data;
};

// Generate and distribute Shamir's Secret Sharing shares once the circle is set.
// Body: { token, threshold }  e.g. { token: "SV-XXXX-XX", threshold: 3 }
// -> Response: { totalShares, threshold, distributed: true }
export const generateShares = async ({ token, threshold }) => {
  const response = await api.post('/shares/generate', { token, threshold });
  return response.data;
};

// A guardian submits their share to help reconstruct the incident's AES key.
// Body: { token, guardianId, shareValue }
// -> Response: { accepted: true, sharesReceived, thresholdMet }
export const submitShare = async ({ token, guardianId, shareValue }) => {
  const response = await api.post('/shares/submit', { token, guardianId, shareValue });
  return response.data;
};

// Poll recovery progress for a given incident token (how many shares in vs threshold).
// -> Response: { sharesReceived, threshold, thresholdMet, decryptedPayloadUrl? }
export const getRecoveryStatus = async (token) => {
  const response = await api.get(`/shares/status`, { params: { token } });
  return response.data;
};

export default {
  addGuardian,
  listGuardians,
  removeGuardian,
  generateShares,
  submitShare,
  getRecoveryStatus,
};
