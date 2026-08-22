const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dayflow_token');
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dayflow_token', token);
  }
}

export function clearStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dayflow_token');
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function login(identifier: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ identifier, password }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Login failed');
  }

  if (result.data?.token) {
    setStoredToken(result.data.token);
  }

  return result.data;
}

export async function registerOrganization(data: {
  companyName: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Organization registration failed');
  }

  if (result.data?.token) {
    setStoredToken(result.data.token);
  }

  return result.data;
}

export async function getMe() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch session');
  }

  return result.data;
}

export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    clearStoredToken();
  }
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to change password');
  }

  return result.data;
}
