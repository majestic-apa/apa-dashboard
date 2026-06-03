<script lang="ts">
  import { formatRole } from '$lib/stores/auth.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const staffSummary = $derived(data.staffSummary);
  const agentSummary = $derived(data.agentSummary);
  const activityLog = $derived(data.activityLog);
  const agentNetwork = $derived(data.agentNetwork);
  const user = $derived(data.user);

  type Tab = 'staff-summary' | 'agent-summary' | 'activity-log' | 'agent-network';
  let activeTab = $state<Tab>('staff-summary');

  // Activity log filters
  let activitySearch = $state('');
  let dateFrom = $state('');
  let dateTo = $state('');
  let viewMode = $state<'summary' | 'detailed'>('detailed');

  // Network expand state
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

  const filteredActivity = $derived(
    activityLog.filter((a) => {
      const q = activitySearch.toLowerCase();
      const matchQ =
        !q ||
        a.customer_name.toLowerCase().includes(q) ||
        a.agent_name.toLowerCase().includes(q) ||
        a.agent_code.toLowerCase().includes(q) ||
        a.rsa_pin.toLowerCase().includes(q) ||
        a.customer_state.toLowerCase().includes(q);

      const date = new Date(a.performed_at);
      const matchFrom = !dateFrom || date >= new Date(dateFrom);
      const matchTo = !dateTo || date <= new Date(dateTo + 'T23:59:59');

      return matchQ && matchFrom && matchTo;
    })
  );

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const tabs: { key: Tab; label: string; restricted?: boolean }[] = [
    { key: 'staff-summary', label: 'Staff Summary' },
    { key: 'agent-summary', label: 'Agent Summary' },
    { key: 'activity-log', label: 'Activity Log' },
    { key: 'agent-network', label: 'Agent Network', restricted: true }
  ];
</script>

<svelte:head>
  <title>Reports — Majestic APA</title>
</svelte:head>

<div class="min-h-full px-8 py-8">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
    <p class="mt-1 text-sm text-gray-500">Analytics and activity data for Majestic APA.</p>
  </div>

  <!-- Tabs -->
  <div class="mb-6 flex gap-0 border-b border-gray-200">
    {#each tabs as tab}
      {#if !tab.restricted || canSeeNetwork}
        <button
          onclick={() => (activeTab = tab.key)}
          class="border-b-2 px-5 py-2.5 text-sm font-semibold transition-colors
            {activeTab === tab.key ? 'border-navy text-navy' : 'border-transparent text-gray-500 hover:text-gray-700'}"
          style={activeTab === tab.key ? 'border-color: #082b67; color: #082b67;' : ''}
        >
          {tab.label}
        </button>
      {/if}
    {/each}
  </div>

  <!-- ── STAFF SUMMARY ── -->
  {#if activeTab === 'staff-summary'}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each staffSummary as row}
        <div class="rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">{formatRole(row.role)}</p>
          <p class="mt-2 text-3xl font-bold" style="color: #082b67;">{row.total}</p>
          <div class="mt-3 flex gap-4 text-xs text-gray-500">
            <span class="text-green-600 font-medium">{row.active} active</span>
            <span class="text-gray-400">{row.inactive} inactive</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- ── AGENT SUMMARY ── -->
  {#if activeTab === 'agent-summary'}
    <div class="space-y-6">
      <!-- Top stats -->
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

      <!-- By state -->
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

  <!-- ── ACTIVITY LOG ── -->
  {#if activeTab === 'activity-log'}
    <div class="space-y-4">
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <input
          type="search"
          placeholder="Search customer, agent, RSA PIN…"
          bind:value={activitySearch}
          class="w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style="--tw-ring-color: #082b67;"
        />
        <div class="flex items-center gap-2">
          <label for="r-date-from" class="text-xs font-medium text-gray-500">From</label>
          <input id="r-date-from" type="date" bind:value={dateFrom} class="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none" />
        </div>
        <div class="flex items-center gap-2">
          <label for="r-date-to" class="text-xs font-medium text-gray-500">To</label>
          <input id="r-date-to" type="date" bind:value={dateTo} class="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none" />
        </div>
        <div class="ml-auto flex gap-1 rounded-lg border border-gray-200 p-1">
          <button
            onclick={() => (viewMode = 'summary')}
            class="rounded px-3 py-1 text-xs font-semibold transition {viewMode === 'summary' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'}"
          >Summary</button>
          <button
            onclick={() => (viewMode = 'detailed')}
            class="rounded px-3 py-1 text-xs font-semibold transition {viewMode === 'detailed' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'}"
          >Detailed</button>
        </div>
      </div>

      <!-- Table -->
      <div class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-x-auto">
        <table class="w-full text-sm whitespace-nowrap">
          <thead>
            <tr class="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th class="px-5 py-3">Date</th>
              <th class="px-5 py-3">Customer</th>
              <th class="px-5 py-3">RSA PIN</th>
              <th class="px-5 py-3">State / LGA</th>
              {#if viewMode === 'detailed'}
                <th class="px-5 py-3">Agent</th>
                <th class="px-5 py-3">Lead</th>
                <th class="px-5 py-3">PFA PIN</th>
              {/if}
            </tr>
          </thead>
          <tbody>
            {#each filteredActivity as a}
              <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td class="px-5 py-3 text-gray-500 text-xs">{fmtDate(a.performed_at)}</td>
                <td class="px-5 py-3">
                  <div class="font-medium text-gray-800">{a.customer_name}</div>
                  <div class="text-xs text-gray-400">{a.customer_phone}</div>
                </td>
                <td class="px-5 py-3 font-mono text-xs font-semibold text-gray-600">{a.rsa_pin}</td>
                <td class="px-5 py-3 text-gray-500">{a.customer_state} / {a.customer_lga}</td>
                {#if viewMode === 'detailed'}
                  <td class="px-5 py-3">
                    <div class="text-gray-700">{a.agent_name}</div>
                    <div class="text-xs text-gray-400 font-mono">{a.agent_code}</div>
                  </td>
                  <td class="px-5 py-3">
                    <div class="text-gray-700">{a.super_agent_name ?? '—'}</div>
                    <div class="text-xs text-gray-400 font-mono">{a.super_agent_code ?? ''}</div>
                  </td>
                  <td class="px-5 py-3 font-mono text-xs text-gray-500">{a.pfa_pin}</td>
                {/if}
              </tr>
            {/each}
            {#if filteredActivity.length === 0}
              <tr><td colspan="7" class="px-5 py-8 text-center text-sm text-gray-400">No activity records match your filters.</td></tr>
            {/if}
          </tbody>
        </table>
        <div class="border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
          {filteredActivity.length} record{filteredActivity.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  {/if}

  <!-- ── AGENT NETWORK ── -->
  {#if activeTab === 'agent-network' && canSeeNetwork}
    <div class="space-y-3">
      {#each agentNetwork as node}
        <div class="rounded-xl border border-gray-100 bg-white shadow-sm">
          <!-- Lead header -->
          <button
            onclick={() => toggleLead(node.lead.id)}
            class="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition"
          >
            <div class="flex items-center gap-4">
              <span class="font-mono text-xs font-semibold" style="color: #082b67;">{node.lead.agent_code}</span>
              <span class="font-semibold text-gray-800">{node.lead.first_name} {node.lead.last_name}</span>
              <span class="text-xs text-gray-400">{node.lead.state} / {node.lead.lga}</span>
              <span class="badge {node.lead.is_active ? 'badge-active' : 'badge-inactive'}">
                {node.lead.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-gray-400">{node.agents.length} agent{node.agents.length !== 1 ? 's' : ''}</span>
              <span class="text-gray-300 text-sm">{expandedLeads.has(node.lead.id) ? '▲' : '▼'}</span>
            </div>
          </button>

          <!-- Agents under this lead -->
          {#if expandedLeads.has(node.lead.id)}
            <div class="border-t border-gray-100">
              {#each node.agents as agent}
                <div class="flex items-center gap-4 border-b border-gray-50 px-6 py-3 last:border-0 hover:bg-gray-50/30">
                  <span class="w-5 text-gray-200">└</span>
                  <span class="font-mono text-xs font-semibold text-gray-400">{agent.agent_code}</span>
                  <span class="text-sm text-gray-700">{agent.first_name} {agent.last_name}</span>
                  <span class="text-xs text-gray-400">{agent.phone_number}</span>
                  <span class="text-xs text-gray-400">{agent.state} / {agent.lga}</span>
                  <span class="badge {agent.is_active ? 'badge-active' : 'badge-inactive'}">
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </span>
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
  {/if}
</div>

<style>
  :global(.badge) {
    display: inline-block;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  :global(.badge-active) { background: #dcfce7; color: #16a34a; }
  :global(.badge-inactive) { background: #f3f4f6; color: #9ca3af; }
</style>
