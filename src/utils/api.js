/**
 * Centralized API helper that automatically attaches authorization bearer tokens
 * and formats JSON requests and responses consistently.
 */

const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('tracecrop_token');
  const headers = { ...options.headers };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is plain object, serialize to JSON
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { success: false, message: 'Invalid server response' };
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    error.response = { status: response.status, data };
    throw error;
  }

  return data;
}

// Convenient axios-like interface: api.get, api.post, api.patch, api.delete
export const api = {
  get: async (endpoint, options = {}) => {
    const data = await apiRequest(endpoint, { ...options, method: 'GET' });
    return { data, ...data };
  },
  post: async (endpoint, body, options = {}) => {
    const data = await apiRequest(endpoint, { ...options, method: 'POST', body });
    return { data, ...data };
  },
  patch: async (endpoint, body, options = {}) => {
    const data = await apiRequest(endpoint, { ...options, method: 'PATCH', body });
    return { data, ...data };
  },
  delete: async (endpoint, options = {}) => {
    const data = await apiRequest(endpoint, { ...options, method: 'DELETE' });
    return { data, ...data };
  },
};

export default api;
