import type {
  AgentActivity,
  AgentNetworkNode,
  AgentSummary,
  CommissionSummary,
  ContributionLog,
  DashboardStats,
  OnboardingLog,
  StaffSummary,
  WithdrawalLog
} from '$lib/types';
import { MOCK_API, apiRequest } from './client';
import { mockAgentActivity } from '$lib/mock/agents';
import {
  mockAgentNetwork,
  mockAgentSummary,
  mockContributionLog,
  mockDashboardStats,
  mockOnboardingLog,
  mockStaffSummary,
  mockWithdrawalLog
} from '$lib/mock/reports';
import { mockCommissionSummary } from '$lib/mock/commission';

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

export async function getAgentNetwork(token?: string): Promise<AgentNetworkNode[]> {
  if (MOCK_API) return structuredClone(mockAgentNetwork);
  return apiRequest<AgentNetworkNode[]>('/reports/agent-network', {}, token);
}

export async function getOnboardingLog(token?: string): Promise<OnboardingLog[]> {
  if (MOCK_API) return structuredClone(mockOnboardingLog);
  return apiRequest<OnboardingLog[]>('/reports/onboarding-log', {}, token);
}

export async function getContributionLog(token?: string): Promise<ContributionLog[]> {
  if (MOCK_API) return structuredClone(mockContributionLog);
  return apiRequest<ContributionLog[]>('/reports/contribution-log', {}, token);
}

export async function getWithdrawalLog(token?: string): Promise<WithdrawalLog[]> {
  if (MOCK_API) return structuredClone(mockWithdrawalLog);
  return apiRequest<WithdrawalLog[]>('/reports/withdrawal-log', {}, token);
}

export async function getCommissionSummary(token?: string): Promise<CommissionSummary> {
  if (MOCK_API) return structuredClone(mockCommissionSummary);
  // Real endpoint — Suleiman to build: GET /api/v1/reports/commission
  return apiRequest<CommissionSummary>('/api/v1/reports/commission', {}, token);
}

// Legacy — kept for reference, no longer displayed in the Reports page
export async function getActivityLog(token?: string): Promise<AgentActivity[]> {
  if (MOCK_API) return structuredClone(mockAgentActivity);
  return apiRequest<AgentActivity[]>('/reports/activity', {}, token);
}
