import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getComplaints,
  submitComplaint,
  respondToComplaint
} from '$lib/api/messages';

export const load: PageServerLoad = async ({ cookies, parent }) => {
  const token = cookies.get('auth_token') ?? '';
  const { user } = await parent();

  const canViewComplaints = user?.role === 'super_admin' || user?.role === 'management';

  const [messages, complaints] = await Promise.all([
    getMessages(token),
    canViewComplaints ? getComplaints(token) : Promise.resolve([])
  ]);

  return { messages, complaints, canViewComplaints, user };
};

export const actions: Actions = {
  send: async ({ request, cookies }) => {
    const token = cookies.get('auth_token') ?? '';
    const data = await request.formData();
    const subject = (data.get('subject') as string)?.trim();
    const body = (data.get('body') as string)?.trim();
    const recipients = data.get('recipients') as string;
    const same_group_only = data.get('same_group_only') === 'true';
    const message_type = (data.get('message_type') as string) || 'general';

    if (!subject || !body || !recipients) {
      return fail(400, { error: 'Subject, message and recipients are required.', action: 'send' });
    }

    try {
      await sendMessage(token, { subject, body, recipients, same_group_only, message_type });
      return { success: true, action: 'send' };
    } catch {
      return fail(500, { error: 'Failed to send message. Please try again.', action: 'send' });
    }
  },

  markRead: async ({ request, cookies }) => {
    const token = cookies.get('auth_token') ?? '';
    const data = await request.formData();
    const messageId = data.get('message_id') as string;
    try {
      await markAsRead(token, messageId);
      return { success: true, action: 'markRead' };
    } catch {
      return fail(500, { error: 'Failed to mark as read.', action: 'markRead' });
    }
  },

  complaint: async ({ request, cookies }) => {
    const token = cookies.get('auth_token') ?? '';
    const data = await request.formData();
    const subject = (data.get('subject') as string)?.trim();
    const body = (data.get('body') as string)?.trim();

    if (!subject || !body) {
      return fail(400, { error: 'Subject and message are required.', action: 'complaint' });
    }

    try {
      await submitComplaint(token, { subject, body });
      return { success: true, action: 'complaint' };
    } catch {
      return fail(500, { error: 'Failed to submit complaint. Please try again.', action: 'complaint' });
    }
  },

  respond: async ({ request, cookies }) => {
    const token = cookies.get('auth_token') ?? '';
    const data = await request.formData();
    const complaintId = data.get('complaint_id') as string;
    const response = (data.get('response') as string)?.trim();

    if (!complaintId || !response) {
      return fail(400, { error: 'Response is required.', action: 'respond' });
    }

    try {
      await respondToComplaint(token, complaintId, response);
      return { success: true, action: 'respond' };
    } catch {
      return fail(500, { error: 'Failed to send response. Please try again.', action: 'respond' });
    }
  }
};
