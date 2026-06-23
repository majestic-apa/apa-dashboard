import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  StaffSummary,
  AgentSummary,
  AgentNetworkNode,
  DashboardStats,
  OnboardingLog,
  ContributionLog,
  WithdrawalLog
} from '$lib/types';
import { mockLeads, mockAgents } from './agents';
import { parseCSV } from '$lib/utils/csv';

// ── Static summary data (never CSV-loaded) ────────────────────────────────────

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
  agents: mockAgents.filter((a) => a.lead_agent_id === lead.id)
}));

// ── CSV → TypeScript mapping helpers ─────────────────────────────────────────

/** PFA name in CSV → 3-letter code for display */
const PFA_NAME_TO_CODE: Record<string, string> = {
  'Citizens Pension Fund Administrators': 'CIT',
  'Stanbic IBTC Pension Managers': 'STA',
  'ARM Pension Managers': 'ARM',
  'Trustfund Pensions': 'TRU',
  'FCMB Pensions': 'FCM',
  'OAK Pensions': 'OAK',
  'Premium Pension': 'PRE',
  'NLPC Pension Fund Administrators': 'NLP',
  'Access Pensions': 'ACC'
};

function extractPfaCode(pfa_ref: string, pfa_name: string): string {
  if (pfa_ref) {
    // e.g. "PFA-CIT-8447554462" → "CIT"
    const parts = pfa_ref.split('-');
    if (parts.length >= 2) return parts[1];
  }
  return PFA_NAME_TO_CODE[pfa_name] ?? pfa_name.slice(0, 3).toUpperCase();
}

function mapStatus(csvStatus: string): string {
  switch (csvStatus.toLowerCase()) {
    case 'completed': return 'pfa_confirmed';
    case 'failed':    return 'failed';
    case 'pending':   return 'submitted';
    case 'rejected':  return 'rejected';
    default:          return 'initiated';
  }
}

function httpStatus(csvStatus: string): number | null {
  switch (csvStatus.toLowerCase()) {
    case 'completed': return 200;
    case 'failed':    return 422;
    case 'rejected':  return 409;
    default:          return null;
  }
}

function toIso(submitted_at: string): string {
  // CSV format: "2026-02-15 07:57:33" → ISO 8601 UTC
  return submitted_at.trim().replace(' ', 'T') + 'Z';
}

// ── CSV loaders ───────────────────────────────────────────────────────────────

function loadOnboardingFromCSV(csvPath: string): OnboardingLog[] {
  const raw = parseCSV(readFileSync(csvPath, 'utf-8'));
  return raw.map((row, i): OnboardingLog => {
    const status = mapStatus(row.status);
    const pfa_ref = row.pfa_ref || null;
    return {
      id:                  row.apa_ref || `ob${i + 1}`,
      apa_session_id:      row.session_id,
      pfa_ack_ref:         pfa_ref,
      pfa_code:            extractPfaCode(row.pfa_ref, row.pfa_name),
      channel:             row.channel as OnboardingLog['channel'],
      product_type:        row.product === 'PPP' ? 'micro_pension' : 'voluntary_contribution',
      status:              status as OnboardingLog['status'],
      error_code:          null,
      http_status:         httpStatus(row.status),
      agent_name:          row.agent_name,
      agent_code:          row.agent_code,
      lead_name:           row.lead_name,
      lead_code:           row.lead_code,
      agent_app_version:   'v2.4.1',
      timestamp_submitted: toIso(row.submitted_at)
    };
  });
}

function loadContributionFromCSV(csvPath: string): ContributionLog[] {
  const raw = parseCSV(readFileSync(csvPath, 'utf-8'));
  return raw.map((row, i): ContributionLog => {
    const status = mapStatus(row.status);
    const pfa_ref = row.pfa_ref || null;
    return {
      id:                  row.apa_ref || `ct${i + 1}`,
      apa_session_id:      row.session_id,
      pfa_ack_ref:         pfa_ref,
      pfa_code:            extractPfaCode(row.pfa_ref, row.pfa_name),
      channel:             row.channel as ContributionLog['channel'],
      product_type:        'micro_pension', // contribution CSV has no product column
      status:              status as ContributionLog['status'],
      error_code:          null,
      http_status:         httpStatus(row.status),
      agent_name:          row.agent_name,
      agent_code:          row.agent_code,
      lead_name:           row.lead_name,
      lead_code:           row.lead_code,
      agent_app_version:   'v2.4.1',
      timestamp_submitted: toIso(row.submitted_at)
    };
  });
}

function loadWithdrawalFromCSV(csvPath: string): WithdrawalLog[] {
  const raw = parseCSV(readFileSync(csvPath, 'utf-8'));
  return raw.map((row, i): WithdrawalLog => {
    const status = mapStatus(row.status);
    const pfa_ref = row.pfa_ref || null;
    return {
      id:                  row.apa_ref || `wd${i + 1}`,
      apa_session_id:      row.session_id,
      pfa_ack_ref:         pfa_ref,
      pfa_code:            extractPfaCode(row.pfa_ref, row.pfa_name),
      channel:             row.channel as WithdrawalLog['channel'],
      status:              status as WithdrawalLog['status'],
      error_code:          null,
      http_status:         httpStatus(row.status),
      agent_name:          row.agent_name,
      agent_code:          row.agent_code,
      lead_name:           row.lead_name,
      lead_code:           row.lead_code,
      agent_app_version:   'v2.4.1',
      timestamp_submitted: toIso(row.submitted_at)
    };
  });
}

// ── Module-level initialization with fallback ─────────────────────────────────
// Reads CSV files once at server startup.
// If CSV files are missing, falls back to the compact hardcoded arrays below.

const CSV_DIR = join(process.cwd(), 'static', 'mock-data');

function tryLoad<T>(loader: () => T[], name: string, fallback: T[]): T[] {
  try {
    const result = loader();
    console.info(`[mock] Loaded ${result.length} rows from ${name}`);
    return result;
  } catch {
    console.warn(
      `[mock] ${name} not found in static/mock-data/ — using built-in fallback (${fallback.length} records). ` +
      'Copy CSV files there to use real data.'
    );
    return fallback;
  }
}

// ── Fallback hardcoded data (used when CSVs are absent) ───────────────────────

const FALLBACK_ONBOARDING: OnboardingLog[] = [
  { id: 'ob01', apa_session_id: 'APA-2026-06-03-a1b2c3', pfa_ack_ref: 'PFA-ARM-20260603001', pfa_code: 'ARM', channel: 'android_app', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Emmanuel Nwosu', agent_code: 'APA-0001', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-03T08:15:00Z' },
  { id: 'ob02', apa_session_id: 'APA-2026-06-03-d4e5f6', pfa_ack_ref: 'PFA-STA-20260603002', pfa_code: 'STA', channel: 'android_app', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Ngozi Eze', agent_code: 'APA-0002', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-03T09:30:00Z' },
  { id: 'ob03', apa_session_id: 'APA-2026-06-03-g7h8i9', pfa_ack_ref: null, pfa_code: 'NLPC', channel: 'android_app', product_type: 'micro_pension', status: 'failed', error_code: 'PFA_NIN_MISMATCH', http_status: 422, agent_name: 'Ibrahim Musa', agent_code: 'APA-0003', lead_name: 'Fatima Abubakar', lead_code: 'SPA-0002', agent_app_version: 'v2.4.0', timestamp_submitted: '2026-06-03T10:00:00Z' },
  { id: 'ob04', apa_session_id: 'APA-2026-06-03-j0k1l2', pfa_ack_ref: 'PFA-ARM-20260603003', pfa_code: 'ARM', channel: 'ios_app', product_type: 'voluntary_contribution', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Taiwo Adeyemi', agent_code: 'APA-0005', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-03T11:15:00Z' },
  { id: 'ob05', apa_session_id: 'APA-2026-06-03-m3n4o5', pfa_ack_ref: null, pfa_code: 'PAL', channel: 'android_app', product_type: 'micro_pension', status: 'failed', error_code: 'PFA_TIMEOUT', http_status: 500, agent_name: 'Segun Afolabi', agent_code: 'APA-0006', lead_name: 'Biodun Adeleke', lead_code: 'SPA-0003', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-03T13:45:00Z' },
  { id: 'ob06', apa_session_id: 'APA-2026-06-04-p6q7r8', pfa_ack_ref: 'PFA-NLPC-20260604001', pfa_code: 'NLPC', channel: 'android_app', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Blessing Okonkwo', agent_code: 'APA-0007', lead_name: 'Biodun Adeleke', lead_code: 'SPA-0003', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-04T08:00:00Z' },
  { id: 'ob07', apa_session_id: 'APA-2026-06-04-s9t0u1', pfa_ack_ref: 'PFA-STA-20260604002', pfa_code: 'STA', channel: 'android_app', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Yusuf Garba', agent_code: 'APA-0008', lead_name: 'Fatima Abubakar', lead_code: 'SPA-0002', agent_app_version: 'v2.4.0', timestamp_submitted: '2026-06-04T09:30:00Z' },
  { id: 'ob08', apa_session_id: 'APA-2026-06-04-v2w3x4', pfa_ack_ref: null, pfa_code: 'ARM', channel: 'ios_app', product_type: 'voluntary_contribution', status: 'rejected', error_code: 'DUPLICATE_SUBMISSION', http_status: 409, agent_name: 'Emmanuel Nwosu', agent_code: 'APA-0001', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-04T10:15:00Z' },
  { id: 'ob09', apa_session_id: 'APA-2026-06-04-y5z6a7', pfa_ack_ref: null, pfa_code: 'PAL', channel: 'android_app', product_type: 'micro_pension', status: 'submitted', error_code: null, http_status: null, agent_name: 'Ibrahim Musa', agent_code: 'APA-0003', lead_name: 'Fatima Abubakar', lead_code: 'SPA-0002', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-04T11:00:00Z' },
  { id: 'ob10', apa_session_id: 'APA-2026-06-04-b8c9d0', pfa_ack_ref: 'PFA-PAL-20260604003', pfa_code: 'PAL', channel: 'android_app', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Ngozi Eze', agent_code: 'APA-0002', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.0', timestamp_submitted: '2026-06-04T11:45:00Z' }
];

const FALLBACK_CONTRIBUTION: ContributionLog[] = [
  { id: 'ct01', apa_session_id: 'APA-2026-06-03-c1d2e3', pfa_ack_ref: 'PFA-ARM-20260603C01', pfa_code: 'ARM', channel: 'android_app', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Emmanuel Nwosu', agent_code: 'APA-0001', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-03T08:45:00Z' },
  { id: 'ct02', apa_session_id: 'APA-2026-06-03-f4g5h6', pfa_ack_ref: 'PFA-STA-20260603C02', pfa_code: 'STA', channel: 'android_app', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Taiwo Adeyemi', agent_code: 'APA-0005', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-03T10:00:00Z' },
  { id: 'ct03', apa_session_id: 'APA-2026-06-03-i7j8k9', pfa_ack_ref: 'PFA-NLPC-20260603C03', pfa_code: 'NLPC', channel: 'ussd', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Ibrahim Musa', agent_code: 'APA-0003', lead_name: 'Fatima Abubakar', lead_code: 'SPA-0002', agent_app_version: 'v2.4.0', timestamp_submitted: '2026-06-03T11:30:00Z' },
  { id: 'ct04', apa_session_id: 'APA-2026-06-03-l0m1n2', pfa_ack_ref: null, pfa_code: 'ARM', channel: 'android_app', product_type: 'voluntary_contribution', status: 'failed', error_code: 'PFA_TIMEOUT', http_status: 504, agent_name: 'Ngozi Eze', agent_code: 'APA-0002', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-03T14:15:00Z' },
  { id: 'ct05', apa_session_id: 'APA-2026-06-04-o3p4q5', pfa_ack_ref: 'PFA-PAL-20260604C01', pfa_code: 'PAL', channel: 'android_app', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Segun Afolabi', agent_code: 'APA-0006', lead_name: 'Biodun Adeleke', lead_code: 'SPA-0003', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-04T08:30:00Z' },
  { id: 'ct06', apa_session_id: 'APA-2026-06-04-r6s7t8', pfa_ack_ref: 'PFA-STA-20260604C02', pfa_code: 'STA', channel: 'ios_app', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Blessing Okonkwo', agent_code: 'APA-0007', lead_name: 'Biodun Adeleke', lead_code: 'SPA-0003', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-04T09:00:00Z' },
  { id: 'ct07', apa_session_id: 'APA-2026-06-04-u9v0w1', pfa_ack_ref: 'PFA-NLPC-20260604C03', pfa_code: 'NLPC', channel: 'android_app', product_type: 'micro_pension', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Yusuf Garba', agent_code: 'APA-0008', lead_name: 'Fatima Abubakar', lead_code: 'SPA-0002', agent_app_version: 'v2.4.0', timestamp_submitted: '2026-06-04T10:00:00Z' },
  { id: 'ct08', apa_session_id: 'APA-2026-06-04-x2y3z4', pfa_ack_ref: null, pfa_code: 'PAL', channel: 'android_app', product_type: 'micro_pension', status: 'initiated', error_code: null, http_status: null, agent_name: 'Emmanuel Nwosu', agent_code: 'APA-0001', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-04T11:30:00Z' },
  { id: 'ct09', apa_session_id: 'APA-2026-06-04-a5b6c7', pfa_ack_ref: 'PFA-ARM-20260604C02', pfa_code: 'ARM', channel: 'android_app', product_type: 'voluntary_contribution', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Taiwo Adeyemi', agent_code: 'APA-0005', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-04T12:00:00Z' }
];

const FALLBACK_WITHDRAWAL: WithdrawalLog[] = [
  { id: 'wd01', apa_session_id: 'APA-2026-06-03-w1x2y3', pfa_ack_ref: 'PFA-ARM-20260603W01', pfa_code: 'ARM', channel: 'android_app', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Emmanuel Nwosu', agent_code: 'APA-0001', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-03T09:00:00Z' },
  { id: 'wd02', apa_session_id: 'APA-2026-06-03-z4a5b6', pfa_ack_ref: null, pfa_code: 'STA', channel: 'android_app', status: 'rejected', error_code: 'INSUFFICIENT_BALANCE', http_status: 422, agent_name: 'Ngozi Eze', agent_code: 'APA-0002', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-03T10:30:00Z' },
  { id: 'wd03', apa_session_id: 'APA-2026-06-03-c7d8e9', pfa_ack_ref: 'PFA-NLPC-20260603W02', pfa_code: 'NLPC', channel: 'android_app', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Ibrahim Musa', agent_code: 'APA-0003', lead_name: 'Fatima Abubakar', lead_code: 'SPA-0002', agent_app_version: 'v2.4.0', timestamp_submitted: '2026-06-03T12:00:00Z' },
  { id: 'wd04', apa_session_id: 'APA-2026-06-03-f0g1h2', pfa_ack_ref: null, pfa_code: 'PAL', channel: 'ios_app', status: 'rejected', error_code: 'PENDING_VERIFICATION', http_status: 403, agent_name: 'Taiwo Adeyemi', agent_code: 'APA-0005', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-03T14:00:00Z' },
  { id: 'wd05', apa_session_id: 'APA-2026-06-04-i3j4k5', pfa_ack_ref: 'PFA-STA-20260604W01', pfa_code: 'STA', channel: 'android_app', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Segun Afolabi', agent_code: 'APA-0006', lead_name: 'Biodun Adeleke', lead_code: 'SPA-0003', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-04T08:15:00Z' },
  { id: 'wd06', apa_session_id: 'APA-2026-06-04-l6m7n8', pfa_ack_ref: 'PFA-ARM-20260604W02', pfa_code: 'ARM', channel: 'android_app', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Blessing Okonkwo', agent_code: 'APA-0007', lead_name: 'Biodun Adeleke', lead_code: 'SPA-0003', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-04T09:45:00Z' },
  { id: 'wd07', apa_session_id: 'APA-2026-06-04-o9p0q1', pfa_ack_ref: null, pfa_code: 'NLPC', channel: 'ussd', status: 'initiated', error_code: null, http_status: null, agent_name: 'Yusuf Garba', agent_code: 'APA-0008', lead_name: 'Fatima Abubakar', lead_code: 'SPA-0002', agent_app_version: 'v2.4.0', timestamp_submitted: '2026-06-04T10:30:00Z' },
  { id: 'wd08', apa_session_id: 'APA-2026-06-04-r2s3t4', pfa_ack_ref: 'PFA-PAL-20260604W03', pfa_code: 'PAL', channel: 'android_app', status: 'pfa_confirmed', error_code: null, http_status: 200, agent_name: 'Emmanuel Nwosu', agent_code: 'APA-0001', lead_name: 'Chukwuemeka Okafor', lead_code: 'SPA-0001', agent_app_version: 'v2.4.1', timestamp_submitted: '2026-06-04T11:15:00Z' }
];

// ── Exported log arrays (CSV-backed with fallback) ────────────────────────────

export const mockOnboardingLog: OnboardingLog[] = tryLoad(
  () => loadOnboardingFromCSV(join(CSV_DIR, 'onboarding_data.csv')),
  'onboarding_data.csv',
  FALLBACK_ONBOARDING
);

export const mockContributionLog: ContributionLog[] = tryLoad(
  () => loadContributionFromCSV(join(CSV_DIR, 'contribution_data.csv')),
  'contribution_data.csv',
  FALLBACK_CONTRIBUTION
);

export const mockWithdrawalLog: WithdrawalLog[] = tryLoad(
  () => loadWithdrawalFromCSV(join(CSV_DIR, 'withdrawal_data.csv')),
  'withdrawal_data.csv',
  FALLBACK_WITHDRAWAL
);
