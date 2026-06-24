<script lang="ts">
  import type { PageData } from './$types';
  import type { AgentWithHierarchy, HierarchyNode } from '$lib/types';

  let { data }: { data: PageData } = $props();

  const isBD = $derived(data.role === 'super_admin' || data.role === 'management');
  const isRM = $derived(data.role === 'rm');
  const isManager = $derived(data.role === 'manager');

  // ── BD view state ─────────────────────────────────────────────────────────

  type ViewMode = 'tree' | 'list' | 'region';
  let activeView = $state<ViewMode>('tree');

  let expandedNodes = $state(new Set<string>());

  function toggleNode(id: string) {
    const next = new Set(expandedNodes);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedNodes = next;
  }

  function expandAll() {
    const ids = new Set<string>();
    function collect(nodes: HierarchyNode[]) {
      for (const n of nodes) {
        ids.add(n.agent.id);
        collect(n.children);
      }
    }
    collect(data.hierarchy);
    expandedNodes = ids;
  }

  function collapseAll() {
    expandedNodes = new Set();
  }

  const flatRows = $derived.by(() => {
    function flatten(
      nodes: HierarchyNode[],
      depth: number
    ): Array<{ node: HierarchyNode; depth: number }> {
      const out: Array<{ node: HierarchyNode; depth: number }> = [];
      for (const n of nodes) {
        out.push({ node: n, depth });
        if (expandedNodes.has(n.agent.id)) {
          out.push(...flatten(n.children, depth + 1));
        }
      }
      return out;
    }
    return flatten(data.hierarchy, 0);
  });

  // ── List view state ───────────────────────────────────────────────────────

  let listSearch = $state('');
  let regionFilter = $state('');

  const allAgents = $derived<AgentWithHierarchy[]>([
    ...(data.team.rms ?? []),
    ...(data.team.managers ?? []),
    ...(data.team.leads ?? []),
    ...(data.team.field_agents ?? [])
  ]);

  const regions = $derived(
    [...new Set(allAgents.map((a) => a.region).filter((r): r is string => r !== null))].sort()
  );

  const filteredAgents = $derived(
    allAgents.filter((a) => {
      const q = listSearch.toLowerCase();
      const nameMatch =
        !q ||
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
        a.agent_code.toLowerCase().includes(q);
      const regionMatch = !regionFilter || a.region === regionFilter;
      return nameMatch && regionMatch;
    })
  );

  // ── RM view expansion ─────────────────────────────────────────────────────

  let expandedRM = $state(new Set<string>());

  function toggleRM(id: string) {
    const next = new Set(expandedRM);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedRM = next;
  }

  const leadsByManager = $derived.by(() => {
    const map = new Map<string, AgentWithHierarchy[]>();
    for (const lead of data.team.leads ?? []) {
      if (lead.manager_id) {
        const arr = map.get(lead.manager_id) ?? [];
        arr.push(lead);
        map.set(lead.manager_id, arr);
      }
    }
    return map;
  });

  const agentsByLead = $derived.by(() => {
    const map = new Map<string, AgentWithHierarchy[]>();
    for (const agent of data.team.field_agents ?? []) {
      if (agent.lead_agent_id) {
        const arr = map.get(agent.lead_agent_id) ?? [];
        arr.push(agent);
        map.set(agent.lead_agent_id, arr);
      }
    }
    return map;
  });

  // Nested lead expansion inside manager rows (RM view)
  let expandedLeadsInRM = $state(new Set<string>());

  function toggleLeadInRM(id: string) {
    const next = new Set(expandedLeadsInRM);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedLeadsInRM = next;
  }

  // ── Manager view expansion ─────────────────────────────────────────────────

  let expandedLeads = $state(new Set<string>());

  function toggleLead(id: string) {
    const next = new Set(expandedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedLeads = next;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function typeLabel(type: string): string {
    switch (type) {
      case 'rm': return 'RM';
      case 'manager': return 'Manager';
      case 'lead': return 'Lead';
      case 'field': return 'Field Agent';
      default: return type;
    }
  }

  function typeBadgeClass(type: string): string {
    switch (type) {
      case 'rm': return 'badge-rm';
      case 'manager': return 'badge-manager';
      case 'lead': return 'badge-lead';
      case 'field': return 'badge-field';
      default: return 'badge-field';
    }
  }
</script>

<svelte:head><title>Team | Majestic APA</title></svelte:head>

<div class="p-6 space-y-6">
  <h1 class="text-2xl font-bold text-[#082b67]">Team</h1>

  <!-- ── BD VIEW ──────────────────────────────────────────────────────────── -->

  {#if isBD}
    <!-- Summary cards -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-gray-500">Regional Managers</p>
        <p class="mt-1 text-3xl font-bold text-[#082b67]">{data.team.rms?.length ?? 0}</p>
      </div>
      <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-gray-500">Managers</p>
        <p class="mt-1 text-3xl font-bold text-[#082b67]">{data.team.managers?.length ?? 0}</p>
      </div>
      <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-gray-500">Leads</p>
        <p class="mt-1 text-3xl font-bold text-[#082b67]">{data.team.leads?.length ?? 0}</p>
      </div>
      <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-gray-500">Field Agents</p>
        <p class="mt-1 text-3xl font-bold text-[#082b67]">{data.team.field_agents?.length ?? 0}</p>
      </div>
    </div>

    <!-- View toggle -->
    <div class="flex items-center gap-2">
      {#each (['tree', 'list', 'region'] as ViewMode[]) as view}
        <button
          class="rounded px-4 py-1.5 text-sm font-medium transition-colors
            {activeView === view
              ? 'bg-[#082b67] text-white'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}"
          onclick={() => (activeView = view)}
        >
          {view === 'tree' ? 'Tree' : view === 'list' ? 'List' : 'By Region'}
        </button>
      {/each}
    </div>

    <!-- ── Tree view ── -->
    {#if activeView === 'tree'}
      <div class="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <span class="text-sm font-medium text-gray-700">Hierarchy</span>
          <div class="flex gap-2">
            <button
              class="text-xs text-[#082b67] hover:underline"
              onclick={expandAll}
            >Expand all</button>
            <span class="text-gray-300">|</span>
            <button
              class="text-xs text-[#082b67] hover:underline"
              onclick={collapseAll}
            >Collapse all</button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="py-2 pl-4 pr-2 text-left font-medium text-gray-600">Name</th>
                <th class="py-2 px-3 text-left font-medium text-gray-600">Code</th>
                <th class="py-2 px-3 text-left font-medium text-gray-600">Type</th>
                <th class="py-2 px-3 text-left font-medium text-gray-600">Region</th>
                <th class="py-2 px-3 text-left font-medium text-gray-600">State</th>
                <th class="py-2 px-3 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {#each flatRows as { node, depth }}
                {@const a = node.agent}
                {@const hasChildren = node.children.length > 0}
                {@const expanded = expandedNodes.has(a.id)}
                <tr
                  class="border-b border-gray-50 hover:bg-gray-50 {hasChildren ? 'cursor-pointer' : ''}"
                  onclick={hasChildren ? () => toggleNode(a.id) : undefined}
                >
                  <td class="py-2 pr-2 font-medium text-gray-800" style="padding-left: {1 + depth * 2}rem">
                    {#if hasChildren}
                      <span class="inline-block w-4 text-gray-400 select-none">
                        {expanded ? '-' : '+'}
                      </span>
                    {:else}
                      <span class="inline-block w-4"></span>
                    {/if}
                    {a.first_name}
                    {a.last_name}
                  </td>
                  <td class="py-2 px-3 font-mono text-xs text-gray-600">{a.agent_code}</td>
                  <td class="py-2 px-3">
                    <span class="badge {typeBadgeClass(a.agent_type)}">{typeLabel(a.agent_type)}</span>
                  </td>
                  <td class="py-2 px-3 text-gray-600">{a.region ?? '-'}</td>
                  <td class="py-2 px-3 text-gray-600">{a.state}</td>
                  <td class="py-2 px-3">
                    <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium
                      {a.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}">
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              {/each}
              {#if flatRows.length === 0}
                <tr>
                  <td colspan="6" class="py-8 text-center text-gray-400">No hierarchy data available.</td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- ── List view ── -->
    {#if activeView === 'list'}
      <div class="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div class="flex flex-wrap items-center gap-3 border-b border-gray-200 px-4 py-3">
          <input
            type="search"
            placeholder="Search by name or code..."
            bind:value={listSearch}
            class="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-[#082b67] focus:outline-none"
          />
          <select
            bind:value={regionFilter}
            class="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-[#082b67] focus:outline-none"
          >
            <option value="">All regions</option>
            {#each regions as region}
              <option value={region}>{region}</option>
            {/each}
          </select>
          <span class="text-xs text-gray-400">{filteredAgents.length} agents</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="py-2 pl-4 pr-2 text-left font-medium text-gray-600">Name</th>
                <th class="py-2 px-3 text-left font-medium text-gray-600">Code</th>
                <th class="py-2 px-3 text-left font-medium text-gray-600">Type</th>
                <th class="py-2 px-3 text-left font-medium text-gray-600">Region</th>
                <th class="py-2 px-3 text-left font-medium text-gray-600">State</th>
                <th class="py-2 px-3 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredAgents as a}
                <tr class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="py-2 pl-4 pr-2 font-medium text-gray-800">{a.first_name} {a.last_name}</td>
                  <td class="py-2 px-3 font-mono text-xs text-gray-600">{a.agent_code}</td>
                  <td class="py-2 px-3">
                    <span class="badge {typeBadgeClass(a.agent_type)}">{typeLabel(a.agent_type)}</span>
                  </td>
                  <td class="py-2 px-3 text-gray-600">{a.region ?? '-'}</td>
                  <td class="py-2 px-3 text-gray-600">{a.state}</td>
                  <td class="py-2 px-3">
                    <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium
                      {a.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}">
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              {/each}
              {#if filteredAgents.length === 0}
                <tr>
                  <td colspan="6" class="py-8 text-center text-gray-400">No agents match your search.</td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- ── By Region view ── -->
    {#if activeView === 'region'}
      {#each regions as region}
        {@const regionAgents = allAgents.filter((a) => a.region === region)}
        <div class="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div class="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <span class="font-semibold text-[#082b67]">{region}</span>
            <span class="ml-2 text-xs text-gray-500">{regionAgents.length} agents</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="py-2 pl-4 pr-2 text-left font-medium text-gray-600">Name</th>
                  <th class="py-2 px-3 text-left font-medium text-gray-600">Code</th>
                  <th class="py-2 px-3 text-left font-medium text-gray-600">Type</th>
                  <th class="py-2 px-3 text-left font-medium text-gray-600">State</th>
                  <th class="py-2 px-3 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {#each regionAgents as a}
                  <tr class="border-b border-gray-50 hover:bg-gray-50">
                    <td class="py-2 pl-4 pr-2 font-medium text-gray-800">{a.first_name} {a.last_name}</td>
                    <td class="py-2 px-3 font-mono text-xs text-gray-600">{a.agent_code}</td>
                    <td class="py-2 px-3">
                      <span class="badge {typeBadgeClass(a.agent_type)}">{typeLabel(a.agent_type)}</span>
                    </td>
                    <td class="py-2 px-3 text-gray-600">{a.state}</td>
                    <td class="py-2 px-3">
                      <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium
                        {a.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}">
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/each}
      {#if regions.length === 0}
        <p class="text-gray-400 text-sm">No region data available.</p>
      {/if}
    {/if}
  {/if}

  <!-- ── RM VIEW ────────────────────────────────────────────────────────────── -->

  {#if isRM}
    <!-- Summary cards -->
    <div class="grid grid-cols-3 gap-4">
      <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-gray-500">My Managers</p>
        <p class="mt-1 text-3xl font-bold text-[#082b67]">{data.team.managers?.length ?? 0}</p>
      </div>
      <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-gray-500">Leads</p>
        <p class="mt-1 text-3xl font-bold text-[#082b67]">{data.team.leads?.length ?? 0}</p>
      </div>
      <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-gray-500">Field Agents</p>
        <p class="mt-1 text-3xl font-bold text-[#082b67]">{data.team.field_agents?.length ?? 0}</p>
      </div>
    </div>

    <div class="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-200 px-4 py-3">
        <span class="text-sm font-medium text-gray-700">My Managers</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th class="py-2 pl-4 pr-2 text-left font-medium text-gray-600">Manager</th>
              <th class="py-2 px-3 text-left font-medium text-gray-600">Code</th>
              <th class="py-2 px-3 text-left font-medium text-gray-600">State</th>
              <th class="py-2 px-3 text-left font-medium text-gray-600">Leads</th>
              <th class="py-2 px-3 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {#each data.team.managers ?? [] as mgr}
              {@const mgrLeads = leadsByManager.get(mgr.id) ?? []}
              {@const expanded = expandedRM.has(mgr.id)}
              <tr
                class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onclick={() => toggleRM(mgr.id)}
              >
                <td class="py-2 pl-4 pr-2 font-medium text-gray-800">
                  <span class="inline-block w-4 text-gray-400 select-none">{expanded ? '-' : '+'}</span>
                  {mgr.first_name} {mgr.last_name}
                </td>
                <td class="py-2 px-3 font-mono text-xs text-gray-600">{mgr.agent_code}</td>
                <td class="py-2 px-3 text-gray-600">{mgr.state}</td>
                <td class="py-2 px-3 text-gray-600">{mgrLeads.length}</td>
                <td class="py-2 px-3">
                  <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium
                    {mgr.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}">
                    {mgr.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
              {#if expanded}
                {#each mgrLeads as lead}
                  {@const leadExpanded = expandedLeadsInRM.has(lead.id)}
                  {@const leadAgents = agentsByLead.get(lead.id) ?? []}
                  <tr
                    class="border-b border-gray-50 bg-gray-50/50 hover:bg-gray-50 cursor-pointer"
                    onclick={(e) => { e.stopPropagation(); toggleLeadInRM(lead.id); }}
                  >
                    <td class="py-1.5 pr-2 text-gray-700" style="padding-left: 2.5rem">
                      <span class="inline-block w-4 text-gray-400 select-none">{leadExpanded ? '-' : '+'}</span>
                      <span class="badge badge-lead mr-1">Lead</span>
                      {lead.first_name} {lead.last_name}
                    </td>
                    <td class="py-1.5 px-3 font-mono text-xs text-gray-500">{lead.agent_code}</td>
                    <td class="py-1.5 px-3 text-gray-500">{lead.state}</td>
                    <td class="py-1.5 px-3 text-gray-500">{leadAgents.length} agents</td>
                    <td class="py-1.5 px-3">
                      <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium
                        {lead.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}">
                        {lead.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                  {#if leadExpanded}
                    {#each leadAgents as agent}
                      <tr class="border-b border-gray-50 bg-white hover:bg-gray-50">
                        <td class="py-1.5 pr-2 text-gray-600" style="padding-left: 4rem">
                          <span class="inline-block w-4"></span>
                          <span class="badge badge-field mr-1">Field</span>
                          {agent.first_name} {agent.last_name}
                        </td>
                        <td class="py-1.5 px-3 font-mono text-xs text-gray-500">{agent.agent_code}</td>
                        <td class="py-1.5 px-3 text-gray-500">{agent.state}</td>
                        <td class="py-1.5 px-3"></td>
                        <td class="py-1.5 px-3">
                          <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium
                            {agent.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}">
                            {agent.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                {/each}
              {/if}
            {/each}
            {#if (data.team.managers ?? []).length === 0}
              <tr>
                <td colspan="5" class="py-8 text-center text-gray-400">No managers in your team.</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- ── MANAGER VIEW ───────────────────────────────────────────────────────── -->

  {#if isManager}
    <!-- Summary cards -->
    <div class="grid grid-cols-2 gap-4">
      <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-gray-500">My Leads</p>
        <p class="mt-1 text-3xl font-bold text-[#082b67]">{data.team.leads?.length ?? 0}</p>
      </div>
      <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-gray-500">Field Agents</p>
        <p class="mt-1 text-3xl font-bold text-[#082b67]">{data.team.field_agents?.length ?? 0}</p>
      </div>
    </div>

    <div class="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-200 px-4 py-3">
        <span class="text-sm font-medium text-gray-700">My Leads</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th class="py-2 pl-4 pr-2 text-left font-medium text-gray-600">Lead</th>
              <th class="py-2 px-3 text-left font-medium text-gray-600">Code</th>
              <th class="py-2 px-3 text-left font-medium text-gray-600">State</th>
              <th class="py-2 px-3 text-left font-medium text-gray-600">Agents</th>
              <th class="py-2 px-3 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {#each data.team.leads ?? [] as lead}
              {@const leadAgents = agentsByLead.get(lead.id) ?? []}
              {@const expanded = expandedLeads.has(lead.id)}
              <tr
                class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onclick={() => toggleLead(lead.id)}
              >
                <td class="py-2 pl-4 pr-2 font-medium text-gray-800">
                  <span class="inline-block w-4 text-gray-400 select-none">{expanded ? '-' : '+'}</span>
                  {lead.first_name} {lead.last_name}
                </td>
                <td class="py-2 px-3 font-mono text-xs text-gray-600">{lead.agent_code}</td>
                <td class="py-2 px-3 text-gray-600">{lead.state}</td>
                <td class="py-2 px-3 text-gray-600">{leadAgents.length}</td>
                <td class="py-2 px-3">
                  <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium
                    {lead.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}">
                    {lead.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
              {#if expanded}
                {#each leadAgents as agent}
                  <tr class="border-b border-gray-50 bg-gray-50/50 hover:bg-gray-50">
                    <td class="py-1.5 pr-2 text-gray-600" style="padding-left: 2.5rem">
                      <span class="inline-block w-4"></span>
                      <span class="badge badge-field mr-1">Field</span>
                      {agent.first_name} {agent.last_name}
                    </td>
                    <td class="py-1.5 px-3 font-mono text-xs text-gray-500">{agent.agent_code}</td>
                    <td class="py-1.5 px-3 text-gray-500">{agent.state}</td>
                    <td class="py-1.5 px-3"></td>
                    <td class="py-1.5 px-3">
                      <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium
                        {agent.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}">
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                {/each}
              {/if}
            {/each}
            {#if (data.team.leads ?? []).length === 0}
              <tr>
                <td colspan="5" class="py-8 text-center text-gray-400">No leads in your team.</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Fallback for other roles (should not reach here due to Sidebar guard) -->
  {#if !isBD && !isRM && !isManager}
    <p class="text-gray-500 text-sm">You do not have access to the team view.</p>
  {/if}
</div>

<style>
  .badge {
    display: inline-block;
    border-radius: 9999px;
    padding: 0.1rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .badge-rm {
    background-color: #082b67;
    color: #fff;
  }
  .badge-manager {
    background-color: #1d4ed8;
    color: #fff;
  }
  .badge-lead {
    background-color: #febf26;
    color: #082b67;
  }
  .badge-field {
    background-color: #f3f4f6;
    color: #4b5563;
  }
</style>
