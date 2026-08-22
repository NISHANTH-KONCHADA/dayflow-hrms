import { getAuthHeaders } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function getEmployeeSalary(employeeId: string) {
  const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}/salary`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const result = await response.json();
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) throw new Error(result.message || 'Failed to fetch employee salary structure');
  return result.data;
}

export async function createEmployeeSalary(employeeId: string, data: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}/salary`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to configure employee salary structure');
  return result.data;
}

export async function updateEmployeeSalary(employeeId: string, data: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}/salary`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to update employee salary structure');
  return result.data;
}

export async function previewEmployeeSalary(employeeId: string, data: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}/salary/preview`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to generate salary preview');
  return result.data;
}
