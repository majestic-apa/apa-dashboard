import type { StaffSummary, AgentSummary, AgentNetworkNode, DashboardStats } from '$lib/types';
import { mockLeads, mockAgents } from './agents';

export const mockDashboardStats: DashboardStats = {
  active_staff: 4,
  active_agents: 10,
  total_onboardings: 247,
  enrolment_trend: [
    { month: 'Jan', count: 28 },
    { month: 'Feb', count: 35 },
    { month: 'Mar', count: 41 },
    { month: 'Apr', count: 38 },
    { month: 'May', count: 52 },
    { month: 'Jun', count: 53 }
  ]
};

export const mockStaffSummary: StaffSummary[] = [
  { role: 'super_admin', total: 1, active: 1, inactive: 0 },
  { role: 'operations', total: 1, active: 1, inactive: 0 },
  { role: 'compliance', total: 1, active: 1, inactive: 0 },
  { role: 'internal_audit', total: 1, active: 0, inactive: 1 },
  { role: 'management', total: 1, active: 1, inactive: 0 }
];

export const mockAgentSummary: AgentSummary = {
  total_leads: 3,
  active_leads: 3,
  total_agents: 8,
  active_agents: 7,
  by_state: [
    { state: 'Lagos', leads: 1, agents: 3 },
    { state: 'Kano', leads: 1, agents: 3 },
    { state: 'Oyo', leads: 1, agents: 2 }
  ]
};

export const mockAgentNetwork: AgentNetworkNode[] = mockLeads.map((lead) => ({
  lead,
  agents: mockAgents.filter((a) => a.super_agent_id === lead.id)
}));
