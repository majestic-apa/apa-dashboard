import type { User, AuthResponse } from '$lib/types';

export const mockUser: User = {
  id: '1',
  first_name: 'Amina',
  last_name: 'Hassan',
  email: 'amina.hassan@majesticapa.com',
  role: 'super_admin',
  permissions: ['all'],
  is_active: true
};

export const mockAuthResponse: AuthResponse = {
  access_token: 'mock-jwt-token-super-admin',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  device_id: 'mock-device-id',
  user: mockUser
};
