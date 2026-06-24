import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getMe } from '$lib/api/auth';
import { getBankAccount, getTerminations, updateBankAccount, submitTermination } from '$lib/api/profile';
import { submitComplaint } from '$lib/api/messages';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('auth_token') ?? '';
  const [profile, bankAccount, terminations] = await Promise.all([
    getMe(token),
    getBankAccount(token),
    getTerminations(token)
  ]);
  return { profile, bankAccount, terminations };
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

    return { success: true, action: 'changePassword' };
  },

  updateBank: async ({ request, cookies }) => {
    const token = cookies.get('auth_token') ?? '';
    const data = await request.formData();
    const bank_name = (data.get('bank_name') as string)?.trim();
    const account_number = (data.get('account_number') as string)?.trim();
    const account_name = (data.get('account_name') as string)?.trim();

    if (!bank_name || !account_number || !account_name) {
      return fail(400, { bankError: 'All bank account fields are required.' });
    }
    if (!/^\d{10}$/.test(account_number)) {
      return fail(400, { bankError: 'Account number must be exactly 10 digits.' });
    }
    try {
      await updateBankAccount(token, { bank_name, account_number, account_name });
      return { bankSuccess: 'Bank account updated. Finance will verify and process within 2 business days.' };
    } catch {
      return fail(500, { bankError: 'Failed to update bank account. Please try again.' });
    }
  },

  terminate: async ({ request, cookies }) => {
    const token = cookies.get('auth_token') ?? '';
    const data = await request.formData();
    const reason = (data.get('reason') as string)?.trim();
    const effective_date = (data.get('effective_date') as string)?.trim();

    if (!reason || !effective_date) {
      return fail(400, { terminateError: 'Reason and effective date are required.' });
    }
    if (reason.length < 20) {
      return fail(400, {
        terminateError: 'Please provide a more detailed reason (at least 20 characters).'
      });
    }
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 30);
    const effectiveDate = new Date(effective_date);
    if (effectiveDate < minDate) {
      return fail(400, {
        terminateError: 'Effective date must be at least 30 days from today.'
      });
    }
    try {
      await submitTermination(token, { reason, effective_date });
      return {
        terminateSuccess:
          'Your termination letter has been submitted and will be reviewed by management.'
      };
    } catch {
      return fail(500, { terminateError: 'Failed to submit termination letter. Please try again.' });
    }
  },

  quickComplaint: async ({ request, cookies }) => {
    const token = cookies.get('auth_token') ?? '';
    const data = await request.formData();
    const subject = (data.get('subject') as string)?.trim();
    const body = (data.get('body') as string)?.trim();

    if (!subject || !body) {
      return fail(400, { complaintError: 'Subject and message are required.' });
    }
    try {
      await submitComplaint(token, { subject, body });
      return {
        complaintSuccess: 'Your complaint has been submitted and will be reviewed by management.'
      };
    } catch {
      return fail(500, { complaintError: 'Failed to submit complaint. Please try again.' });
    }
  }
};
