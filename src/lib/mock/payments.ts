import type { CommissionPeriodSummary, AgentPaymentRecord, PaymentPeriod } from '$lib/types';

const currentPeriod: PaymentPeriod = {
  id: 'period-jun-1',
  start_date: '2026-06-09',
  end_date: '2026-06-22',
  period_type: 'biweekly',
  status: 'closed'
};

const previousPeriod: PaymentPeriod = {
  id: 'period-may-2',
  start_date: '2026-05-26',
  end_date: '2026-06-08',
  period_type: 'biweekly',
  status: 'paid'
};

const nextPeriod: PaymentPeriod = {
  id: 'period-jun-2',
  start_date: '2026-06-23',
  end_date: '2026-07-06',
  period_type: 'biweekly',
  status: 'active'
};

const currentRecords: AgentPaymentRecord[] = [
  {
    agent_id: 'agent-001',
    agent_name: 'Musa Ibrahim',
    agent_code: 'APA-0001',
    agent_type: 'field',
    period: currentPeriod,
    completed_onboardings: 54,
    completed_contributions: 12,
    direct_commission: 6000,
    override_commission: 0,
    total_commission: 6000,
    target: 50,
    target_met: true,
    payment_rule: 'biweekly',
    payment_status: 'scheduled',
    payment_date: '2026-06-23',
    bank_account: '****5678'
  },
  {
    agent_id: 'agent-002',
    agent_name: 'Amina Bello',
    agent_code: 'APA-0002',
    agent_type: 'field',
    period: currentPeriod,
    completed_onboardings: 61,
    completed_contributions: 18,
    direct_commission: 7000,
    override_commission: 0,
    total_commission: 7000,
    target: 50,
    target_met: true,
    payment_rule: 'biweekly',
    payment_status: 'scheduled',
    payment_date: '2026-06-23',
    bank_account: '****1234'
  },
  {
    agent_id: 'agent-003',
    agent_name: 'Ngozi Eze',
    agent_code: 'APA-0003',
    agent_type: 'field',
    period: currentPeriod,
    completed_onboardings: 38,
    completed_contributions: 8,
    direct_commission: 4200,
    override_commission: 0,
    total_commission: 4200,
    target: 50,
    target_met: false,
    payment_rule: 'monthly',
    payment_status: 'pending',
    payment_date: '2026-06-30',
    bank_account: '****9012'
  },
  {
    agent_id: 'agent-004',
    agent_name: 'Yakubu Danladi',
    agent_code: 'APA-0004',
    agent_type: 'field',
    period: currentPeriod,
    completed_onboardings: 45,
    completed_contributions: 10,
    direct_commission: 5000,
    override_commission: 0,
    total_commission: 5000,
    target: 50,
    target_met: false,
    payment_rule: 'monthly',
    payment_status: 'pending',
    payment_date: '2026-06-30',
    bank_account: '****3456'
  },
  {
    agent_id: 'lead-001',
    agent_name: 'Ibrahim Musa',
    agent_code: 'SPA-0001',
    agent_type: 'lead',
    period: currentPeriod,
    completed_onboardings: 0,
    completed_contributions: 0,
    direct_commission: 0,
    override_commission: 3450,
    total_commission: 3450,
    target: 50,
    target_met: false,
    payment_rule: 'monthly',
    payment_status: 'pending',
    payment_date: '2026-06-30',
    bank_account: '****7890'
  },
  {
    agent_id: 'agent-005',
    agent_name: 'Aisha Mohammed',
    agent_code: 'APA-0005',
    agent_type: 'field',
    period: currentPeriod,
    completed_onboardings: 52,
    completed_contributions: 15,
    direct_commission: 5950,
    override_commission: 0,
    total_commission: 5950,
    target: 50,
    target_met: true,
    payment_rule: 'biweekly',
    payment_status: 'scheduled',
    payment_date: '2026-06-23',
    bank_account: '****2345'
  },
  {
    agent_id: 'agent-006',
    agent_name: 'Emeka Nwosu',
    agent_code: 'APA-0006',
    agent_type: 'field',
    period: currentPeriod,
    completed_onboardings: 29,
    completed_contributions: 5,
    direct_commission: 3150,
    override_commission: 0,
    total_commission: 3150,
    target: 50,
    target_met: false,
    payment_rule: 'monthly',
    payment_status: 'pending',
    payment_date: '2026-06-30',
    bank_account: null
  },
  {
    agent_id: 'agent-007',
    agent_name: 'Hauwa Suleiman',
    agent_code: 'APA-0007',
    agent_type: 'field',
    period: currentPeriod,
    completed_onboardings: 33,
    completed_contributions: 7,
    direct_commission: 3650,
    override_commission: 0,
    total_commission: 3650,
    target: 50,
    target_met: false,
    payment_rule: 'monthly',
    payment_status: 'pending',
    payment_date: '2026-06-30',
    bank_account: '****6789'
  }
];

// Fixed offsets per record so previous period values are deterministic
const prevOnboardingOffsets = [4, 7, 14, 9, 0, 8, 22, 19];

export const mockCurrentPeriodSummary: CommissionPeriodSummary = {
  period: currentPeriod,
  total_agents: 8,
  agents_met_target: 3,
  agents_missed_target: 5,
  total_commission_due: 87500,
  total_paid: 0,
  total_pending: 87500,
  records: currentRecords
};

export const mockPreviousPeriodSummary: CommissionPeriodSummary = {
  period: previousPeriod,
  total_agents: 8,
  agents_met_target: 5,
  agents_missed_target: 3,
  total_commission_due: 92000,
  total_paid: 92000,
  total_pending: 0,
  records: currentRecords.map((r, i) => ({
    ...r,
    period: previousPeriod,
    completed_onboardings: r.completed_onboardings + (prevOnboardingOffsets[i] ?? 5),
    payment_status: 'paid' as const,
    payment_date: '2026-06-09',
    target_met: true,
    payment_rule: 'biweekly' as const
  }))
};

export const mockNextPeriodSummary: CommissionPeriodSummary = {
  period: nextPeriod,
  total_agents: 8,
  agents_met_target: 0,
  agents_missed_target: 0,
  total_commission_due: 0,
  total_paid: 0,
  total_pending: 0,
  records: currentRecords.map((r) => ({
    ...r,
    period: nextPeriod,
    completed_onboardings: 0,
    completed_contributions: 0,
    direct_commission: 0,
    override_commission: 0,
    total_commission: 0,
    target_met: false,
    payment_rule: 'biweekly' as const,
    payment_status: 'pending' as const,
    payment_date: null
  }))
};
