import type { AuthResponse, User } from '$lib/types';
import { MOCK_API, API_BASE, apiRequest, ApiError } from './client';
import { mockAuthResponse, mockUser } from '$lib/mock/auth';

// Map the FastAPI user shape to our internal User interface.
// FastAPI uses is_superuser (boolean) instead of a role enum.
// is_superuser: true  -> 'super_admin'
// is_superuser: false -> use the role field returned by the API, fall back to 'operations'
function mapApiUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id ?? ''),
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    email: String(raw.email ?? ''),
    role: raw.is_superuser
      ? 'super_admin'
      : ((raw.role as User['role']) ?? 'operations'),
    permissions: raw.is_superuser ? ['all'] : [],
    is_active: Boolean(raw.is_active ?? true)
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  if (MOCK_API) {
    if (!email || !password) throw new Error('Email and password are required');
    return { ...mockAuthResponse };
  }
  const raw = await apiRequest<Record<string, unknown>>(
    '/api/v1/auth/internal/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
  return {
    access_token: String(raw.access_token ?? ''),
    refresh_token: String(raw.refresh_token ?? ''),
    token_type: String(raw.token_type ?? 'bearer'),
    device_id: String(raw.device_id ?? ''),
    user: mapApiUser((raw.user ?? raw) as Record<string, unknown>)
  };
}

export async function getMe(token: string): Promise<User> {
  if (MOCK_API) return { ...mockUser };
  const raw = await apiRequest<Record<string, unknown>>('/api/v1/users/me', {}, token);
  return mapApiUser(raw);
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  if (!res.ok) throw new ApiError(res.status, 'Token refresh failed');
  const data = await res.json();
  return {
    access_token: String(data.access_token ?? ''),
    refresh_token: String(data.refresh_token ?? '')
  };
}
