const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

export async function api(path, options = {}, token) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch (_err) {}

  if (!res.ok) {
    const msg = payload?.error?.message || payload?.message || 'Erreur API';
    throw new ApiError(msg, res.status);
  }
  return payload;
}

export const authApi = {
  register: (username, email, password) =>
    fetch(`${API_URL.replace('/api', '')}/api/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    }).then(async (res) => {
      const payload = await res.json();
      if (!res.ok) throw new ApiError(payload?.error?.message || 'Erreur inscription', res.status);
      return payload;
    }),
  login: (identifier, password) =>
    fetch(`${API_URL.replace('/api', '')}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    }).then(async (res) => {
      const payload = await res.json();
      if (!res.ok) throw new ApiError(payload?.error?.message || 'Erreur connexion', res.status);
      return payload;
    })
};
