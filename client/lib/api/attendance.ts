const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function checkIn(data?: { workDate?: string; checkInTime?: string; notes?: string }) {
  const response = await fetch(`${API_BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/attendance/me${query ? `?${query}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
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
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/attendance/me/summary${query ? `?${query}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
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
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/attendance${query ? `?${query}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch admin attendance');
  return result.data;
}

export async function getEmployeeAttendance(
  employeeId: string,
  params?: { startDate?: string; endDate?: string; status?: string; page?: number; limit?: number }
) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/employees/${employeeId}/attendance${query ? `?${query}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch employee attendance');
  return result.data;
}

export async function getEmployeeSummary(
  employeeId: string,
  params?: { month?: number; year?: number; startDate?: string; endDate?: string }
) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/employees/${employeeId}/attendance/summary${query ? `?${query}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch employee summary');
  return result.data;
}
