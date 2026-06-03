import type { StaffMember } from '$lib/types';
import { MOCK_API, apiRequest } from './client';
import { mockStaff } from '$lib/mock/staff';

export async function getStaff(token?: string): Promise<StaffMember[]> {
  if (MOCK_API) return structuredClone(mockStaff);
  return apiRequest<StaffMember[]>('/staff', {}, token);
}

export async function createStaff(
  data: Omit<StaffMember, 'id'> & { password: string },
  token?: string
): Promise<StaffMember> {
  if (MOCK_API) {
    return { ...data, id: crypto.randomUUID() };
  }
  return apiRequest<StaffMember>('/staff', { method: 'POST', body: JSON.stringify(data) }, token);
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
    `/staff/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    token
  );
}

export async function resetPassword(
  id: string,
  password: string,
  token?: string
): Promise<void> {
  if (MOCK_API) return;
  await apiRequest<void>(
    `/staff/${id}/reset-password`,
    { method: 'POST', body: JSON.stringify({ password }) },
    token
  );
}
