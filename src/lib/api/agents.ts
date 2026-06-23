import type { Agent } from '$lib/types';
import { MOCK_API, apiRequest } from './client';
import { mockLeads, mockAgents } from '$lib/mock/agents';

// Assumed real endpoints -- confirm with Suleiman before go-live:
//   GET  /api/v1/agents?agent_type=lead
//   GET  /api/v1/agents?agent_type=field
//   GET  /api/v1/agents
//   POST /api/v1/agents
//   PATCH /api/v1/agents/{id}
//   POST /api/v1/agents/{id}/toggle        (replaces separate deactivate/reactivate)

export async function getLeads(token?: string): Promise<Agent[]> {
  if (MOCK_API) return structuredClone(mockLeads);
  return apiRequest<Agent[]>('/api/v1/agents?agent_type=lead', {}, token);
}

export async function getAgents(token?: string): Promise<Agent[]> {
  if (MOCK_API) return structuredClone(mockAgents);
  return apiRequest<Agent[]>('/api/v1/agents?agent_type=field', {}, token);
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
