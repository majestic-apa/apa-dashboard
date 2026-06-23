import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { StaffMember, Agent } from '$lib/types';
import { MOCK_API } from '$lib/api/client';
import { getStaff, createStaff, updateStaff, toggleStaff, resetPassword } from '$lib/api/staff';
import { getLeads, getAgents, createAgent, updateAgent, toggleAgent } from '$lib/api/agents';
import { mockStaff } from '$lib/mock/staff';
import { mockLeads, mockAgents } from '$lib/mock/agents';

// ── Mock in-memory stores (MOCK_API=true only) ─────────────────────────────────
let staffStore: StaffMember[] = structuredClone(mockStaff);
let leadsStore: Agent[] = structuredClone(mockLeads);
let agentsStore: Agent[] = structuredClone(mockAgents);

let nextStaffId = 10;
let nextLeadId = 10;
let nextAgentId = 10;
let nextLeadNum = 4;
let nextAgentNum = 9;

function apiErr(e: unknown): string {
  return e instanceof Error ? e.message : 'Request failed. Please try again.';
}

// ── Load ───────────────────────────────────────────────────────────────────────

export const load: PageServerLoad = async ({ cookies }) => {
  if (!MOCK_API) {
    const token = cookies.get('auth_token') ?? undefined;
    try {
      const [staff, leads, agents] = await Promise.all([
        getStaff(token),
        getLeads(token),
        getAgents(token)
      ]);
      return { staff, leads, agents };
    } catch (e) {
      return { staff: [], leads: [], agents: [], loadError: apiErr(e) };
    }
  }
  return {
    staff: structuredClone(staffStore),
    leads: structuredClone(leadsStore),
    agents: structuredClone(agentsStore)
  };
};

// ── Actions ────────────────────────────────────────────────────────────────────

export const actions: Actions = {
  // ── Staff actions ──────────────────────────────────────────
  createStaff: async ({ request, cookies }) => {
    const form = await request.formData();
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const email = (form.get('email') as string)?.trim();
    const role = form.get('role') as string;
    const password = form.get('password') as string;

    if (!first_name || !last_name || !email || !role || !password) {
      return fail(400, { error: 'All fields are required.', action: 'createStaff' });
    }

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await createStaff({ first_name, last_name, email, role, is_active: true }, password, token);
        return { success: true, action: 'createStaff' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'createStaff' });
      }
    }

    if (staffStore.find((s) => s.email === email)) {
      return fail(400, { error: 'A staff member with this email already exists.', action: 'createStaff' });
    }
    const newStaff: StaffMember = { id: `s${nextStaffId++}`, first_name, last_name, email, role, is_active: true };
    staffStore = [...staffStore, newStaff];
    return { success: true, action: 'createStaff' };
  },

  editStaff: async ({ request, cookies }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const email = (form.get('email') as string)?.trim();
    const role = form.get('role') as string;

    if (!id || !first_name || !last_name || !email || !role) {
      return fail(400, { error: 'All fields are required.', action: 'editStaff' });
    }

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await updateStaff(id, { first_name, last_name, email, role }, token);
        return { success: true, action: 'editStaff' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'editStaff' });
      }
    }

    staffStore = staffStore.map((s) => (s.id === id ? { ...s, first_name, last_name, email, role } : s));
    return { success: true, action: 'editStaff' };
  },

  deactivateStaff: async ({ request, cookies }) => {
    const form = await request.formData();
    const id = form.get('id') as string;

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await toggleStaff(id, token);
        return { success: true, action: 'deactivateStaff' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'deactivateStaff' });
      }
    }

    staffStore = staffStore.map((s) => (s.id === id ? { ...s, is_active: false } : s));
    return { success: true, action: 'deactivateStaff' };
  },

  reactivateStaff: async ({ request, cookies }) => {
    const form = await request.formData();
    const id = form.get('id') as string;

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await toggleStaff(id, token);
        return { success: true, action: 'reactivateStaff' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'reactivateStaff' });
      }
    }

    staffStore = staffStore.map((s) => (s.id === id ? { ...s, is_active: true } : s));
    return { success: true, action: 'reactivateStaff' };
  },

  resetPassword: async ({ request, cookies }) => {
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

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await resetPassword(id, password, token);
        return { success: true, action: 'resetPassword' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'resetPassword' });
      }
    }

    void id;
    return { success: true, action: 'resetPassword' };
  },

  // ── Lead actions ──────────────────────────────────────────
  createLead: async ({ request, cookies }) => {
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

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await createAgent(
          {
            agent_code: '',
            agent_type: 'lead',
            first_name, last_name, email, phone_number, address, state, lga,
            is_active: true,
            lead_agent_id: null, lead_agent_name: null, lead_agent_code: null
          },
          token
        );
        return { success: true, action: 'createLead' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'createLead' });
      }
    }

    const num = String(nextLeadNum++).padStart(4, '0');
    const newLead: Agent = {
      id: `l${nextLeadId++}`,
      agent_code: `SPA-${num}`,
      agent_type: 'lead',
      first_name, last_name, email, phone_number, address, state, lga,
      is_active: true,
      lead_agent_id: null, lead_agent_name: null, lead_agent_code: null
    };
    leadsStore = [...leadsStore, newLead];
    return { success: true, action: 'createLead' };
  },

  editLead: async ({ request, cookies }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const phone_number = (form.get('phone_number') as string)?.trim();
    const email = (form.get('email') as string | null)?.trim() || null;
    const address = (form.get('address') as string)?.trim();
    const state = (form.get('state') as string)?.trim();
    const lga = (form.get('lga') as string)?.trim();

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await updateAgent(id, { first_name, last_name, phone_number, email, address, state, lga }, token);
        return { success: true, action: 'editLead' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'editLead' });
      }
    }

    leadsStore = leadsStore.map((l) =>
      l.id === id ? { ...l, first_name, last_name, phone_number, email, address, state, lga } : l
    );
    return { success: true, action: 'editLead' };
  },

  deactivateLead: async ({ request, cookies }) => {
    const form = await request.formData();
    const id = form.get('id') as string;

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await toggleAgent(id, token);
        return { success: true, action: 'deactivateLead' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'deactivateLead' });
      }
    }

    leadsStore = leadsStore.map((l) => (l.id === id ? { ...l, is_active: false } : l));
    return { success: true, action: 'deactivateLead' };
  },

  reactivateLead: async ({ request, cookies }) => {
    const form = await request.formData();
    const id = form.get('id') as string;

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await toggleAgent(id, token);
        return { success: true, action: 'reactivateLead' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'reactivateLead' });
      }
    }

    leadsStore = leadsStore.map((l) => (l.id === id ? { ...l, is_active: true } : l));
    return { success: true, action: 'reactivateLead' };
  },

  // ── Agent (field) actions ─────────────────────────────────
  createAgent: async ({ request, cookies }) => {
    const form = await request.formData();
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const phone_number = (form.get('phone_number') as string)?.trim();
    const email = (form.get('email') as string | null)?.trim() || null;
    const address = (form.get('address') as string)?.trim();
    const state = (form.get('state') as string)?.trim();
    const lga = (form.get('lga') as string)?.trim();
    const lead_agent_id = form.get('lead_agent_id') as string;

    if (!first_name || !last_name || !phone_number || !address || !state || !lga || !lead_agent_id) {
      return fail(400, { error: 'All required fields must be filled, including Lead.', action: 'createAgent' });
    }

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await createAgent(
          {
            agent_code: '',
            agent_type: 'field',
            first_name, last_name, email, phone_number, address, state, lga,
            is_active: true,
            lead_agent_id, lead_agent_name: null, lead_agent_code: null
          },
          token
        );
        return { success: true, action: 'createAgent' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'createAgent' });
      }
    }

    const lead = leadsStore.find((l) => l.id === lead_agent_id);
    if (!lead) {
      return fail(400, { error: 'Selected lead not found.', action: 'createAgent' });
    }
    const num = String(nextAgentNum++).padStart(4, '0');
    const newAgent: Agent = {
      id: `a${nextAgentId++}`,
      agent_code: `APA-${num}`,
      agent_type: 'field',
      first_name, last_name, email, phone_number, address, state, lga,
      is_active: true,
      lead_agent_id,
      lead_agent_name: `${lead.first_name} ${lead.last_name}`,
      lead_agent_code: lead.agent_code
    };
    agentsStore = [...agentsStore, newAgent];
    return { success: true, action: 'createAgent' };
  },

  editAgent: async ({ request, cookies }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const first_name = (form.get('first_name') as string)?.trim();
    const last_name = (form.get('last_name') as string)?.trim();
    const phone_number = (form.get('phone_number') as string)?.trim();
    const email = (form.get('email') as string | null)?.trim() || null;
    const address = (form.get('address') as string)?.trim();
    const state = (form.get('state') as string)?.trim();
    const lga = (form.get('lga') as string)?.trim();
    const lead_agent_id = form.get('lead_agent_id') as string;

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await updateAgent(id, { first_name, last_name, phone_number, email, address, state, lga, lead_agent_id }, token);
        return { success: true, action: 'editAgent' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'editAgent' });
      }
    }

    const lead = leadsStore.find((l) => l.id === lead_agent_id);
    agentsStore = agentsStore.map((a) =>
      a.id === id
        ? {
            ...a,
            first_name, last_name, phone_number, email, address, state, lga,
            lead_agent_id,
            lead_agent_name: lead ? `${lead.first_name} ${lead.last_name}` : a.lead_agent_name,
            lead_agent_code: lead ? lead.agent_code : a.lead_agent_code
          }
        : a
    );
    return { success: true, action: 'editAgent' };
  },

  deactivateAgent: async ({ request, cookies }) => {
    const form = await request.formData();
    const id = form.get('id') as string;

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await toggleAgent(id, token);
        return { success: true, action: 'deactivateAgent' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'deactivateAgent' });
      }
    }

    agentsStore = agentsStore.map((a) => (a.id === id ? { ...a, is_active: false } : a));
    return { success: true, action: 'deactivateAgent' };
  },

  reactivateAgent: async ({ request, cookies }) => {
    const form = await request.formData();
    const id = form.get('id') as string;

    if (!MOCK_API) {
      const token = cookies.get('auth_token') ?? undefined;
      try {
        await toggleAgent(id, token);
        return { success: true, action: 'reactivateAgent' };
      } catch (e) {
        return fail(422, { error: apiErr(e), action: 'reactivateAgent' });
      }
    }

    agentsStore = agentsStore.map((a) => (a.id === id ? { ...a, is_active: true } : a));
    return { success: true, action: 'reactivateAgent' };
  }
};
