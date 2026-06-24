import type { Agent, AgentType } from '$lib/types';
import { MOCK_API, apiRequest } from './client';
import { mockLeads, mockAgents } from '$lib/mock/agents';

function mapApiAgent(raw: Record<string, unknown>): Agent {
  const leadId = String(raw.lead_agent_id ?? raw.lead_id ?? '');
  return {
    id: String(raw.id ?? ''),
    agent_code: String(raw.agent_code ?? ''),
    agent_type: ((raw.agent_type ?? 'field') as AgentType),
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    email: (raw.email as string | null) ?? null,
    phone_number: String(raw.phone_number ?? ''),
    address: String(raw.address ?? ''),
    state: String(raw.state ?? ''),
    lga: String(raw.lga ?? ''),
    is_active: Boolean(raw.is_active ?? true),
    lead_agent_id: leadId || null,
    lead_agent_name: ((raw.lead_agent_name ?? raw.lead_name) as string | null) ?? null,
    lead_agent_code: ((raw.lead_agent_code ?? raw.lead_code) as string | null) ?? null
  };
}

// Assumed real endpoints -- confirm with Suleiman before go-live:
//   GET  /api/v1/agents?agent_type=lead
//   GET  /api/v1/agents?agent_type=field
//   GET  /api/v1/agents
//   POST /api/v1/agents
//   PATCH /api/v1/agents/{id}
//   POST /api/v1/agents/{id}/toggle        (replaces separate deactivate/reactivate)

export async function getLeads(token?: string): Promise<Agent[]> {
  if (MOCK_API) return structuredClone(mockLeads);
  const raw = await apiRequest<Record<string, unknown>[]>('/api/v1/agents?agent_type=lead', {}, token);
  return raw.map(mapApiAgent);
}

export async function getAgents(token?: string): Promise<Agent[]> {
  if (MOCK_API) return structuredClone(mockAgents);
  const raw = await apiRequest<Record<string, unknown>[]>('/api/v1/agents?agent_type=field', {}, token);
  return raw.map(mapApiAgent);
}

export async function getAllAgents(token?: string): Promise<Agent[]> {
  if (MOCK_API) return structuredClone([...mockLeads, ...mockAgents]);
  return apiRequest<Agent[]>('/api/v1/agents', {}, token);
}

export async function createAgent(data: Omit<Agent, 'id'>, token?: string): Promise<Agent> {
  if (MOCK_API) return { ...data, id: crypto.randomUUID() };
  return apiRequest<Agent>(
    '/api/v1/agents',
    { method: 'POST', body: JSON.stringify(data) },
    token
  );
}

export async function updateAgent(
  id: string,
  data: Partial<Agent>,
  token?: string
): Promise<Agent> {
  if (MOCK_API) {
    const existing = [...mockLeads, ...mockAgents].find((a) => a.id === id);
    return { ...existing!, ...data };
  }
  return apiRequest<Agent>(
    `/api/v1/agents/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    token
  );
}

export async function toggleAgent(id: string, token?: string): Promise<Agent> {
  if (MOCK_API) {
    const existing = [...mockLeads, ...mockAgents].find((a) => a.id === id);
    return { ...existing!, is_active: !existing!.is_active };
  }
  return apiRequest<Agent>(`/api/v1/agents/${id}/toggle`, { method: 'POST' }, token);
}
