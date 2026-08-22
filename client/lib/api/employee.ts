import { getStoredToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getEmployees(params?: {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_BASE_URL}/employees${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch employees');
  }

  return result.data;
}

export async function getEmployeeById(id: string) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch employee details');
  }

  return result.data;
}

export async function createEmployee(data: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to create employee');
  }

  return result.data;
}

export async function updateEmployee(id: string, data: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update employee');
  }

  return result.data;
}

export async function deleteEmployee(id: string) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to delete employee');
  }

  return result.data;
}

export async function getDepartments() {
  const response = await fetch(`${API_BASE_URL}/company/departments`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch departments');
  }

  return result.data;
}

export async function getJobPositions() {
  const response = await fetch(`${API_BASE_URL}/company/job-positions`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch job positions');
  }

  return result.data;
}

export async function getSkills() {
  const response = await fetch(`${API_BASE_URL}/company/skills`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch skills');
  }

  return result.data;
}
