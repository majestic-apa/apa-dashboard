export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'super_admin' | 'operations' | 'compliance' | 'internal_audit' | 'management';
  permissions: string[];
  is_active: boolean;
}

export type AgentType = 'rm' | 'manager' | 'lead' | 'field';

export interface Agent {
  id: string;
  agent_code: string;
  agent_type: AgentType;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string;
  address: string;
  state: string;
  lga: string;
  is_active: boolean;
  lead_agent_id: string | null;
  lead_agent_name: string | null;
  lead_agent_code: string | null;
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
  lead_name: string | null;
  lead_code: string | null;
  field_agent_name: string | null;
  field_agent_code: string | null;
  performed_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  device_id: string;
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

// ── Commission ───────────────────────────────────────────────────────────────

export interface CommissionRates {
  agent_per_onboarding: number;
  lead_override_per_onboarding: number;
  agent_per_contribution: number;
  lead_override_per_contribution: number;
}

export interface AgentCommissionSummary {
  agent_code: string;
  agent_name: string;
  agent_type: 'lead' | 'field';
  lead_code: string | null;
  lead_name: string | null;
  completed_onboardings: number;
  completed_contributions: number;
  direct_commission: number;
  override_commission: number;
  total_commission: number;
}

export interface LeadCommissionSummary {
  lead_code: string;
  lead_name: string;
  total_onboardings: number;
  total_contributions: number;
  lead_override_commission: number;
  agents: AgentCommissionSummary[];
  team_total_commission: number;
}

export interface CommissionSummary {
  rates: CommissionRates;
  leads: LeadCommissionSummary[];
  totals: {
    total_onboardings: number;
    total_contributions: number;
    total_agent_commission: number;
    total_lead_commission: number;
    grand_total: number;
  };
}

// ── PenCom-compliant operational logs (no customer PII) ──────────────────────

export interface OnboardingLog {
  id: string;
  apa_session_id: string;
  pfa_ack_ref: string | null;
  pfa_code: string;
  channel: 'android_app' | 'ios_app' | 'ussd' | 'offline_sync';
  product_type: 'micro_pension' | 'voluntary_contribution';
  status: 'initiated' | 'submitted' | 'pfa_confirmed' | 'failed' | 'rejected';
  error_code: string | null;
  http_status: number | null;
  agent_name: string;
  agent_code: string;
  lead_name: string;
  lead_code: string;
  agent_app_version: string;
  timestamp_submitted: string;
}

export interface ContributionLog {
  id: string;
  apa_session_id: string;
  pfa_ack_ref: string | null;
  pfa_code: string;
  channel: 'android_app' | 'ios_app' | 'ussd' | 'offline_sync';
  product_type: 'micro_pension' | 'voluntary_contribution';
  status: 'initiated' | 'submitted' | 'pfa_confirmed' | 'failed';
  error_code: string | null;
  http_status: number | null;
  agent_name: string;
  agent_code: string;
  lead_name: string;
  lead_code: string;
  agent_app_version: string;
  timestamp_submitted: string;
}

export interface WithdrawalLog {
  id: string;
  apa_session_id: string;
  pfa_ack_ref: string | null;
  pfa_code: string;
  channel: 'android_app' | 'ios_app' | 'ussd' | 'offline_sync';
  status: 'initiated' | 'submitted' | 'pfa_confirmed' | 'rejected';
  error_code: string | null;
  http_status: number | null;
  agent_name: string;
  agent_code: string;
  lead_name: string;
  lead_code: string;
  agent_app_version: string;
  timestamp_submitted: string;
}

// ── Agent hierarchy ──────────────────────────────────────────────────────────

export interface AgentWithHierarchy extends Agent {
  region: string | null;
  manager_id: string | null;
  rm_id: string | null;
  agent_type: AgentType;
}

export interface HierarchyNode {
  agent: AgentWithHierarchy;
  children: HierarchyNode[];
}

export interface TeamView {
  rms?: AgentWithHierarchy[];
  managers?: AgentWithHierarchy[];
  leads?: AgentWithHierarchy[];
  field_agents?: AgentWithHierarchy[];
}

export interface CommissionSummaryAgent {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  agent_type: AgentType;
  completed_onboardings: number;
  current_period_start: string;
  current_period_end: string;
  amount_earned: number;
  payment_status: 'pending' | 'scheduled' | 'paid';
  payment_date: string | null;
  payment_rule: 'biweekly' | 'monthly';
  target_met: boolean;
  target: number;
}

export interface Message {
  id: string;
  subject: string;
  body: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipients: 'all' | 'rm' | 'manager' | 'lead' | 'field' | 'management';
  same_group_only: boolean;
  recipient_ids: string[] | null;
  message_type: 'general' | 'complaint' | 'announcement';
  created_at: string;
  read: boolean;
  read_at: string | null;
}

export interface MessageThread {
  id: string;
  subject: string;
  messages: Message[];
  participants: string[];
  last_message_at: string;
  unread_count: number;
}

export interface Complaint {
  id: string;
  subject: string;
  body: string;
  sender_id: string;
  sender_name: string;
  sender_code: string;
  status: 'open' | 'in_progress' | 'resolved';
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
}
