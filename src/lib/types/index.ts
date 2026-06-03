export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'super_admin' | 'operations' | 'compliance' | 'internal_audit' | 'management';
  permissions: string[];
  is_active: boolean;
}

export interface Agent {
  id: string;
  agent_code: string;
  agent_type: 'super_agent' | 'sub_agent';
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string;
  address: string;
  state: string;
  lga: string;
  is_active: boolean;
  super_agent_id: string | null;
  super_agent_name: string | null;
  super_agent_code: string | null;
}

export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface AgentActivity {
  id: string;
  agent_name: string;
  agent_code: string;
  customer_name: string;
  customer_phone: string;
  customer_state: string;
  customer_lga: string;
  rsa_pin: string;
  pfa_pin: string;
  super_agent_name: string | null;
  super_agent_code: string | null;
  sub_agent_name: string | null;
  sub_agent_code: string | null;
  performed_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DashboardStats {
  active_staff: number;
  active_agents: number;
  total_onboardings: number;
  enrolment_trend: { month: string; count: number }[];
}

export interface StaffSummary {
  role: string;
  total: number;
  active: number;
  inactive: number;
}

export interface AgentSummary {
  total_leads: number;
  active_leads: number;
  total_agents: number;
  active_agents: number;
  by_state: { state: string; leads: number; agents: number }[];
}

export interface AgentNetworkNode {
  lead: Agent;
  agents: Agent[];
}
