<script lang="ts">
  import { formatRole } from '$lib/stores/auth.svelte';
  import type { PageData } from './$types';
  import type { AgentCommissionSummary, ContributionLog, LeadCommissionSummary, OnboardingLog, WithdrawalLog } from '$lib/types';

  let { data }: { data: PageData } = $props();

  const staffSummary = $derived(data.staffSummary);
  const agentSummary = $derived(data.agentSummary);
  const onboardingLog = $derived(data.onboardingLog);
  const contributionLog = $derived(data.contributionLog);
  const withdrawalLog = $derived(data.withdrawalLog);
  const agentNetwork = $derived(data.agentNetwork);
  const commissionSummary = $derived(data.commissionSummary ?? null);
  const user = $derived(data.user);

  // ── Tab state ─────────────────────────────────────────────────────────────
  type Tab =
    | 'staff-summary'
    | 'agent-summary'
    | 'onboarding-log'
    | 'contribution-log'
    | 'withdrawal-log'
    | 'agent-network';

  let activeTab = $state<Tab>('staff-summary');

  // ── Log filter state (one set per tab) ────────────────────────────────────
  type LogStatus = 'all' | 'pfa_confirmed' | 'failed' | 'rejected' | 'submitted' | 'initiated';

  let obSearch = $state('');
  let obDateFrom = $state('');
  let obDateTo = $state('');
  let obStatus = $state<LogStatus>('all');

  let ctSearch = $state('');
  let ctDateFrom = $state('');
  let ctDateTo = $state('');
  let ctStatus = $state<LogStatus>('all');

  let wdSearch = $state('');
  let wdDateFrom = $state('');
  let wdDateTo = $state('');
  let wdStatus = $state<LogStatus>('all');

  // ── Agent Network expand ──────────────────────────────────────────────────
  let expandedLeads = $state<Set<string>>(new Set());

  function toggleLead(id: string) {
    const next = new Set(expandedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedLeads = next;
  }

  const canSeeNetwork = $derived(
    user?.role === 'super_admin' || user?.role === 'management'
  );

  // ── Commission state ──────────────────────────────────────────────────────
  const canViewCommission = $derived(
    user?.role === 'super_admin' || user?.role === 'management'
  );

  // Expand state for the commission summary table (separate from network tree)
  let expandedCommLeads = $state<Set<string>>(new Set());

  function toggleCommLead(code: string) {
    const next = new Set(expandedCommLeads);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    expandedCommLeads = next;
  }

  // Fast lookup maps from commission data
  const commByLead = $derived.by<Record<string, LeadCommissionSummary>>(() => {
    if (!commissionSummary) return {};
    return Object.fromEntries(commissionSummary.leads.map((l) => [l.lead_code, l]));
  });

  const commByAgent = $derived.by<Record<string, AgentCommissionSummary>>(() => {
    if (!commissionSummary) return {};
    const map: Record<string, AgentCommissionSummary> = {};
    for (const lead of commissionSummary.leads) {
      for (const agent of lead.agents) {
        map[agent.agent_code] = agent;
      }
    }
    return map;
  });

  function formatNaira(amount: number): string {
    return '₦' + amount.toLocaleString('en-NG');
  }

  // ── Generic log filter — used by $derived.by() for each tab ──────────────
  type LogRecord = {
    timestamp_submitted: string;
    status: string;
    agent_name: string;
    agent_code: string;
    lead_code: string;
    apa_session_id: string;
    pfa_ack_ref: string | null;
  };

  function applyLogFilter<T extends LogRecord>(
    records: T[],
    search: string,
    dateFrom: string,
    dateTo: string,
    status: LogStatus
  ): T[] {
    const q = search.toLowerCase();
    return records.filter((r) => {
      const matchSearch =
        !q ||
        r.agent_name.toLowerCase().includes(q) ||
        r.agent_code.toLowerCase().includes(q) ||
        r.lead_code.toLowerCase().includes(q) ||
        r.apa_session_id.toLowerCase().includes(q) ||
        (r.pfa_ack_ref ?? '').toLowerCase().includes(q);

      const ts = new Date(r.timestamp_submitted);
      const matchFrom = !dateFrom || ts >= new Date(dateFrom);
      const matchTo = !dateTo || ts <= new Date(dateTo + 'T23:59:59Z');

      const matchStatus = status === 'all' || r.status === status;

      return matchSearch && matchFrom && matchTo && matchStatus;
    });
  }

  const filteredOnboarding = $derived.by<OnboardingLog[]>(() =>
    applyLogFilter(onboardingLog, obSearch, obDateFrom, obDateTo, obStatus)
  );

  const filteredContribution = $derived.by<ContributionLog[]>(() =>
    applyLogFilter(contributionLog, ctSearch, ctDateFrom, ctDateTo, ctStatus)
  );

  const filteredWithdrawal = $derived.by<WithdrawalLog[]>(() =>
    applyLogFilter(withdrawalLog, wdSearch, wdDateFrom, wdDateTo, wdStatus)
  );

  // ── "This Month" helper ───────────────────────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  function countThisMonth<T extends { timestamp_submitted: string }>(records: T[]): number {
    return records.filter((r) => r.timestamp_submitted.startsWith(currentMonth)).length;
  }

  // ── Display helpers ───────────────────────────────────────────────────────
  function statusLabel(s: string): string {
    const map: Record<string, string> = {
      pfa_confirmed: 'Confirmed',
      failed: 'Failed',
      rejected: 'Rejected',
      submitted: 'Submitted',
      initiated: 'Initiated'
    };
    return map[s] ?? s;
  }

  function statusCls(s: string): string {
    const map: Record<string, string> = {
      pfa_confirmed: 'status-confirmed',
      failed: 'status-failed',
      rejected: 'status-rejected',
      submitted: 'status-submitted',
      initiated: 'status-initiated'
    };
    return map[s] ?? '';
  }

  const channelLabel: Record<string, string> = {
    android_app: 'Android',
    ios_app: 'iOS',
    ussd: 'USSD',
    offline_sync: 'Offline'
  };

  const productLabel: Record<string, string> = {
    micro_pension: 'Micro Pension',
    voluntary_contribution: 'Voluntary'
  };

  function httpCls(code: number | null): string {
    if (!code) return 'text-gray-300';
    if (code < 300) return 'text-green-600 font-semibold';
    if (code < 500) return 'text-amber-600 font-semibold';
    return 'text-red-600 font-semibold';
  }

  function fmtLogDate(iso: string): string {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });
    const time = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
    return `${date}, ${time} UTC`;
  }

  // Truncate session ID to first 20 chars; full value shown in title
  function truncId(id: string): string {
    return id.length > 20 ? id.slice(0, 20) + '…' : id;
  }

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; restricted?: boolean }[] = [
    { key: 'staff-summary', label: 'Staff Summary' },
    { key: 'agent-summary', label: 'Agent Summary' },
    { key: 'onboarding-log', label: 'Onboarding Log' },
    { key: 'contribution-log', label: 'Contribution Log' },
    { key: 'withdrawal-log', label: 'Withdrawal Log' },
    { key: 'agent-network', label: 'Agent Network', restricted: true }
  ];

  // Status options per log type
  const onboardingStatusOpts = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pfa_confirmed', label: 'Confirmed' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'failed', label: 'Failed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'initiated', label: 'Initiated' }
  ];

  const contributionStatusOpts = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pfa_confirmed', label: 'Confirmed' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'failed', label: 'Failed' },
    { value: 'initiated', label: 'Initiated' }
  ];

  const withdrawalStatusOpts = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pfa_confirmed', label: 'Confirmed' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'initiated', label: 'Initiated' }
  ];
</script>

<svelte:head>
  <title>Reports — Majestic APA</title>
</svelte:head>

<div class="min-h-full px-8 py-8">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
    <p class="mt-1 text-sm text-gray-500">Analytics and operational logs for Majestic APA.</p>
  </div>

  <!-- ── Tab bar ── -->
  <div class="mb-6 flex gap-0 overflow-x-auto border-b border-gray-200">
    {#each tabs as tab}
      {#if !tab.restricted || canSeeNetwork}
        <button
          onclick={() => (activeTab = tab.key)}
          class="shrink-0 border-b-2 px-5 py-2.5 text-sm font-semibold transition-colors
            {activeTab === tab.key
            ? 'border-b-2 text-navy'
            : 'border-transparent text-gray-500 hover:text-gray-700'}"
          style={activeTab === tab.key ? 'border-color: #082b67; color: #082b67;' : ''}
        >
          {tab.label}
        </button>
      {/if}
    {/each}
  </div>

  <!-- ══════════════════════════════════════════════════════════════
       STAFF SUMMARY
       ══════════════════════════════════════════════════════════════ -->
  {#if activeTab === 'staff-summary'}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each staffSummary as row}
        <div class="rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {formatRole(row.role)}
          </p>
          <p class="mt-2 text-3xl font-bold" style="color: #082b67;">{row.total}</p>
          <div class="mt-3 flex gap-4 text-xs">
            <span class="font-medium text-green-600">{row.active} active</span>
            <span class="text-gray-400">{row.inactive} inactive</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- ══════════════════════════════════════════════════════════════
       AGENT SUMMARY
       ══════════════════════════════════════════════════════════════ -->
  {#if activeTab === 'agent-summary'}
    <div class="space-y-6">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {#each [
          { label: 'Total Leads', value: agentSummary.total_leads },
          { label: 'Active Leads', value: agentSummary.active_leads },
          { label: 'Total Agents', value: agentSummary.total_agents },
          { label: 'Active Agents', value: agentSummary.active_agents }
        ] as card}
          <div class="rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">{card.label}</p>
            <p class="mt-2 text-3xl font-bold" style="color: #082b67;">{card.value}</p>
          </div>
        {/each}
      </div>

      <div class="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div class="border-b border-gray-100 px-6 py-4">
          <h2 class="text-sm font-semibold text-gray-700">Distribution by State</h2>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th class="px-6 py-3">State</th>
              <th class="px-6 py-3">Leads</th>
              <th class="px-6 py-3">Agents</th>
              <th class="px-6 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {#each agentSummary.by_state as row}
              <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td class="px-6 py-3 font-medium text-gray-800">{row.state}</td>
                <td class="px-6 py-3 text-gray-600">{row.leads}</td>
                <td class="px-6 py-3 text-gray-600">{row.agents}</td>
                <td class="px-6 py-3 font-semibold text-gray-800">{row.leads + row.agents}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- ══════════════════════════════════════════════════════════════
       ONBOARDING LOG
       ══════════════════════════════════════════════════════════════ -->
  {#if activeTab === 'onboarding-log'}
    <div class="space-y-4">
      <!-- Summary cards -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {#each [
          { label: 'Total Onboardings', value: onboardingLog.length },
          { label: 'Successful', value: onboardingLog.filter(r => r.status === 'pfa_confirmed').length },
          { label: 'Failed', value: onboardingLog.filter(r => r.status === 'failed').length },
          { label: 'This Month', value: countThisMonth(onboardingLog) }
        ] as card}
          <div class="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">{card.label}</p>
            <p class="mt-2 text-2xl font-bold" style="color: #082b67;">{card.value}</p>
          </div>
        {/each}
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <input
          type="search"
          placeholder="Search session ID, agent, lead…"
          bind:value={obSearch}
          class="w-60 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style="--tw-ring-color: #082b67;"
        />
        <div class="flex items-center gap-2">
          <label for="ob-from" class="text-xs font-medium text-gray-500">From</label>
          <input id="ob-from" type="date" bind:value={obDateFrom} class="filter-date" />
        </div>
        <div class="flex items-center gap-2">
          <label for="ob-to" class="text-xs font-medium text-gray-500">To</label>
          <input id="ob-to" type="date" bind:value={obDateTo} class="filter-date" />
        </div>
        <select bind:value={obStatus} class="filter-select">
          {#each onboardingStatusOpts as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table class="w-full whitespace-nowrap text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th class="px-4 py-3">Session ID</th>
              <th class="px-4 py-3">PFA Ack Ref</th>
              <th class="px-4 py-3">PFA</th>
              <th class="px-4 py-3">Channel</th>
              <th class="px-4 py-3">Product</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Error</th>
              <th class="px-4 py-3">Agent</th>
              <th class="px-4 py-3">Lead</th>
              <th class="px-4 py-3">Version</th>
              <th class="px-4 py-3">HTTP</th>
              <th class="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredOnboarding as r}
              <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                <td class="px-4 py-3 font-mono text-xs text-gray-600" title={r.apa_session_id}>
                  {truncId(r.apa_session_id)}
                </td>
                <td class="px-4 py-3 font-mono text-xs text-gray-500">
                  {r.pfa_ack_ref ?? '—'}
                </td>
                <td class="px-4 py-3">
                  <span class="badge badge-pfa">{r.pfa_code}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="badge badge-channel">{channelLabel[r.channel] ?? r.channel}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="badge badge-product">{productLabel[r.product_type] ?? r.product_type}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="badge {statusCls(r.status)}">{statusLabel(r.status)}</span>
                </td>
                <td class="px-4 py-3 font-mono text-xs">
                  {#if r.error_code}
                    <span class="text-red-600">{r.error_code}</span>
                  {:else}
                    <span class="text-gray-300">—</span>
                  {/if}
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-800">{r.agent_name}</div>
                  <div class="font-mono text-xs text-gray-400">{r.agent_code}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-800">{r.lead_name}</div>
                  <div class="font-mono text-xs text-gray-400">{r.lead_code}</div>
                </td>
                <td class="px-4 py-3 text-xs text-gray-400">{r.agent_app_version}</td>
                <td class="px-4 py-3 font-mono text-xs {httpCls(r.http_status)}">
                  {r.http_status ?? '—'}
                </td>
                <td class="px-4 py-3 text-xs text-gray-500">{fmtLogDate(r.timestamp_submitted)}</td>
              </tr>
            {/each}
            {#if filteredOnboarding.length === 0}
              <tr>
                <td colspan="12" class="px-4 py-10 text-center text-sm text-gray-400">
                  No records found.
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
        <div class="border-t border-gray-100 px-5 py-2.5 text-xs text-gray-400">
          {filteredOnboarding.length} of {onboardingLog.length} record{onboardingLog.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  {/if}

  <!-- ══════════════════════════════════════════════════════════════
       CONTRIBUTION LOG
       ══════════════════════════════════════════════════════════════ -->
  {#if activeTab === 'contribution-log'}
    <div class="space-y-4">
      <!-- Summary cards -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {#each [
          { label: 'Total Contributions', value: contributionLog.length },
          { label: 'Confirmed', value: contributionLog.filter(r => r.status === 'pfa_confirmed').length },
          { label: 'Failed / Pending', value: contributionLog.filter(r => r.status === 'failed' || r.status === 'initiated').length },
          { label: 'This Month', value: countThisMonth(contributionLog) }
        ] as card}
          <div class="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">{card.label}</p>
            <p class="mt-2 text-2xl font-bold" style="color: #082b67;">{card.value}</p>
          </div>
        {/each}
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <input
          type="search"
          placeholder="Search session ID, agent, lead…"
          bind:value={ctSearch}
          class="w-60 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style="--tw-ring-color: #082b67;"
        />
        <div class="flex items-center gap-2">
          <label for="ct-from" class="text-xs font-medium text-gray-500">From</label>
          <input id="ct-from" type="date" bind:value={ctDateFrom} class="filter-date" />
        </div>
        <div class="flex items-center gap-2">
          <label for="ct-to" class="text-xs font-medium text-gray-500">To</label>
          <input id="ct-to" type="date" bind:value={ctDateTo} class="filter-date" />
        </div>
        <select bind:value={ctStatus} class="filter-select">
          {#each contributionStatusOpts as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <!-- Table (no Product column — kept in data, not displayed per spec) -->
      <div class="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table class="w-full whitespace-nowrap text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th class="px-4 py-3">Session ID</th>
              <th class="px-4 py-3">PFA Ack Ref</th>
              <th class="px-4 py-3">PFA</th>
              <th class="px-4 py-3">Channel</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Error</th>
              <th class="px-4 py-3">Agent</th>
              <th class="px-4 py-3">Lead</th>
              <th class="px-4 py-3">Version</th>
              <th class="px-4 py-3">HTTP</th>
              <th class="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredContribution as r}
              <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                <td class="px-4 py-3 font-mono text-xs text-gray-600" title={r.apa_session_id}>
                  {truncId(r.apa_session_id)}
                </td>
                <td class="px-4 py-3 font-mono text-xs text-gray-500">
                  {r.pfa_ack_ref ?? '—'}
                </td>
                <td class="px-4 py-3">
                  <span class="badge badge-pfa">{r.pfa_code}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="badge badge-channel">{channelLabel[r.channel] ?? r.channel}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="badge {statusCls(r.status)}">{statusLabel(r.status)}</span>
                </td>
                <td class="px-4 py-3 font-mono text-xs">
                  {#if r.error_code}
                    <span class="text-red-600">{r.error_code}</span>
                  {:else}
                    <span class="text-gray-300">—</span>
                  {/if}
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-800">{r.agent_name}</div>
                  <div class="font-mono text-xs text-gray-400">{r.agent_code}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-800">{r.lead_name}</div>
                  <div class="font-mono text-xs text-gray-400">{r.lead_code}</div>
                </td>
                <td class="px-4 py-3 text-xs text-gray-400">{r.agent_app_version}</td>
                <td class="px-4 py-3 font-mono text-xs {httpCls(r.http_status)}">
                  {r.http_status ?? '—'}
                </td>
                <td class="px-4 py-3 text-xs text-gray-500">{fmtLogDate(r.timestamp_submitted)}</td>
              </tr>
            {/each}
            {#if filteredContribution.length === 0}
              <tr>
                <td colspan="11" class="px-4 py-10 text-center text-sm text-gray-400">
                  No records found.
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
        <div class="border-t border-gray-100 px-5 py-2.5 text-xs text-gray-400">
          {filteredContribution.length} of {contributionLog.length} record{contributionLog.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  {/if}

  <!-- ══════════════════════════════════════════════════════════════
       WITHDRAWAL LOG
       ══════════════════════════════════════════════════════════════ -->
  {#if activeTab === 'withdrawal-log'}
    <div class="space-y-4">
      <!-- Summary cards -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {#each [
          { label: 'Total Withdrawals', value: withdrawalLog.length },
          { label: 'Confirmed', value: withdrawalLog.filter(r => r.status === 'pfa_confirmed').length },
          { label: 'Rejected', value: withdrawalLog.filter(r => r.status === 'rejected').length },
          { label: 'This Month', value: countThisMonth(withdrawalLog) }
        ] as card}
          <div class="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">{card.label}</p>
            <p class="mt-2 text-2xl font-bold" style="color: #082b67;">{card.value}</p>
          </div>
        {/each}
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <input
          type="search"
          placeholder="Search session ID, agent, lead…"
          bind:value={wdSearch}
          class="w-60 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style="--tw-ring-color: #082b67;"
        />
        <div class="flex items-center gap-2">
          <label for="wd-from" class="text-xs font-medium text-gray-500">From</label>
          <input id="wd-from" type="date" bind:value={wdDateFrom} class="filter-date" />
        </div>
        <div class="flex items-center gap-2">
          <label for="wd-to" class="text-xs font-medium text-gray-500">To</label>
          <input id="wd-to" type="date" bind:value={wdDateTo} class="filter-date" />
        </div>
        <select bind:value={wdStatus} class="filter-select">
          {#each withdrawalStatusOpts as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table class="w-full whitespace-nowrap text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th class="px-4 py-3">Session ID</th>
              <th class="px-4 py-3">PFA Ack Ref</th>
              <th class="px-4 py-3">PFA</th>
              <th class="px-4 py-3">Channel</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Error</th>
              <th class="px-4 py-3">Agent</th>
              <th class="px-4 py-3">Lead</th>
              <th class="px-4 py-3">Version</th>
              <th class="px-4 py-3">HTTP</th>
              <th class="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredWithdrawal as r}
              <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                <td class="px-4 py-3 font-mono text-xs text-gray-600" title={r.apa_session_id}>
                  {truncId(r.apa_session_id)}
                </td>
                <td class="px-4 py-3 font-mono text-xs text-gray-500">
                  {r.pfa_ack_ref ?? '—'}
                </td>
                <td class="px-4 py-3">
                  <span class="badge badge-pfa">{r.pfa_code}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="badge badge-channel">{channelLabel[r.channel] ?? r.channel}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="badge {statusCls(r.status)}">{statusLabel(r.status)}</span>
                </td>
                <td class="px-4 py-3 font-mono text-xs">
                  {#if r.error_code}
                    <span class="text-red-600">{r.error_code}</span>
                  {:else}
                    <span class="text-gray-300">—</span>
                  {/if}
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-800">{r.agent_name}</div>
                  <div class="font-mono text-xs text-gray-400">{r.agent_code}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-800">{r.lead_name}</div>
                  <div class="font-mono text-xs text-gray-400">{r.lead_code}</div>
                </td>
                <td class="px-4 py-3 text-xs text-gray-400">{r.agent_app_version}</td>
                <td class="px-4 py-3 font-mono text-xs {httpCls(r.http_status)}">
                  {r.http_status ?? '—'}
                </td>
                <td class="px-4 py-3 text-xs text-gray-500">{fmtLogDate(r.timestamp_submitted)}</td>
              </tr>
            {/each}
            {#if filteredWithdrawal.length === 0}
              <tr>
                <td colspan="11" class="px-4 py-10 text-center text-sm text-gray-400">
                  No records found.
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
        <div class="border-t border-gray-100 px-5 py-2.5 text-xs text-gray-400">
          {filteredWithdrawal.length} of {withdrawalLog.length} record{withdrawalLog.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  {/if}

  <!-- ══════════════════════════════════════════════════════════════
       AGENT NETWORK (super_admin + management only)
       ══════════════════════════════════════════════════════════════ -->
  {#if activeTab === 'agent-network' && canSeeNetwork}
    <div class="space-y-5">

      <!-- ── Summary cards ── -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 {canViewCommission ? 'lg:grid-cols-5' : 'lg:grid-cols-3'}">
        <div class="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">Total Leads</p>
          <p class="mt-2 text-2xl font-bold" style="color: #082b67;">{agentNetwork.length}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">Total Agents</p>
          <p class="mt-2 text-2xl font-bold" style="color: #082b67;">
            {agentNetwork.reduce((s, n) => s + n.agents.length, 0)}
          </p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">Total Onboardings</p>
          <p class="mt-2 text-2xl font-bold" style="color: #082b67;">
            {commissionSummary ? commissionSummary.totals.total_onboardings : '—'}
          </p>
        </div>
        {#if canViewCommission && commissionSummary}
          <div class="rounded-xl border border-green-100 bg-green-50 px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-widest text-green-700">Total Commission</p>
            <p class="mt-2 text-2xl font-bold text-green-700">
              {formatNaira(commissionSummary.totals.grand_total)}
            </p>
          </div>
          <div class="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-widest text-amber-700">Commission Rates</p>
            <p class="mt-2 text-sm font-semibold text-amber-800">
              Agent: {formatNaira(commissionSummary.rates.agent_per_onboarding)}/onboarding
            </p>
            <p class="text-xs text-amber-700">
              Lead: {formatNaira(commissionSummary.rates.lead_override_per_onboarding)}/override
            </p>
            <p class="mt-1 text-xs text-amber-600">Rates are placeholders — subject to management review</p>
          </div>
        {/if}
      </div>

      <!-- ── Lead accordion ── -->
      <div class="space-y-3">
        {#each agentNetwork as node}
          {@const leadComm = commByLead[node.lead.agent_code]}
          <div class="rounded-xl border border-gray-100 bg-white shadow-sm">
            <button
              onclick={() => toggleLead(node.lead.id)}
              class="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-gray-50/50"
            >
              <div class="flex flex-wrap items-center gap-4">
                <span class="font-mono text-xs font-semibold" style="color: #082b67;">{node.lead.agent_code}</span>
                <span class="font-semibold text-gray-800">{node.lead.first_name} {node.lead.last_name}</span>
                <span class="text-xs text-gray-400">{node.lead.state} / {node.lead.lga}</span>
                <span class="badge {node.lead.is_active ? 'badge-active' : 'badge-inactive'}">
                  {node.lead.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div class="flex shrink-0 items-center gap-4">
                <span class="text-xs text-gray-400">{node.agents.length} agent{node.agents.length !== 1 ? 's' : ''}</span>
                {#if canViewCommission && leadComm}
                  <span class="text-xs font-semibold text-green-700">
                    Override: {formatNaira(leadComm.lead_override_commission)}
                  </span>
                {/if}
                <span class="text-sm text-gray-300">{expandedLeads.has(node.lead.id) ? '▲' : '▼'}</span>
              </div>
            </button>

            {#if expandedLeads.has(node.lead.id)}
              <div class="border-t border-gray-100">
                {#each node.agents as agent}
                  {@const agentComm = commByAgent[agent.agent_code]}
                  <div class="flex flex-wrap items-center gap-4 border-b border-gray-50 px-6 py-3 last:border-0 hover:bg-gray-50/30">
                    <span class="w-5 text-gray-200">└</span>
                    <span class="font-mono text-xs font-semibold text-gray-400">{agent.agent_code}</span>
                    <span class="text-sm text-gray-700">{agent.first_name} {agent.last_name}</span>
                    <span class="text-xs text-gray-400">{agent.phone_number}</span>
                    <span class="text-xs text-gray-400">{agent.state} / {agent.lga}</span>
                    <span class="badge {agent.is_active ? 'badge-active' : 'badge-inactive'}">
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {#if canViewCommission && agentComm}
                      <span class="ml-auto text-xs font-semibold text-green-700">
                        {formatNaira(agentComm.total_commission)}
                      </span>
                    {/if}
                  </div>
                {/each}
                {#if node.agents.length === 0}
                  <p class="px-10 py-3 text-sm text-gray-400">No agents under this lead.</p>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- ── Commission Summary card (authorised roles only) ── -->
      {#if canViewCommission && commissionSummary}
        <div class="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-6 py-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="font-semibold text-gray-800">Commission Summary</h2>
                <p class="mt-0.5 text-xs text-gray-400">Based on {commissionSummary.totals.total_onboardings} completed onboardings and {commissionSummary.totals.total_contributions} contributions.</p>
              </div>
              <span class="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Placeholder rates — pending management confirmation
              </span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full whitespace-nowrap text-sm">
              <thead>
                <tr class="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th class="px-6 py-3">Lead / Agent</th>
                  <th class="px-6 py-3">Code</th>
                  <th class="px-6 py-3 text-right">Onboardings</th>
                  <th class="px-6 py-3 text-right">Direct</th>
                  <th class="px-6 py-3 text-right">Override</th>
                  <th class="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {#each commissionSummary.leads as lead}
                  <!-- Lead row (expandable) -->
                  <tr
                    class="cursor-pointer border-b border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                    onclick={() => toggleCommLead(lead.lead_code)}
                  >
                    <td class="px-6 py-3">
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-300">{expandedCommLeads.has(lead.lead_code) ? '▲' : '▼'}</span>
                        <span class="font-semibold text-gray-800">{lead.lead_name}</span>
                        <span class="text-xs text-gray-400">Lead</span>
                      </div>
                    </td>
                    <td class="px-6 py-3 font-mono text-xs font-semibold" style="color: #082b67;">{lead.lead_code}</td>
                    <td class="px-6 py-3 text-right text-gray-700">{lead.total_onboardings}</td>
                    <td class="px-6 py-3 text-right text-gray-400">—</td>
                    <td class="px-6 py-3 text-right font-semibold text-green-700">{formatNaira(lead.lead_override_commission)}</td>
                    <td class="px-6 py-3 text-right font-semibold text-gray-800">{formatNaira(lead.team_total_commission)}</td>
                  </tr>

                  <!-- Agent rows (shown when lead is expanded) -->
                  {#if expandedCommLeads.has(lead.lead_code)}
                    {#each lead.agents as agent}
                      <tr class="border-b border-gray-50 last:border-gray-100 hover:bg-gray-50/40">
                        <td class="py-2.5 pl-12 pr-6 text-gray-700">{agent.agent_name}</td>
                        <td class="px-6 py-2.5 font-mono text-xs text-gray-400">{agent.agent_code}</td>
                        <td class="px-6 py-2.5 text-right text-gray-600">{agent.completed_onboardings}</td>
                        <td class="px-6 py-2.5 text-right font-semibold text-green-700">{formatNaira(agent.direct_commission)}</td>
                        <td class="px-6 py-2.5 text-right text-gray-300">—</td>
                        <td class="px-6 py-2.5 text-right font-semibold text-green-700">{formatNaira(agent.total_commission)}</td>
                      </tr>
                    {/each}
                  {/if}
                {/each}

                <!-- Grand total row -->
                <tr class="border-t-2 border-gray-200">
                  <td class="px-6 py-3 font-bold text-gray-900">Grand Total</td>
                  <td class="px-6 py-3"></td>
                  <td class="px-6 py-3 text-right font-bold text-gray-900">{commissionSummary.totals.total_onboardings}</td>
                  <td class="px-6 py-3 text-right font-bold text-green-700">{formatNaira(commissionSummary.totals.total_agent_commission)}</td>
                  <td class="px-6 py-3 text-right font-bold text-green-700">{formatNaira(commissionSummary.totals.total_lead_commission)}</td>
                  <td class="px-6 py-3 text-right text-lg font-bold text-green-700">{formatNaira(commissionSummary.totals.grand_total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="border-t border-gray-100 px-6 py-3 text-xs text-gray-400">
            Commission export will be available once management confirms final rates.
          </div>
        </div>
      {/if}

    </div>
  {/if}
</div>

<style>
  /* ── Agent Network badges ── */
  :global(.badge) {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  :global(.badge-active)  { background: #dcfce7; color: #16a34a; }
  :global(.badge-inactive){ background: #f3f4f6; color: #9ca3af; }

  /* ── Log status badges ── */
  :global(.status-confirmed) { background: #dcfce7; color: #15803d; }
  :global(.status-failed)    { background: #fee2e2; color: #dc2626; }
  :global(.status-rejected)  { background: #fef3c7; color: #b45309; }
  :global(.status-submitted) { background: #dbeafe; color: #1d4ed8; }
  :global(.status-initiated) { background: #e0e7ff; color: #4338ca; }

  /* ── PFA / Channel / Product badges ── */
  :global(.badge-pfa)     { background: #f1f5f9; color: #475569; font-family: ui-monospace, monospace; }
  :global(.badge-channel) { background: #f0fdf4; color: #166534; }
  :global(.badge-product) { background: #fdf4ff; color: #7e22ce; }

  /* ── Filter controls ── */
  :global(.filter-date) {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.375rem 0.625rem;
    font-size: 0.875rem;
    color: #374151;
    outline: none;
  }
  :global(.filter-date:focus) { border-color: #082b67; }

  :global(.filter-select) {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    color: #374151;
    background: white;
    outline: none;
    cursor: pointer;
  }
  :global(.filter-select:focus) { border-color: #082b67; }
</style>
