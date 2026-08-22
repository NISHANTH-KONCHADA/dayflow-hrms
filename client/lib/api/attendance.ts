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

export async function checkIn(data?: { workDate?: string; checkInTime?: string; notes?: string }) {
  const response = await fetch(`${API_BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data || {}),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Check-in failed');
  }
  return result.data;
}

export async function checkOut(data?: { workDate?: string; checkOutTime?: string; notes?: string }) {
  const response = await fetch(`${API_BASE_URL}/attendance/check-out`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data || {}),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Check-out failed');
  }
  return result.data;
}

export async function getPersonalAttendance(params?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_BASE_URL}/attendance/me${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch attendance history');
  return result.data;
}

export async function getPersonalSummary(params?: {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.month) queryParams.append('month', String(params.month));
  if (params?.year) queryParams.append('year', String(params.year));
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const url = `${API_BASE_URL}/attendance/me/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch attendance summary');
  return result.data;
}

export async function getAdminAttendance(params?: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employeeId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
  if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_BASE_URL}/attendance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch admin attendance');
  return result.data;
}

export async function getEmployeeAttendance(
  employeeId: string,
  params?: { startDate?: string; endDate?: string; status?: string; page?: number; limit?: number }
) {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_BASE_URL}/employees/${employeeId}/attendance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch employee attendance');
  return result.data;
}

export async function getEmployeeSummary(
  employeeId: string,
  params?: { month?: number; year?: number; startDate?: string; endDate?: string }
) {
  const queryParams = new URLSearchParams();
  if (params?.month) queryParams.append('month', String(params.month));
  if (params?.year) queryParams.append('year', String(params.year));
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const url = `${API_BASE_URL}/employees/${employeeId}/attendance/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch employee summary');
  return result.data;
}

export async function getWorkingSchedule(employeeId: string) {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/working-schedule`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch working schedule');
  return result.data;
}

export async function updateWorkingSchedule(employeeId: string, data: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/working-schedule`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to update working schedule');
  return result.data;
}
