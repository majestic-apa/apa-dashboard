import type { Message, Complaint } from '$lib/types';
import { mockMessages, mockComplaints } from '$lib/mock/messages';

// All functions return mock data unconditionally.
// Suleiman has not yet built the messages API endpoints.
// When endpoints are ready: re-add MOCK_API guard + apiRequest calls,
// update endpoint strings, and remove this comment.

let messagesStore: Message[] = structuredClone(mockMessages);
let complaintsStore: Complaint[] = structuredClone(mockComplaints);

export async function getMessages(_token: string): Promise<Message[]> {
  return structuredClone(messagesStore);
}

export async function sendMessage(
  _token: string,
  data: {
    subject: string;
    body: string;
    recipients: string;
    same_group_only: boolean;
    message_type: string;
    recipient_ids?: string[] | null;
    sender_name?: string;
    sender_role?: string;
  }
): Promise<Message> {
  const newMsg: Message = {
    id: 'msg-' + Date.now(),
    subject: data.subject,
    body: data.body,
    sender_id: 'mock-user-001',
    sender_name: data.sender_name ?? 'Amina Hassan',
    sender_role: data.sender_role ?? 'super_admin',
    recipients: data.recipients as Message['recipients'],
    same_group_only: data.same_group_only,
    recipient_ids: data.recipient_ids ?? null,
    message_type: data.message_type as Message['message_type'],
    created_at: new Date().toISOString(),
    read: false,
    read_at: null
  };
  messagesStore = [newMsg, ...messagesStore];
  return newMsg;
}

export async function markAsRead(_token: string, messageId: string): Promise<void> {
  const msg = messagesStore.find((m) => m.id === messageId);
  if (msg) {
    msg.read = true;
    msg.read_at = new Date().toISOString();
  }
}

export async function getUnreadCount(_token: string): Promise<number> {
  return messagesStore.filter((m) => !m.read).length;
}

export async function getComplaints(_token: string): Promise<Complaint[]> {
  return structuredClone(complaintsStore);
}

export async function submitComplaint(
  _token: string,
  data: { subject: string; body: string; sender_name?: string; sender_code?: string }
): Promise<Complaint> {
  const newComplaint: Complaint = {
    id: 'cmp-' + Date.now(),
    subject: data.subject,
    body: data.body,
    sender_id: 'mock-user-001',
    sender_name: data.sender_name ?? 'Amina Hassan',
    sender_code: data.sender_code ?? 'STAFF',
    status: 'open',
    response: null,
    responded_by: null,
    responded_at: null,
    created_at: new Date().toISOString()
  };
  complaintsStore = [newComplaint, ...complaintsStore];
  return newComplaint;
}

export async function respondToComplaint(
  _token: string,
  complaintId: string,
  response: string,
  responderName?: string
): Promise<Complaint> {
  const complaint = complaintsStore.find((c) => c.id === complaintId);
  if (!complaint) throw new Error('Complaint not found');
  complaint.response = response;
  complaint.status = 'resolved';
  complaint.responded_by = responderName ?? 'Amina Hassan';
  complaint.responded_at = new Date().toISOString();
  return structuredClone(complaint);
}
