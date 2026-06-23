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

// All reports functions return mock data unconditionally.
// Suleiman has not yet built the reports API endpoints.
// When endpoints are ready: re-add MOCK_API guard + apiRequest calls,
// update endpoint strings, and remove this comment.

export async function getDashboardStats(_token?: string): Promise<DashboardStats> {
  return structuredClone(mockDashboardStats);
}

export async function getStaffSummary(_token?: string): Promise<StaffSummary[]> {
  return structuredClone(mockStaffSummary);
}

export async function getAgentSummary(_token?: string): Promise<AgentSummary> {
  return structuredClone(mockAgentSummary);
}

export async function getAgentNetwork(_token?: string): Promise<AgentNetworkNode[]> {
  return structuredClone(mockAgentNetwork);
}

export async function getOnboardingLog(_token?: string): Promise<OnboardingLog[]> {
  return structuredClone(mockOnboardingLog);
}

export async function getContributionLog(_token?: string): Promise<ContributionLog[]> {
  return structuredClone(mockContributionLog);
}

export async function getWithdrawalLog(_token?: string): Promise<WithdrawalLog[]> {
  return structuredClone(mockWithdrawalLog);
}

export async function getCommissionSummary(_token?: string): Promise<CommissionSummary> {
  return structuredClone(mockCommissionSummary);
}

// Legacy -- kept for reference, no longer displayed in the Reports page
export async function getActivityLog(_token?: string): Promise<AgentActivity[]> {
  return structuredClone(mockAgentActivity);
}
