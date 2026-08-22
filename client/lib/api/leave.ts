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

// ==========================================
// LEAVE TYPES
// ==========================================

export async function getLeaveTypes(params?: { isActive?: boolean }) {
  const queryParams = new URLSearchParams();
  if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
  const url = `${API_BASE_URL}/leave-types${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch leave types');
  return result.data;
}

export async function createLeaveType(data: {
  code: 'PAID' | 'SICK' | 'UNPAID';
  name: string;
  defaultDays?: number;
  requiresProof?: boolean;
  isPaid?: boolean;
  isActive?: boolean;
}) {
  const response = await fetch(`${API_BASE_URL}/leave-types`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to create leave type');
  return result.data;
}

export async function updateLeaveType(id: string, data: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/leave-types/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to update leave type');
  return result.data;
}

export async function deleteLeaveType(id: string) {
  const response = await fetch(`${API_BASE_URL}/leave-types/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to delete leave type');
  return result.data;
}

// ==========================================
// LEAVE ALLOCATIONS
// ==========================================

export async function getPersonalLeaveAllocations(year?: number) {
  const url = `${API_BASE_URL}/leave-allocations/me${year ? `?year=${year}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch personal leave allocations');
  return result.data;
}

export async function getEmployeeLeaveAllocations(employeeId: string, year?: number) {
  const url = `${API_BASE_URL}/employees/${employeeId}/leave-allocations${year ? `?year=${year}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch employee leave allocations');
  return result.data;
}

export async function createEmployeeLeaveAllocation(
  employeeId: string,
  data: { leaveTypeId: string; year?: number; allocatedDays: number }
) {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/leave-allocations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to allocate leave');
  return result.data;
}

export async function updateEmployeeLeaveAllocation(
  employeeId: string,
  allocationId: string,
  data: { allocatedDays?: number; usedDays?: number }
) {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/leave-allocations/${allocationId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to update leave allocation');
  return result.data;
}

// ==========================================
// LEAVE REQUESTS
// ==========================================

export async function createLeaveRequest(data: {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  requestedDays?: number;
  reason?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/leave-requests`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to submit leave request');
  return result.data;
}

export async function getPersonalLeaveRequests(params?: {
  status?: string;
  year?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.year) queryParams.append('year', String(params.year));
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_BASE_URL}/leave-requests/me${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch personal leave requests');
  return result.data;
}

export async function getAdminLeaveRequests(params?: {
  status?: string;
  departmentId?: string;
  employeeId?: string;
  leaveTypeId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
  if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
  if (params?.leaveTypeId) queryParams.append('leaveTypeId', params.leaveTypeId);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_BASE_URL}/leave-requests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch admin leave requests');
  return result.data;
}

export async function getLeaveRequestById(id: string) {
  const response = await fetch(`${API_BASE_URL}/leave-requests/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch leave request');
  return result.data;
}

export async function approveLeaveRequest(id: string, reviewerComment?: string) {
  const response = await fetch(`${API_BASE_URL}/leave-requests/${id}/approve`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ reviewerComment }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to approve leave request');
  return result.data;
}

export async function rejectLeaveRequest(id: string, reviewerComment?: string) {
  const response = await fetch(`${API_BASE_URL}/leave-requests/${id}/reject`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ reviewerComment }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to reject leave request');
  return result.data;
}

export async function uploadLeaveAttachment(id: string, data: { attachmentUrl: string; attachmentName?: string }) {
  const response = await fetch(`${API_BASE_URL}/leave-requests/${id}/attachment`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to upload attachment');
  return result.data;
}
