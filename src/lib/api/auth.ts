import type { AuthResponse, User } from '$lib/types';
import { MOCK_API, apiRequest } from './client';
import { mockAuthResponse, mockUser } from '$lib/mock/auth';

export async function login(email: string, password: string): Promise<AuthResponse> {
  if (MOCK_API) {
    // Accept any credentials in mock mode
    if (!email || !password) throw new Error('Email and password are required');
    return { ...mockAuthResponse };
  }
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function getMe(token: string): Promise<User> {
  if (MOCK_API) {
    return { ...mockUser };
  }
  return apiRequest<User>('/auth/me', {}, token);
}
