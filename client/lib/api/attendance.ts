const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function checkIn(data?: { workDate?: string; checkInTime?: string; notes?: string }) {
  const response = await fetch(`${API_BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data || {}),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Check-in failed');
  }
  return result.data;
}
