import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { StaffMember, Agent } from '$lib/types';
import { mockStaff } from '$lib/mock/staff';
import { mockLeads, mockAgents } from '$lib/mock/agents';

// Module-level mutable stores for mock persistence during the dev session
let staffStore: StaffMember[] = structuredClone(mockStaff);
let leadsStore: Agent[] = structuredClone(mockLeads);
let agentsStore: Agent[] = structuredClone(mockAgents);

let nextStaffId = 10;
let nextLeadId = 10;
let nextAgentId = 10;
let nextLeadNum = 4;
let nextAgentNum = 9;

export const load: PageServerLoad = async () => {
  return {
    staff: structuredClone(staffStore),
    leads: structuredClone(leadsStore),
    agents: structuredClone(agentsStore)
  };
};

export const actions: Actions = {
  // ── Staff actions ──────────────────────────────────────────
  createStaff: async ({ request }) => {
    const form = await request.formData();
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const email = (form.get('email') as string)?.trim();
    const role = form.get('role') as string;
    const password = form.get('password') as string;

    if (!first_name || !last_name || !email || !role || !password) {
      return fail(400, { error: 'All fields are required.', action: 'createStaff' });
    }

    if (staffStore.find((s) => s.email === email)) {
      return fail(400, { error: 'A staff member with this email already exists.', action: 'createStaff' });
    }

    const newStaff: StaffMember = {
      id: `s${nextStaffId++}`,
      first_name,
      last_name,
      email,
      role,
      is_active: true
    };
    staffStore = [...staffStore, newStaff];
    return { success: true, action: 'createStaff' };
  },

  editStaff: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const email = (form.get('email') as string)?.trim();
    const role = form.get('role') as string;

    if (!id || !first_name || !last_name || !email || !role) {
      return fail(400, { error: 'All fields are required.', action: 'editStaff' });
    }

    staffStore = staffStore.map((s) => (s.id === id ? { ...s, first_name, last_name, email, role } : s));
    return { success: true, action: 'editStaff' };
  },

  deactivateStaff: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    staffStore = staffStore.map((s) => (s.id === id ? { ...s, is_active: false } : s));
    return { success: true, action: 'deactivateStaff' };
  },

  reactivateStaff: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    staffStore = staffStore.map((s) => (s.id === id ? { ...s, is_active: true } : s));
    return { success: true, action: 'reactivateStaff' };
  },

  resetPassword: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const password = form.get('password') as string;
    const confirm = form.get('confirm_password') as string;

    if (!password || password !== confirm) {
      return fail(400, { error: 'Passwords do not match.', action: 'resetPassword' });
    }
    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters.', action: 'resetPassword' });
    }
    void id; // password reset handled by API in real mode
    return { success: true, action: 'resetPassword' };
  },

  // ── Lead (super_agent) actions ─────────────────────────────
  createLead: async ({ request }) => {
    const form = await request.formData();
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const phone_number = (form.get('phone_number') as string)?.trim();
    const email = (form.get('email') as string | null)?.trim() || null;
    const address = (form.get('address') as string)?.trim();
    const state = (form.get('state') as string)?.trim();
    const lga = (form.get('lga') as string)?.trim();

    if (!first_name || !last_name || !phone_number || !address || !state || !lga) {
      return fail(400, { error: 'All required fields must be filled.', action: 'createLead' });
    }

    const num = String(nextLeadNum++).padStart(4, '0');
    const newLead: Agent = {
      id: `l${nextLeadId++}`,
      agent_code: `SPA-${num}`,
      agent_type: 'super_agent',
      first_name,
      last_name,
      email,
      phone_number,
      address,
      state,
      lga,
      is_active: true,
      super_agent_id: null,
      super_agent_name: null,
      super_agent_code: null
    };
    leadsStore = [...leadsStore, newLead];
    return { success: true, action: 'createLead' };
  },

  editLead: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const phone_number = (form.get('phone_number') as string)?.trim();
    const email = (form.get('email') as string | null)?.trim() || null;
    const address = (form.get('address') as string)?.trim();
    const state = (form.get('state') as string)?.trim();
    const lga = (form.get('lga') as string)?.trim();

    leadsStore = leadsStore.map((l) =>
      l.id === id ? { ...l, first_name, last_name, phone_number, email, address, state, lga } : l
    );
    return { success: true, action: 'editLead' };
  },

  deactivateLead: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    leadsStore = leadsStore.map((l) => (l.id === id ? { ...l, is_active: false } : l));
    return { success: true, action: 'deactivateLead' };
  },

  reactivateLead: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    leadsStore = leadsStore.map((l) => (l.id === id ? { ...l, is_active: true } : l));
    return { success: true, action: 'reactivateLead' };
  },

  // ── Agent (sub_agent) actions ──────────────────────────────
  createAgent: async ({ request }) => {
    const form = await request.formData();
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const phone_number = (form.get('phone_number') as string)?.trim();
    const email = (form.get('email') as string | null)?.trim() || null;
    const address = (form.get('address') as string)?.trim();
    const state = (form.get('state') as string)?.trim();
    const lga = (form.get('lga') as string)?.trim();
    const super_agent_id = form.get('super_agent_id') as string;

    if (!first_name || !last_name || !phone_number || !address || !state || !lga || !super_agent_id) {
      return fail(400, { error: 'All required fields must be filled, including Lead.', action: 'createAgent' });
    }

    const lead = leadsStore.find((l) => l.id === super_agent_id);
    if (!lead) {
      return fail(400, { error: 'Selected lead not found.', action: 'createAgent' });
    }

    const num = String(nextAgentNum++).padStart(4, '0');
    const newAgent: Agent = {
      id: `a${nextAgentId++}`,
      agent_code: `APA-${num}`,
      agent_type: 'sub_agent',
      first_name,
      last_name,
      email,
      phone_number,
      address,
      state,
      lga,
      is_active: true,
      super_agent_id,
      super_agent_name: `${lead.first_name} ${lead.last_name}`,
      super_agent_code: lead.agent_code
    };
    agentsStore = [...agentsStore, newAgent];
    return { success: true, action: 'createAgent' };
  },

  editAgent: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const phone_number = (form.get('phone_number') as string)?.trim();
    const email = (form.get('email') as string | null)?.trim() || null;
    const address = (form.get('address') as string)?.trim();
    const state = (form.get('state') as string)?.trim();
    const lga = (form.get('lga') as string)?.trim();
    const super_agent_id = form.get('super_agent_id') as string;

    const lead = leadsStore.find((l) => l.id === super_agent_id);
    agentsStore = agentsStore.map((a) =>
      a.id === id
        ? {
            ...a,
            first_name,
            last_name,
            phone_number,
            email,
            address,
            state,
            lga,
            super_agent_id,
            super_agent_name: lead ? `${lead.first_name} ${lead.last_name}` : a.super_agent_name,
            super_agent_code: lead ? lead.agent_code : a.super_agent_code
          }
        : a
    );
    return { success: true, action: 'editAgent' };
  },

  deactivateAgent: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    agentsStore = agentsStore.map((a) => (a.id === id ? { ...a, is_active: false } : a));
    return { success: true, action: 'deactivateAgent' };
  },

  reactivateAgent: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    agentsStore = agentsStore.map((a) => (a.id === id ? { ...a, is_active: true } : a));
    return { success: true, action: 'reactivateAgent' };
  }
};
