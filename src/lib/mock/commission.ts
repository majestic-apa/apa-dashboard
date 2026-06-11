import type {
  CommissionRates,
  CommissionSummary,
  AgentCommissionSummary,
  LeadCommissionSummary
} from '$lib/types';

// ── Rates ─────────────────────────────────────────────────────────────────────
// Placeholder flat-fee rates. Update these when management confirms final rates.
// These are the ONLY place in the codebase where rates are defined.
export const COMMISSION_RATES: CommissionRates = {
  agent_per_onboarding: 100,
  lead_override_per_onboarding: 30,
  agent_per_contribution: 50,
  lead_override_per_contribution: 15
};

// ── Helper ────────────────────────────────────────────────────────────────────
function agentDirect(ob: number, ct: number): number {
  return (
    ob * COMMISSION_RATES.agent_per_onboarding +
    ct * COMMISSION_RATES.agent_per_contribution
  );
}

function leadOverride(ob: number, ct: number): number {
  return (
    ob * COMMISSION_RATES.lead_override_per_onboarding +
    ct * COMMISSION_RATES.lead_override_per_contribution
  );
}

// ── SPA-0001 field agents ──────────────────────────────────────────────────────
// Lead: Chukwuemeka Okafor (SPA-0001)
// Onboardings: APA-0001 → 18, APA-0002 → 14, APA-0005 → 12  (total = 44)
// Contributions: APA-0001 → 12, APA-0002 → 9, APA-0005 → 8  (total = 29)

const spa0001Agents: AgentCommissionSummary[] = [
  {
    agent_code: 'APA-0001',
    agent_name: 'Emmanuel Nwosu',
    agent_type: 'field',
    lead_code: 'SPA-0001',
    lead_name: 'Chukwuemeka Okafor',
    completed_onboardings: 18,
    completed_contributions: 12,
    direct_commission: agentDirect(18, 12), // ₦2,400
    override_commission: 0,
    total_commission: agentDirect(18, 12)
  },
  {
    agent_code: 'APA-0002',
    agent_name: 'Ngozi Eze',
    agent_type: 'field',
    lead_code: 'SPA-0001',
    lead_name: 'Chukwuemeka Okafor',
    completed_onboardings: 14,
    completed_contributions: 9,
    direct_commission: agentDirect(14, 9), // ₦1,850
    override_commission: 0,
    total_commission: agentDirect(14, 9)
  },
  {
    agent_code: 'APA-0005',
    agent_name: 'Taiwo Adeyemi',
    agent_type: 'field',
    lead_code: 'SPA-0001',
    lead_name: 'Chukwuemeka Okafor',
    completed_onboardings: 12,
    completed_contributions: 8,
    direct_commission: agentDirect(12, 8), // ₦1,600
    override_commission: 0,
    total_commission: agentDirect(12, 8)
  }
];

// ── SPA-0002 field agents ──────────────────────────────────────────────────────
// Lead: Fatima Abubakar (SPA-0002)
// Onboardings: APA-0003 → 16, APA-0004 → 11, APA-0008 → 13  (total = 40)
// Contributions: APA-0003 → 10, APA-0004 → 7, APA-0008 → 9  (total = 26)

const spa0002Agents: AgentCommissionSummary[] = [
  {
    agent_code: 'APA-0003',
    agent_name: 'Ibrahim Musa',
    agent_type: 'field',
    lead_code: 'SPA-0002',
    lead_name: 'Fatima Abubakar',
    completed_onboardings: 16,
    completed_contributions: 10,
    direct_commission: agentDirect(16, 10), // ₦2,100
    override_commission: 0,
    total_commission: agentDirect(16, 10)
  },
  {
    agent_code: 'APA-0004',
    agent_name: 'Aisha Usman',
    agent_type: 'field',
    lead_code: 'SPA-0002',
    lead_name: 'Fatima Abubakar',
    completed_onboardings: 11,
    completed_contributions: 7,
    direct_commission: agentDirect(11, 7), // ₦1,450
    override_commission: 0,
    total_commission: agentDirect(11, 7)
  },
  {
    agent_code: 'APA-0008',
    agent_name: 'Yusuf Garba',
    agent_type: 'field',
    lead_code: 'SPA-0002',
    lead_name: 'Fatima Abubakar',
    completed_onboardings: 13,
    completed_contributions: 9,
    direct_commission: agentDirect(13, 9), // ₦1,750
    override_commission: 0,
    total_commission: agentDirect(13, 9)
  }
];

// ── SPA-0003 field agents ──────────────────────────────────────────────────────
// Lead: Biodun Adeleke (SPA-0003)
// Onboardings: APA-0006 → 9, APA-0007 → 10  (total = 19)
// Contributions: APA-0006 → 6, APA-0007 → 7  (total = 13)

const spa0003Agents: AgentCommissionSummary[] = [
  {
    agent_code: 'APA-0006',
    agent_name: 'Segun Afolabi',
    agent_type: 'field',
    lead_code: 'SPA-0003',
    lead_name: 'Biodun Adeleke',
    completed_onboardings: 9,
    completed_contributions: 6,
    direct_commission: agentDirect(9, 6), // ₦1,200
    override_commission: 0,
    total_commission: agentDirect(9, 6)
  },
  {
    agent_code: 'APA-0007',
    agent_name: 'Blessing Okonkwo',
    agent_type: 'field',
    lead_code: 'SPA-0003',
    lead_name: 'Biodun Adeleke',
    completed_onboardings: 10,
    completed_contributions: 7,
    direct_commission: agentDirect(10, 7), // ₦1,350
    override_commission: 0,
    total_commission: agentDirect(10, 7)
  }
];

// ── Lead summaries ────────────────────────────────────────────────────────────
const spa0001Lead: LeadCommissionSummary = {
  lead_code: 'SPA-0001',
  lead_name: 'Chukwuemeka Okafor',
  total_onboardings: 44,  // 18+14+12
  total_contributions: 29, // 12+9+8
  lead_override_commission: leadOverride(44, 29), // ₦1,755
  agents: spa0001Agents,
  team_total_commission:
    spa0001Agents.reduce((s, a) => s + a.total_commission, 0) + leadOverride(44, 29) // ₦7,605
};

const spa0002Lead: LeadCommissionSummary = {
  lead_code: 'SPA-0002',
  lead_name: 'Fatima Abubakar',
  total_onboardings: 40,  // 16+11+13
  total_contributions: 26, // 10+7+9
  lead_override_commission: leadOverride(40, 26), // ₦1,590
  agents: spa0002Agents,
  team_total_commission:
    spa0002Agents.reduce((s, a) => s + a.total_commission, 0) + leadOverride(40, 26) // ₦6,890
};

const spa0003Lead: LeadCommissionSummary = {
  lead_code: 'SPA-0003',
  lead_name: 'Biodun Adeleke',
  total_onboardings: 19,  // 9+10
  total_contributions: 13, // 6+7
  lead_override_commission: leadOverride(19, 13), // ₦765
  agents: spa0003Agents,
  team_total_commission:
    spa0003Agents.reduce((s, a) => s + a.total_commission, 0) + leadOverride(19, 13) // ₦3,315
};

// ── Full commission summary ───────────────────────────────────────────────────
// Verified totals:
//   Total onboardings: 44 + 40 + 19 = 103
//   Total contributions: 29 + 26 + 13 = 68
//   Agent direct commission: ₦2,400 + ₦1,850 + ₦1,600 + ₦2,100 + ₦1,450 + ₦1,750 + ₦1,200 + ₦1,350 = ₦13,700
//   Lead override commission: ₦1,755 + ₦1,590 + ₦765 = ₦4,110
//   Grand total: ₦13,700 + ₦4,110 = ₦17,810

const allAgents = [...spa0001Agents, ...spa0002Agents, ...spa0003Agents];
const allLeads = [spa0001Lead, spa0002Lead, spa0003Lead];

export const mockCommissionSummary: CommissionSummary = {
  rates: COMMISSION_RATES,
  leads: allLeads,
  totals: {
    total_onboardings: allLeads.reduce((s, l) => s + l.total_onboardings, 0),        // 103
    total_contributions: allLeads.reduce((s, l) => s + l.total_contributions, 0),    // 68
    total_agent_commission: allAgents.reduce((s, a) => s + a.direct_commission, 0),  // ₦13,700
    total_lead_commission: allLeads.reduce((s, l) => s + l.lead_override_commission, 0), // ₦4,110
    grand_total: allLeads.reduce((s, l) => s + l.team_total_commission, 0)           // ₦17,810
  }
};
