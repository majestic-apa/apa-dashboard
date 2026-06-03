import type { AgentActivity, AgentNetworkNode, AgentSummary, DashboardStats, StaffSummary } from '$lib/types';
import { MOCK_API, apiRequest } from './client';
import { mockAgentActivity } from '$lib/mock/agents';
import {
  mockAgentNetwork,
  mockAgentSummary,
  mockDashboardStats,
  mockStaffSummary
} from '$lib/mock/reports';

export async function getDashboardStats(token?: string): Promise<DashboardStats> {
  if (MOCK_API) return structuredClone(mockDashboardStats);
  return apiRequest<DashboardStats>('/reports/dashboard', {}, token);
}

export async function getStaffSummary(token?: string): Promise<StaffSummary[]> {
  if (MOCK_API) return structuredClone(mockStaffSummary);
  return apiRequest<StaffSummary[]>('/reports/staff-summary', {}, token);
}

export async function getAgentSummary(token?: string): Promise<AgentSummary> {
  if (MOCK_API) return structuredClone(mockAgentSummary);
  return apiRequest<AgentSummary>('/reports/agent-summary', {}, token);
}

export async function getActivityLog(token?: string): Promise<AgentActivity[]> {
  if (MOCK_API) return structuredClone(mockAgentActivity);
  return apiRequest<AgentActivity[]>('/reports/activity', {}, token);
}

export async function getAgentNetwork(token?: string): Promise<AgentNetworkNode[]> {
  if (MOCK_API) return structuredClone(mockAgentNetwork);
  return apiRequest<AgentNetworkNode[]>('/reports/agent-network', {}, token);
}
