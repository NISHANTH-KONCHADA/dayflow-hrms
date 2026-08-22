const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ==========================================
// LEAVE TYPES
// ==========================================

export async function getLeaveTypes(params?: { isActive?: boolean }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/leave-types${query ? `?${query}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
  const response = await fetch(url, { credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch personal leave allocations');
  return result.data;
}

export async function getEmployeeLeaveAllocations(employeeId: string, year?: number) {
  const url = `${API_BASE_URL}/employees/${employeeId}/leave-allocations${year ? `?year=${year}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/leave-requests/me${query ? `?${query}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
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
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/leave-requests${query ? `?${query}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch admin leave requests');
  return result.data;
}

export async function getLeaveRequestById(id: string) {
  const response = await fetch(`${API_BASE_URL}/leave-requests/${id}`, {
    credentials: 'include',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch leave request');
  return result.data;
}

export async function approveLeaveRequest(id: string, reviewerComment?: string) {
  const response = await fetch(`${API_BASE_URL}/leave-requests/${id}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reviewerComment }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to reject leave request');
  return result.data;
}
