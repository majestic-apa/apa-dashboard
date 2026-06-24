import type { User, AuthResponse, BankAccount, TerminationLetter } from '$lib/types';

export const mockUser: User = {
  id: '1',
  first_name: 'Amina',
  last_name: 'Hassan',
  email: 'amina.hassan@majesticapa.com',
  role: 'super_admin',
  permissions: ['all'],
  is_active: true
};

export const mockBankAccount: BankAccount = {
  bank_name: 'First Bank of Nigeria',
  account_number: '3012345678',
  account_name: 'Amina Hassan',
  is_verified: true,
  flagged_for_update: false,
  updated_at: '2026-05-01T00:00:00Z'
};

export const mockTerminations: TerminationLetter[] = [];

export const mockAuthResponse: AuthResponse = {
  access_token: 'mock-jwt-token-super-admin',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  device_id: 'mock-device-id',
  user: mockUser
};
