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

export async function getPayrollRuns(params?: { page?: number; limit?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_BASE_URL}/admin/payroll${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch payroll runs');
  return result.data;
}

export async function getEmployeePayroll(
  employeeId: string,
  params?: { year?: number; month?: number; page?: number; limit?: number }
) {
  const queryParams = new URLSearchParams();
  if (params?.year) queryParams.append('year', String(params.year));
  if (params?.month) queryParams.append('month', String(params.month));
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_BASE_URL}/admin/employees/${employeeId}/payroll${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch employee payroll history');
  return result.data;
}

export async function createPayrollRun(data: { periodStart: string; periodEnd: string }) {
  const response = await fetch(`${API_BASE_URL}/admin/payroll/runs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to create payroll run');
  return result.data;
}

export async function getPayrollRunById(runId: string) {
  const response = await fetch(`${API_BASE_URL}/admin/payroll/runs/${runId}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch payroll run details');
  return result.data;
}

export async function getPayslipsAdmin(params?: {
  employeeId?: string;
  payrollRunId?: string;
  status?: string;
  year?: number;
  month?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
  if (params?.payrollRunId) queryParams.append('payrollRunId', params.payrollRunId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.year) queryParams.append('year', String(params.year));
  if (params?.month) queryParams.append('month', String(params.month));
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_BASE_URL}/payslips${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch payslips');
  return result.data;
}

export async function getPersonalPayslips(params?: {
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.year) queryParams.append('year', String(params.year));
  if (params?.month) queryParams.append('month', String(params.month));
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_BASE_URL}/payslips/me${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch personal payslips');
  return result.data;
}

export async function getPayslipById(id: string) {
  const response = await fetch(`${API_BASE_URL}/payslips/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch payslip details');
  return result.data;
}
