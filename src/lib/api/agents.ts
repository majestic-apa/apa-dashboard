import type { Agent } from '$lib/types';
import { MOCK_API, apiRequest } from './client';
import { mockLeads, mockAgents } from '$lib/mock/agents';

export async function getLeads(token?: string): Promise<Agent[]> {
  if (MOCK_API) return structuredClone(mockLeads);
  return apiRequest<Agent[]>('/agents?type=super_agent', {}, token);
}

export async function getAgents(token?: string): Promise<Agent[]> {
  if (MOCK_API) return structuredClone(mockAgents);
  return apiRequest<Agent[]>('/agents?type=sub_agent', {}, token);
}

export async function getAllAgents(token?: string): Promise<Agent[]> {
  if (MOCK_API) return structuredClone([...mockLeads, ...mockAgents]);
  return apiRequest<Agent[]>('/agents', {}, token);
}

export async function createAgent(
  data: Omit<Agent, 'id'>,
  token?: string
): Promise<Agent> {
  if (MOCK_API) return { ...data, id: crypto.randomUUID() };
  return apiRequest<Agent>('/agents', { method: 'POST', body: JSON.stringify(data) }, token);
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
    `/agents/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    token
  );
}
