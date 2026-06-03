import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { login } from '$lib/api/auth';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const email = (form.get('email') as string)?.trim();
    const password = form.get('password') as string;

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required.' });
    }

    try {
      const { access_token } = await login(email, password);

      cookies.set('auth_token', access_token, {
        path: '/',
        httpOnly: true,
        secure: false, // set to true in production behind HTTPS
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    } catch {
      return fail(401, { error: 'Invalid email or password.' });
    }

    redirect(302, '/dashboard');
  }
};
