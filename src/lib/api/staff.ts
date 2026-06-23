import type { StaffMember } from '$lib/types';
import { MOCK_API, apiRequest } from './client';
import { mockStaff } from '$lib/mock/staff';

// Assumed real endpoints -- confirm with Suleiman before go-live:
//   GET  /api/v1/users
//   POST /api/v1/users
//   PATCH /api/v1/users/{id}
//   POST /api/v1/users/{id}/toggle         (replaces separate deactivate/reactivate)
//   POST /api/v1/users/{id}/reset-password

export async function getStaff(token?: string): Promise<StaffMember[]> {
  if (MOCK_API) return structuredClone(mockStaff);
  return apiRequest<StaffMember[]>('/api/v1/users', {}, token);
}

export async function createStaff(
  data: Omit<StaffMember, 'id'>,
  password: string,
  token?: string
): Promise<StaffMember> {
  if (MOCK_API) return { ...data, id: crypto.randomUUID() };
  return apiRequest<StaffMember>(
    '/api/v1/users',
    { method: 'POST', body: JSON.stringify({ ...data, password }) },
    token
  );
}

export async function updateStaff(
  id: string,
  data: Partial<StaffMember>,
  token?: string
): Promise<StaffMember> {
  if (MOCK_API) {
    const existing = mockStaff.find((s) => s.id === id);
    return { ...existing!, ...data };
  }
  return apiRequest<StaffMember>(
    `/api/v1/users/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    token
  );
}

export async function toggleStaff(id: string, token?: string): Promise<StaffMember> {
  if (MOCK_API) {
    const existing = mockStaff.find((s) => s.id === id);
    return { ...existing!, is_active: !existing!.is_active };
  }
  return apiRequest<StaffMember>(`/api/v1/users/${id}/toggle`, { method: 'POST' }, token);
}

export async function resetPassword(
  id: string,
  password: string,
  token?: string
): Promise<void> {
  if (MOCK_API) return;
  await apiRequest<void>(
    `/api/v1/users/${id}/reset-password`,
    { method: 'POST', body: JSON.stringify({ new_password: password }) },
    token
  );
}
