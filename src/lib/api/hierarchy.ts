import type { HierarchyNode, TeamView } from '$lib/types';
import {
  mockHierarchy,
  mockTeamViewBD,
  mockTeamViewRM,
  mockTeamViewManager
} from '$lib/mock/agents';

// All hierarchy functions return mock data unconditionally.
// Suleiman does not have hierarchy endpoints yet.
// When endpoints are ready: add MOCK_API guard + apiRequest calls here.

export async function getHierarchy(_token?: string): Promise<HierarchyNode[]> {
  return structuredClone(mockHierarchy);
}

export async function getMyTeam(_token?: string, role?: string): Promise<TeamView> {
  if (role === 'rm') return structuredClone(mockTeamViewRM);
  if (role === 'manager') return structuredClone(mockTeamViewManager);
  return structuredClone(mockTeamViewBD);
}

export async function getTeamCommission(_token?: string): Promise<null> {
  // Placeholder -- no commission endpoint for hierarchy yet
  return null;
}
