import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getMe } from '$lib/api/auth';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('auth_token');
  const profile = await getMe(token!);
  return { profile };
};

export const actions: Actions = {
  updateProfile: async ({ request }) => {
    const form = await request.formData();
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const email = (form.get('email') as string)?.trim();

    if (!first_name || !last_name || !email) {
      return fail(400, { error: 'All fields are required.', action: 'updateProfile' });
    }

    // In mock mode, return success — real mode calls PATCH /auth/me
    return { success: true, action: 'updateProfile', first_name, last_name, email };
  },

  changePassword: async ({ request }) => {
    const form = await request.formData();
    const current_password = form.get('current_password') as string;
    const new_password = form.get('new_password') as string;
    const confirm_password = form.get('confirm_password') as string;

    if (!current_password || !new_password || !confirm_password) {
      return fail(400, { error: 'All password fields are required.', action: 'changePassword' });
    }

    if (new_password !== confirm_password) {
      return fail(400, { error: 'New passwords do not match.', action: 'changePassword' });
    }

    if (new_password.length < 8) {
      return fail(400, { error: 'New password must be at least 8 characters.', action: 'changePassword' });
    }

    // In mock mode, accept any current password — real mode validates server-side
    return { success: true, action: 'changePassword' };
  }
};
