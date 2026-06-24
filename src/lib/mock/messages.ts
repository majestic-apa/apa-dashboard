import type { Message, Complaint } from '$lib/types';

export const mockMessages: Message[] = [
  {
    id: 'msg-001',
    subject: 'Welcome to the new dashboard',
    body: 'Dear team, we are pleased to announce the launch of our new internal dashboard. Please familiarise yourself with the new features and reach out if you have any questions.',
    sender_id: 'mock-user-001',
    sender_name: 'Amina Hassan',
    sender_role: 'super_admin',
    recipients: 'all',
    same_group_only: false,
    recipient_ids: null,
    message_type: 'announcement',
    created_at: '2026-06-20T09:00:00Z',
    read: false,
    read_at: null
  },
  {
    id: 'msg-002',
    subject: 'June onboarding targets',
    body: 'All regional managers please note that the June onboarding target is 50 contributors per agent per two-week period. Agents who meet this target will receive bi-weekly commission payments.',
    sender_id: 'mock-user-001',
    sender_name: 'Amina Hassan',
    sender_role: 'super_admin',
    recipients: 'rm',
    same_group_only: false,
    recipient_ids: null,
    message_type: 'general',
    created_at: '2026-06-21T10:30:00Z',
    read: true,
    read_at: '2026-06-21T11:00:00Z'
  },
  {
    id: 'msg-003',
    subject: 'Agent onboarding performance review',
    body: 'Please ensure all your agents are submitting their onboarding reports before end of day Friday. Any outstanding submissions should be flagged to your regional manager.',
    sender_id: 'mock-rm-001',
    sender_name: 'Chukwuemeka Obi',
    sender_role: 'rm',
    recipients: 'manager',
    same_group_only: true,
    recipient_ids: null,
    message_type: 'general',
    created_at: '2026-06-22T08:15:00Z',
    read: false,
    read_at: null
  },
  {
    id: 'msg-004',
    subject: 'System maintenance notice',
    body: 'Please be informed that the system will undergo scheduled maintenance this Saturday from 12am to 4am. During this period the dashboard and mobile app will be unavailable.',
    sender_id: 'mock-user-001',
    sender_name: 'Amina Hassan',
    sender_role: 'super_admin',
    recipients: 'all',
    same_group_only: false,
    recipient_ids: null,
    message_type: 'announcement',
    created_at: '2026-06-23T14:00:00Z',
    read: false,
    read_at: null
  }
];

export const mockComplaints: Complaint[] = [
  {
    id: 'cmp-001',
    subject: 'Commission payment delayed',
    body: 'My commission for the first two weeks of June has not been paid. I met the 50 onboarding target and expected payment on June 14. Please advise.',
    sender_id: 'mock-agent-001',
    sender_name: 'Musa Ibrahim',
    sender_code: 'APA-0001',
    status: 'resolved',
    response:
      'We have investigated and confirmed your payment was processed on June 16. Please check your bank account. We apologise for the delay.',
    responded_by: 'Amina Hassan',
    responded_at: '2026-06-17T09:00:00Z',
    created_at: '2026-06-15T10:00:00Z'
  },
  {
    id: 'cmp-002',
    subject: 'Unable to submit onboarding on mobile app',
    body: 'I have been trying to submit a new onboarding on the mobile app since yesterday but it keeps showing an error. I have 3 pending contributors waiting.',
    sender_id: 'mock-agent-002',
    sender_name: 'Amina Bello',
    sender_code: 'APA-0002',
    status: 'in_progress',
    response:
      'We are aware of this issue and our technical team is working on a fix. We expect it to be resolved within 24 hours.',
    responded_by: 'Amina Hassan',
    responded_at: '2026-06-22T15:00:00Z',
    created_at: '2026-06-22T12:00:00Z'
  },
  {
    id: 'cmp-003',
    subject: 'Wrong account number on file',
    body: 'My bank account number on file is incorrect. My commission was sent to a wrong account. I need this corrected urgently.',
    sender_id: 'mock-agent-003',
    sender_name: 'Ngozi Eze',
    sender_code: 'APA-0003',
    status: 'open',
    response: null,
    responded_by: null,
    responded_at: null,
    created_at: '2026-06-24T08:00:00Z'
  }
];

export const mockUnreadCount = mockMessages.filter((m) => !m.read).length;
