/**
 * BloodLink DVO — API Service
 *
 * Centralized helper to call the Laravel backend.
 * All responses are returned as parsed JSON objects.
 *
 * The token is stored in localStorage after login and
 * automatically attached to every subsequent request.
 */

const API_BASE = 'http://localhost:8000/api';
const TOKEN_KEY = 'bloodlink_api_token';

// ─── Token helpers ─────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Core fetch wrapper ────────────────────────────────────────────────

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Parse the JSON body
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Build a user-friendly error message
    const message =
      data.message ||
      (data.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Auth endpoints ────────────────────────────────────────────────────

/**
 * POST /api/login
 * @param {string} email
 * @param {string} password
 * @returns {{ user: object, token: string }}
 */
export async function apiLogin(email, password) {
  const data = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Persist the token for future requests
  if (data.token) {
    setToken(data.token);
  }

  return data;
}

/**
 * POST /api/logout
 */
export async function apiLogout() {
  try {
    await request('/logout', { method: 'POST' });
  } finally {
    clearToken();
  }
}

/**
 * GET /api/me
 * @returns {{ user: object }}
 */
export async function apiGetMe() {
  return request('/me');
}

// ─── User Management endpoints ─────────────────────────────────────────

/**
 * GET /api/users
 * @returns {{ users: object[] }}
 */
export async function apiGetUsers() {
  return request('/users');
}

/**
 * GET /api/users/:id
 * @param {number} id — numeric user_id
 * @returns {{ user: object }}
 */
export async function apiGetUser(id) {
  return request(`/users/${id}`);
}

/**
 * POST /api/users
 * @param {object} userData — { firstName, lastName, email, password, contactNumber, role, status, hospitalId }
 * @returns {{ user: object, message: string }}
 */
export async function apiCreateUser(userData) {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/**
 * PUT /api/users/:id
 * @param {number} id — numeric user_id
 * @param {object} userData — { firstName, lastName, email, contactNumber, role, status }
 * @returns {{ user: object, message: string }}
 */
export async function apiUpdateUser(id, userData) {
  return request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

// ─── Hospital Management endpoints ─────────────────────────────────────

/**
 * GET /api/hospitals
 * @returns {{ hospitals: object[] }}
 */
export async function apiGetHospitals() {
  return request('/hospitals');
}

/**
 * POST /api/hospitals
 * @param {object} data — { name, type, contact, phone, email, address, registrationStatus }
 * @returns {{ hospital: object, message: string }}
 */
export async function apiCreateHospital(data) {
  return request('/hospitals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT /api/hospitals/:id
 * @param {number} id — numeric hospital_id
 * @param {object} data — { name, type, contact, phone, email, address, registrationStatus }
 * @returns {{ hospital: object, message: string }}
 */
export async function apiUpdateHospital(id, data) {
  return request(`/hospitals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE /api/hospitals/:id
 * @param {number} id — numeric hospital_id
 * @returns {{ message: string }}
 */
export async function apiDeleteHospital(id) {
  return request(`/hospitals/${id}`, {
    method: 'DELETE',
  });
}
