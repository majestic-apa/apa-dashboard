import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getMe, refreshAccessToken } from '$lib/api/auth';
import { ApiError } from '$lib/api/client';
import { getUnreadCount } from '$lib/api/messages';

const PUBLIC_PATHS = ['/login'];
const COOKIE_BASE = {
  path: '/',
  httpOnly: true,
  secure: false, // set to true in production
  sameSite: 'lax'
} as const;

function clearAuthCookies(cookies: Parameters<LayoutServerLoad>[0]['cookies']) {
  cookies.delete('auth_token', { path: '/' });
  cookies.delete('refresh_token', { path: '/' });
  cookies.delete('device_id', { path: '/' });
}

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  const path = url.pathname;

  if (PUBLIC_PATHS.includes(path)) {
    const token = cookies.get('auth_token');
    if (token) redirect(302, '/dashboard');
    return { user: null, unreadCount: 0 };
  }

  const token = cookies.get('auth_token');
  if (!token) redirect(302, '/login');

  try {
    const user = await getMe(token);
    const unreadCount = await getUnreadCount(token).catch(() => 0);
    return { user, unreadCount };
  } catch (e) {
    // On 401, attempt a silent token refresh before giving up
    if (e instanceof ApiError && e.status === 401) {
      const storedRefreshToken = cookies.get('refresh_token');
      if (storedRefreshToken) {
        try {
          const newTokens = await refreshAccessToken(storedRefreshToken);
          cookies.set('auth_token', newTokens.access_token, {
            ...COOKIE_BASE,
            maxAge: 60 * 60 * 24 * 7
          });
          if (newTokens.refresh_token) {
            cookies.set('refresh_token', newTokens.refresh_token, {
              ...COOKIE_BASE,
              maxAge: 60 * 60 * 24 * 30
            });
          }
          const user = await getMe(newTokens.access_token);
          const unreadCount = await getUnreadCount(newTokens.access_token).catch(() => 0);
          return { user, unreadCount };
        } catch {
          // Refresh also failed -- fall through to clear cookies
        }
      }
    }
    clearAuthCookies(cookies);
    redirect(302, '/login');
  }
};
