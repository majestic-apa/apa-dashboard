import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getMe } from '$lib/api/auth';

const PUBLIC_PATHS = ['/login'];

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  const path = url.pathname;

  // Allow public paths without a token
  if (PUBLIC_PATHS.includes(path)) {
    const token = cookies.get('auth_token');
    // If already logged in, send to dashboard
    if (token) redirect(302, '/dashboard');
    return { user: null };
  }

  const token = cookies.get('auth_token');
  if (!token) redirect(302, '/login');

  try {
    const user = await getMe(token);
    return { user };
  } catch {
    // Token invalid or expired — clear it and redirect
    cookies.delete('auth_token', { path: '/' });
    redirect(302, '/login');
  }
};
