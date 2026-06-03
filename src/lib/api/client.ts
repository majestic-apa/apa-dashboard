export const MOCK_API = import.meta.env.VITE_MOCK_API === 'true';
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new ApiError(response.status, text);
  }

  return response.json() as Promise<T>;
}
