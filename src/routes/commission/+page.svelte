<script lang="ts">
  import type { PageData } from './$types';
  import type { AgentPaymentRecord, CommissionPeriodSummary } from '$lib/types';

  let { data }: { data: PageData } = $props();

  type MainTab = 'current' | 'history' | 'all';
  let activeTab = $state<MainTab>('current');
  let selectedPeriodId = $state<string>('period-jun-1');

  const selectedPeriod = $derived<CommissionPeriodSummary | null>(
    data.all.find((p) => p.period.id === selectedPeriodId) ?? null
  );

  function fmtDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function fmtPeriod(start: string, end: string): string {
    const [sy, sm, sd] = start.split('-').map(Number);
    const [ey, em, ed] = end.split('-').map(Number);
    const s = new Date(sy, sm - 1, sd).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
    const e = new Date(ey, em - 1, ed).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return s + ' - ' + e;
  }

  function fmt(n: number): string {
    return '₦' + n.toLocaleString();
  }

  function statusLabel(status: string): string {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'pending': return 'Pending';
      case 'paid': return 'Paid';
      case 'processing': return 'Processing';
      default: return status;
    }
  }

  function statusStyle(status: string): string {
    switch (status) {
      case 'scheduled': return 'background:#dcfce7;color:#15803d;';
      case 'pending': return 'background:#fef3c7;color:#b45309;';
      case 'paid': return 'background:#dbeafe;color:#1d4ed8;';
      case 'processing': return 'background:#082b67;color:#ffffff;';
      default: return 'background:#f3f4f6;color:#6b7280;';
    }
  }

  function periodStatusStyle(status: string): string {
    switch (status) {
      case 'active': return 'background:#dcfce7;color:#15803d;';
      case 'closed': return 'background:#fef3c7;color:#b45309;';
      case 'paid': return 'background:#dbeafe;color:#1d4ed8;';
      default: return 'background:#f3f4f6;color:#6b7280;';
    }
  }

  const thCls = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-500';
  const thRCls = 'px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-gray-500';
</script>

<div class="min-h-full px-8 py-8">
  <!-- Page header -->
  <div class="mb-6">
    <h1 class="text-xl font-bold" style="color: #082b67;">Commission Payment Schedule</h1>
    <p class="mt-1 text-sm text-gray-500">
      Target: 50 completed onboardings per 2-week period. Meeting target triggers bi-weekly payment; below target rolls to month end.
    </p>
  </div>

  <!-- Tab bar -->
  <div class="mb-6 flex gap-1 border-b border-gray-200">
    {#each ([
      { id: 'current', label: 'Current Period' },
      { id: 'history', label: 'Payment History' },
      ...(data.canViewAll ? [{ id: 'all', label: 'All Periods' }] : [])
    ] as const) as tab}
      <button
        type="button"
        onclick={() => (activeTab = tab.id as MainTab)}
        class="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors"
        style={activeTab === tab.id
          ? 'border-color: #082b67; color: #082b67;'
          : 'border-color: transparent; color: #6b7280;'}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- ── Tab 1: Current Period ──────────────────────────────────────────── -->
  {#if activeTab === 'current'}
    {@const s = data.current}
    {@const fieldRecs = s.records.filter((r) => r.agent_type === 'field')}
    {@const leadRecs = s.records.filter((r) => r.agent_type === 'lead')}
    {@const fieldMetTarget = fieldRecs.filter((r) => r.target_met).length}
    {@const leadOverrideTotal = leadRecs.reduce((sum, r) => sum + r.override_commission, 0)}

    <!-- Summary cards -->
    <div class="mb-6 grid grid-cols-4 gap-4">
      <div class="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">Total Field Agents</p>
        <p class="mt-1 text-2xl font-bold" style="color: #082b67;">{fieldRecs.length}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">Field Agents Met Target (50+)</p>
        <p class="mt-1 text-2xl font-bold" style="color: #15803d;">{fieldMetTarget}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">Total Lead Override</p>
        <p class="mt-1 text-2xl font-bold" style="color: #5b21b6;">{fmt(leadOverrideTotal)}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">Total Commission Due</p>
        <p class="mt-1 text-2xl font-bold" style="color: #082b67;">{fmt(s.total_commission_due)}</p>
      </div>
    </div>

    <!-- Payment rule explanation -->
    <div
      class="mb-6 rounded-lg border px-5 py-4"
      style="background: #fffbeb; border-color: #fde68a;"
    >
      <p class="text-sm font-semibold" style="color: #92400e;">Payment Rule — {fmtPeriod(s.period.start_date, s.period.end_date)}</p>
      <p class="mt-1 text-sm" style="color: #78350f;">
        Agents who onboard 50 or more contributors in this 2-week period will be paid on
        <strong>23 Jun 2026</strong>. Agents below 50 will be paid on <strong>30 Jun 2026</strong>.
      </p>
    </div>

    {@render periodBody(fieldRecs, leadRecs)}
    {@render footnote()}
  {/if}

  <!-- ── Tab 2: Payment History ─────────────────────────────────────────── -->
  {#if activeTab === 'history'}
    {@const s = data.previous}
    {@const fieldRecs = s.records.filter((r) => r.agent_type === 'field')}
    {@const leadRecs = s.records.filter((r) => r.agent_type === 'lead')}
    {@const leadOverrideTotal = leadRecs.reduce((sum, r) => sum + r.override_commission, 0)}

    <div class="mb-4">
      <p class="text-sm font-semibold" style="color: #082b67;">
        {fmtPeriod(s.period.start_date, s.period.end_date)}
      </p>
    </div>

    <!-- Summary cards -->
    <div class="mb-6 grid grid-cols-3 gap-4">
      <div class="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">Total Paid</p>
        <p class="mt-1 text-2xl font-bold" style="color: #1d4ed8;">{fmt(s.total_paid)}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">Field Agents Paid</p>
        <p class="mt-1 text-2xl font-bold" style="color: #082b67;">{fieldRecs.length}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">Lead Override Paid</p>
        <p class="mt-1 text-2xl font-bold" style="color: #5b21b6;">{fmt(leadOverrideTotal)}</p>
      </div>
    </div>

    {@render periodBody(fieldRecs, leadRecs)}
    {@render footnote()}
  {/if}

  <!-- ── Tab 3: All Periods (BD only) ──────────────────────────────────── -->
  {#if activeTab === 'all' && data.canViewAll}
    <!-- Period cards -->
    <div class="mb-6 grid grid-cols-3 gap-4">
      {#each data.all as summary}
        {@const p = summary.period}
        {@const isSelected = selectedPeriodId === p.id}
        <button
          type="button"
          onclick={() => (selectedPeriodId = p.id)}
          class="rounded-lg border-2 bg-white px-5 py-4 text-left transition-shadow hover:shadow-md"
          style={isSelected ? 'border-color: #082b67;' : 'border-color: #e5e7eb;'}
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-widest text-gray-500">
              {p.period_type === 'biweekly' ? 'Bi-weekly' : 'Monthly'}
            </span>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
              style={periodStatusStyle(p.status)}
            >
              {p.status}
            </span>
          </div>
          <p class="text-sm font-semibold" style="color: #082b67;">
            {fmtPeriod(p.start_date, p.end_date)}
          </p>
          <div class="mt-3 flex gap-4 text-xs text-gray-500">
            <span>Agents: {summary.total_agents}</span>
            {#if p.status === 'paid'}
              <span>Paid: {fmt(summary.total_paid)}</span>
            {:else if p.status === 'active'}
              <span>In progress</span>
            {:else}
              <span>Due: {fmt(summary.total_commission_due)}</span>
            {/if}
          </div>
          {#if isSelected}
            <div class="mt-2 text-xs font-semibold" style="color: #082b67;">Viewing below</div>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Records for selected period -->
    {#if selectedPeriod}
      {@const fieldRecs = selectedPeriod.records.filter((r) => r.agent_type === 'field')}
      {@const leadRecs = selectedPeriod.records.filter((r) => r.agent_type === 'lead')}
      <div class="mb-4">
        <p class="text-sm font-semibold" style="color: #082b67;">
          Records — {fmtPeriod(selectedPeriod.period.start_date, selectedPeriod.period.end_date)}
        </p>
      </div>
      {@render periodBody(fieldRecs, leadRecs)}
    {/if}

    {@render footnote()}
  {/if}
</div>

<!-- ── Shared snippets ──────────────────────────────────────────────────── -->

{#snippet periodBody(fieldRecs: AgentPaymentRecord[], leadRecs: AgentPaymentRecord[])}
  <!-- Section 1: Field Agents -->
  <div class="mb-2">
    <h2 class="text-sm font-semibold" style="color: #082b67;">Field Agent Commission</h2>
  </div>
  {@render fieldTable(fieldRecs)}

  <!-- Section 2: Lead Override -->
  <div class="mb-2 mt-8">
    <h2 class="text-sm font-semibold" style="color: #082b67;">Lead Override Commission</h2>
    <p class="mt-0.5 text-xs text-gray-500">
      Lead commission is calculated as ₦30 per onboarding completed by agents in their team.
    </p>
  </div>
  {@render leadTable(leadRecs)}
{/snippet}

{#snippet fieldTable(records: AgentPaymentRecord[])}
  <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200" style="background: #f8fafc;">
          <th class={thCls}>Agent Name</th>
          <th class={thCls}>Code</th>
          <th class={thCls}>Onboardings</th>
          <th class={thRCls}>Direct Commission</th>
          <th class={thCls}>Payment Rule</th>
          <th class={thCls}>Payment Date</th>
          <th class={thCls}>Status</th>
          <th class={thCls}>Bank Account</th>
        </tr>
      </thead>
      <tbody>
        {#each records as rec (rec.agent_id)}
          {@const pct = Math.min(100, Math.round((rec.completed_onboardings / rec.target) * 100))}
          <tr
            class="border-b border-gray-100 last:border-0"
            style={rec.bank_account === null ? 'background: #fff5f5;' : ''}
          >
            <td class="px-4 py-3 font-medium text-gray-900">{rec.agent_name}</td>
            <td class="px-4 py-3 text-gray-500">{rec.agent_code}</td>
            <td class="px-4 py-3">
              <div class="text-xs text-gray-600 mb-1">{rec.completed_onboardings}/{rec.target}</div>
              <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                <div
                  class="h-1.5 rounded-full"
                  style="width: {pct}%; background-color: {rec.target_met ? '#22c55e' : '#febf26'};"
                ></div>
              </div>
            </td>
            <td class="px-4 py-3 text-right font-medium text-gray-900">{fmt(rec.direct_commission)}</td>
            <td class="px-4 py-3">
              <span
                class="rounded px-2 py-0.5 text-xs font-semibold"
                style={rec.payment_rule === 'biweekly'
                  ? 'background: #febf26; color: #082b67;'
                  : 'background: #f3f4f6; color: #6b7280;'}
              >
                {rec.payment_rule === 'biweekly' ? 'Bi-weekly' : 'Monthly'}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">
              {rec.payment_date ? fmtDate(rec.payment_date) : '-'}
            </td>
            <td class="px-4 py-3">
              <span class="rounded px-2 py-0.5 text-xs font-semibold" style={statusStyle(rec.payment_status)}>
                {statusLabel(rec.payment_status)}
              </span>
            </td>
            <td class="px-4 py-3 text-xs">
              {#if rec.bank_account}
                <span class="font-mono text-gray-600">{rec.bank_account}</span>
              {:else}
                <span class="font-semibold" style="color: #dc2626;">Not set</span>
              {/if}
            </td>
          </tr>
        {/each}
        {#if records.length === 0}
          <tr>
            <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-400">
              No field agent records for this period.
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
{/snippet}

{#snippet leadTable(records: AgentPaymentRecord[])}
  <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200" style="background: #f8fafc;">
          <th class={thCls}>Lead Name</th>
          <th class={thCls}>Code</th>
          <th class={thRCls}>Team Onboardings</th>
          <th class={thRCls}>Override Commission</th>
          <th class={thCls}>Payment Date</th>
          <th class={thCls}>Status</th>
          <th class={thCls}>Bank Account</th>
        </tr>
      </thead>
      <tbody>
        {#each records as rec (rec.agent_id)}
          {@const teamOnboardings = Math.round(rec.override_commission / 30)}
          <tr
            class="border-b border-gray-100 last:border-0"
            style={rec.bank_account === null ? 'background: #fff5f5;' : ''}
          >
            <td class="px-4 py-3 font-medium text-gray-900">{rec.agent_name}</td>
            <td class="px-4 py-3 text-gray-500">{rec.agent_code}</td>
            <td class="px-4 py-3 text-right text-gray-700">{teamOnboardings}</td>
            <td class="px-4 py-3 text-right font-medium" style="color: #5b21b6;">{fmt(rec.override_commission)}</td>
            <td class="px-4 py-3 text-gray-600">
              {rec.payment_date ? fmtDate(rec.payment_date) : '-'}
            </td>
            <td class="px-4 py-3">
              <span class="rounded px-2 py-0.5 text-xs font-semibold" style={statusStyle(rec.payment_status)}>
                {statusLabel(rec.payment_status)}
              </span>
            </td>
            <td class="px-4 py-3 text-xs">
              {#if rec.bank_account}
                <span class="font-mono text-gray-600">{rec.bank_account}</span>
              {:else}
                <span class="font-semibold" style="color: #dc2626;">Not set</span>
              {/if}
            </td>
          </tr>
        {/each}
        {#if records.length === 0}
          <tr>
            <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-400">
              No lead records for this period.
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
{/snippet}

{#snippet footnote()}
  <p class="mt-4 text-xs text-gray-400">
    Rates: Field agent &#8358;100/onboarding, Lead override &#8358;30/onboarding, Contribution &#8358;50/completion, Lead contribution override &#8358;15 -- placeholder rates subject to management confirmation.
  </p>
{/snippet}
