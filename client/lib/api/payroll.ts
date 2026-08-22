const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function getPayrollRuns(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/admin/payroll${query ? `?${query}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch payroll runs');
  return result.data;
}

export async function getEmployeePayroll(
  employeeId: string,
  params?: { year?: number; month?: number; page?: number; limit?: number }
) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE_URL}/admin/employees/${employeeId}/payroll${query ? `?${query}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch employee payroll history');
  return result.data;
}

export async function createPayrollRun(data: { periodStart: string; periodEnd: string }) {
  const response = await fetch(`${API_BASE_URL}/admin/payroll/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to create payroll run');
  return result.data;
}

export async function getPayrollRunById(runId: string) {
  const response = await fetch(`${API_BASE_URL}/admin/payroll/runs/${runId}`, {
    credentials: 'include',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch payroll run details');
  return result.data;
}
