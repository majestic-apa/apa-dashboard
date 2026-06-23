import type {
  CommissionRates,
  CommissionSummary,
  AgentCommissionSummary,
  LeadCommissionSummary
} from '$lib/types';
import { mockOnboardingLog, mockContributionLog } from './reports';

// ── Rates ─────────────────────────────────────────────────────────────────────
// Placeholder flat-fee rates. Change ONLY here — all totals cascade automatically.
export const COMMISSION_RATES: CommissionRates = {
  agent_per_onboarding: 100,
  lead_override_per_onboarding: 30,
  agent_per_contribution: 50,
  lead_override_per_contribution: 15
};

// ── Derive commission data from CSV-backed log arrays ─────────────────────────

// 1. Count completed events per agent from both log types
const onboardingCount: Record<string, number> = {};
const contributionCount: Record<string, number> = {};
const agentMeta: Record<string, { agent_name: string; lead_code: string; lead_name: string }> = {};

for (const log of mockOnboardingLog) {
  // Record agent metadata (first occurrence wins)
  if (!agentMeta[log.agent_code]) {
    agentMeta[log.agent_code] = {
      agent_name: log.agent_name,
      lead_code:  log.lead_code,
      lead_name:  log.lead_name
    };
  }
  if (log.status === 'pfa_confirmed') {
    onboardingCount[log.agent_code] = (onboardingCount[log.agent_code] ?? 0) + 1;
  }
}

for (const log of mockContributionLog) {
  if (!agentMeta[log.agent_code]) {
    agentMeta[log.agent_code] = {
      agent_name: log.agent_name,
      lead_code:  log.lead_code,
      lead_name:  log.lead_name
    };
  }
  if (log.status === 'pfa_confirmed') {
    contributionCount[log.agent_code] = (contributionCount[log.agent_code] ?? 0) + 1;
  }
}

// 2. Build per-agent summaries
const agentSummaries: AgentCommissionSummary[] = Object.entries(agentMeta).map(
  ([code, info]) => {
    const ob = onboardingCount[code] ?? 0;
    const ct = contributionCount[code] ?? 0;
    const direct =
      ob * COMMISSION_RATES.agent_per_onboarding +
      ct * COMMISSION_RATES.agent_per_contribution;
    return {
      agent_code:              code,
      agent_name:              info.agent_name,
      agent_type:              'field' as const,
      lead_code:               info.lead_code,
      lead_name:               info.lead_name,
      completed_onboardings:   ob,
      completed_contributions: ct,
      direct_commission:       direct,
      override_commission:     0,
      total_commission:        direct
    };
  }
);

// Sort agents by code for a consistent display order
agentSummaries.sort((a, b) => a.agent_code.localeCompare(b.agent_code));

// 3. Group agents by lead and build lead summaries
const leadGroups: Record<string, AgentCommissionSummary[]> = {};
for (const agent of agentSummaries) {
  if (agent.lead_code) {
    (leadGroups[agent.lead_code] ??= []).push(agent);
  }
}

const leadSummaries: LeadCommissionSummary[] = Object.entries(leadGroups).map(
  ([leadCode, agents]) => {
    const totalOb = agents.reduce((s, a) => s + a.completed_onboardings, 0);
    const totalCt = agents.reduce((s, a) => s + a.completed_contributions, 0);
    const override =
      totalOb * COMMISSION_RATES.lead_override_per_onboarding +
      totalCt * COMMISSION_RATES.lead_override_per_contribution;
    const teamTotal = agents.reduce((s, a) => s + a.total_commission, 0) + override;

    return {
      lead_code:               leadCode,
      lead_name:               agents[0].lead_name ?? leadCode,
      total_onboardings:       totalOb,
      total_contributions:     totalCt,
      lead_override_commission: override,
      agents,
      team_total_commission:   teamTotal
    };
  }
);

// Sort leads by code
leadSummaries.sort((a, b) => a.lead_code.localeCompare(b.lead_code));

// 4. Compute grand totals
const grandOnboardings   = leadSummaries.reduce((s, l) => s + l.total_onboardings, 0);
const grandContributions = leadSummaries.reduce((s, l) => s + l.total_contributions, 0);
const grandAgentComm     = agentSummaries.reduce((s, a) => s + a.direct_commission, 0);
const grandLeadComm      = leadSummaries.reduce((s, l) => s + l.lead_override_commission, 0);
const grandTotal         = leadSummaries.reduce((s, l) => s + l.team_total_commission, 0);

export const mockCommissionSummary: CommissionSummary = {
  rates: COMMISSION_RATES,
  leads: leadSummaries,
  totals: {
    total_onboardings:      grandOnboardings,
    total_contributions:    grandContributions,
    total_agent_commission: grandAgentComm,
    total_lead_commission:  grandLeadComm,
    grand_total:            grandTotal
  }
};
