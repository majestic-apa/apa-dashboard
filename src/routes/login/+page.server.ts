import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { login } from '$lib/api/auth';

const COOKIE_BASE = {
  path: '/',
  httpOnly: true,
  secure: false, // set to true in production behind HTTPS
  sameSite: 'lax'
} as const;

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const email = (form.get('email') as string)?.trim();
    const password = form.get('password') as string;

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required.' });
    }

    try {
      const { access_token, refresh_token, device_id } = await login(email, password);

      cookies.set('auth_token', access_token, { ...COOKIE_BASE, maxAge: 60 * 60 * 24 * 7 });      // 7 days
      cookies.set('refresh_token', refresh_token, { ...COOKIE_BASE, maxAge: 60 * 60 * 24 * 30 }); // 30 days
      if (device_id) {
        cookies.set('device_id', device_id, { ...COOKIE_BASE, maxAge: 60 * 60 * 24 * 30 });
      }
    } catch {
      return fail(401, { error: 'Invalid email or password.' });
    }

    redirect(302, '/dashboard');
  }
};
