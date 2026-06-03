<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatRole } from '$lib/stores/auth.svelte';
  import type { PageData, ActionData } from './$types';
  import type { Agent, StaffMember } from '$lib/types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // ── Tab state ────────────────────────────────────────────
  type Tab = 'staff' | 'leads' | 'agents';
  let activeTab = $state<Tab>('staff');

  // ── Search state ─────────────────────────────────────────
  let staffSearch = $state('');
  let leadSearch = $state('');
  let agentSearch = $state('');

  // ── Modal state ──────────────────────────────────────────
  type ModalType =
    | 'create-staff' | 'edit-staff' | 'deactivate-staff' | 'reactivate-staff' | 'reset-password'
    | 'create-lead' | 'edit-lead' | 'deactivate-lead' | 'reactivate-lead'
    | 'create-agent' | 'edit-agent' | 'deactivate-agent' | 'reactivate-agent'
    | null;

  let modalType = $state<ModalType>(null);
  let selectedStaff = $state<StaffMember | null>(null);
  let selectedAgent = $state<Agent | null>(null);
  let submitting = $state(false);

  function openModal(type: ModalType, item?: StaffMember | Agent) {
    modalType = type;
    if (type?.includes('staff') || type === 'reset-password') {
      selectedStaff = (item as StaffMember) ?? null;
    } else {
      selectedAgent = (item as Agent) ?? null;
    }
  }

  function closeModal() {
    modalType = null;
    selectedStaff = null;
    selectedAgent = null;
  }

  // Close modal on successful action
  $effect(() => {
    if (form?.success) closeModal();
  });

  // ── Filtered lists ───────────────────────────────────────
  const filteredStaff = $derived(
    data.staff.filter((s) => {
      const q = staffSearch.toLowerCase();
      return (
        !q ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    })
  );

  const filteredLeads = $derived(
    data.leads.filter((l) => {
      const q = leadSearch.toLowerCase();
      return (
        !q ||
        `${l.first_name} ${l.last_name}`.toLowerCase().includes(q) ||
        l.agent_code.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q)
      );
    })
  );

  const filteredAgents = $derived(
    data.agents.filter((a) => {
      const q = agentSearch.toLowerCase();
      return (
        !q ||
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
        a.agent_code.toLowerCase().includes(q) ||
        (a.super_agent_name ?? '').toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q)
      );
    })
  );

  const ROLES = ['super_admin', 'operations', 'compliance', 'internal_audit', 'management'];
  const STATES = ['FCT', 'Lagos', 'Kano', 'Rivers', 'Oyo', 'Kaduna', 'Enugu', 'Delta', 'Edo', 'Borno'];
</script>

<svelte:head>
  <title>Staff — Majestic APA</title>
</svelte:head>

<div class="min-h-full px-8 py-8">
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Staff Management</h1>
      <p class="mt-1 text-sm text-gray-500">Manage internal staff, leads, and agents.</p>
    </div>
    {#if activeTab === 'staff'}
      <button onclick={() => openModal('create-staff')} class="btn-primary">+ Add Staff</button>
    {:else if activeTab === 'leads'}
      <button onclick={() => openModal('create-lead')} class="btn-primary">+ Add Lead</button>
    {:else}
      <button onclick={() => openModal('create-agent')} class="btn-primary">+ Add Agent</button>
    {/if}
  </div>

  <!-- Success / Error banner -->
  {#if form?.error}
    <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {form.error}
    </div>
  {/if}

  <!-- Tabs -->
  <div class="mb-6 flex gap-0 border-b border-gray-200">
    {#each [['staff', 'Internal Staff'], ['leads', 'Leads'], ['agents', 'Agents']] as [key, label]}
      <button
        onclick={() => (activeTab = key as Tab)}
        class="border-b-2 px-5 py-2.5 text-sm font-semibold transition-colors
          {activeTab === key
          ? 'border-navy text-navy'
          : 'border-transparent text-gray-500 hover:text-gray-700'}"
        style={activeTab === key ? 'border-color: #082b67; color: #082b67;' : ''}
      >
        {label}
      </button>
    {/each}
  </div>

  <!-- ── STAFF TAB ── -->
  {#if activeTab === 'staff'}
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div class="border-b border-gray-100 px-5 py-4">
        <input
          type="search"
          placeholder="Search by name, email or role…"
          bind:value={staffSearch}
          class="w-72 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style="--tw-ring-color: #082b67;"
        />
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
            <th class="px-5 py-3">Name</th>
            <th class="px-5 py-3">Email</th>
            <th class="px-5 py-3">Role</th>
            <th class="px-5 py-3">Status</th>
            <th class="px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredStaff as s}
            <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
              <td class="px-5 py-3 font-medium text-gray-800">{s.first_name} {s.last_name}</td>
              <td class="px-5 py-3 text-gray-500">{s.email}</td>
              <td class="px-5 py-3 text-gray-600">{formatRole(s.role)}</td>
              <td class="px-5 py-3">
                <span class="badge {s.is_active ? 'badge-active' : 'badge-inactive'}">
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td class="px-5 py-3">
                <div class="flex gap-2">
                  <button onclick={() => openModal('edit-staff', s)} class="btn-sm">Edit</button>
                  {#if s.is_active}
                    <button onclick={() => openModal('deactivate-staff', s)} class="btn-sm btn-danger">Deactivate</button>
                  {:else}
                    <button onclick={() => openModal('reactivate-staff', s)} class="btn-sm btn-success">Reactivate</button>
                  {/if}
                  <button onclick={() => openModal('reset-password', s)} class="btn-sm">Reset Password</button>
                </div>
              </td>
            </tr>
          {/each}
          {#if filteredStaff.length === 0}
            <tr><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-400">No staff members found.</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- ── LEADS TAB ── -->
  {#if activeTab === 'leads'}
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div class="border-b border-gray-100 px-5 py-4">
        <input
          type="search"
          placeholder="Search by name, code or state…"
          bind:value={leadSearch}
          class="w-72 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style="--tw-ring-color: #082b67;"
        />
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
            <th class="px-5 py-3">Code</th>
            <th class="px-5 py-3">Name</th>
            <th class="px-5 py-3">Phone</th>
            <th class="px-5 py-3">State / LGA</th>
            <th class="px-5 py-3">Status</th>
            <th class="px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredLeads as l}
            <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
              <td class="px-5 py-3 font-mono text-xs font-semibold text-gray-600">{l.agent_code}</td>
              <td class="px-5 py-3 font-medium text-gray-800">{l.first_name} {l.last_name}</td>
              <td class="px-5 py-3 text-gray-500">{l.phone_number}</td>
              <td class="px-5 py-3 text-gray-500">{l.state} / {l.lga}</td>
              <td class="px-5 py-3">
                <span class="badge {l.is_active ? 'badge-active' : 'badge-inactive'}">
                  {l.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td class="px-5 py-3">
                <div class="flex gap-2">
                  <button onclick={() => openModal('edit-lead', l)} class="btn-sm">Edit</button>
                  {#if l.is_active}
                    <button onclick={() => openModal('deactivate-lead', l)} class="btn-sm btn-danger">Deactivate</button>
                  {:else}
                    <button onclick={() => openModal('reactivate-lead', l)} class="btn-sm btn-success">Reactivate</button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
          {#if filteredLeads.length === 0}
            <tr><td colspan="6" class="px-5 py-8 text-center text-sm text-gray-400">No leads found.</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- ── AGENTS TAB ── -->
  {#if activeTab === 'agents'}
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div class="border-b border-gray-100 px-5 py-4">
        <input
          type="search"
          placeholder="Search by name, code or lead…"
          bind:value={agentSearch}
          class="w-72 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style="--tw-ring-color: #082b67;"
        />
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
            <th class="px-5 py-3">Code</th>
            <th class="px-5 py-3">Name</th>
            <th class="px-5 py-3">Lead</th>
            <th class="px-5 py-3">Phone</th>
            <th class="px-5 py-3">State / LGA</th>
            <th class="px-5 py-3">Status</th>
            <th class="px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredAgents as a}
            <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
              <td class="px-5 py-3 font-mono text-xs font-semibold text-gray-600">{a.agent_code}</td>
              <td class="px-5 py-3 font-medium text-gray-800">{a.first_name} {a.last_name}</td>
              <td class="px-5 py-3 text-gray-500">{a.super_agent_name ?? '—'}</td>
              <td class="px-5 py-3 text-gray-500">{a.phone_number}</td>
              <td class="px-5 py-3 text-gray-500">{a.state} / {a.lga}</td>
              <td class="px-5 py-3">
                <span class="badge {a.is_active ? 'badge-active' : 'badge-inactive'}">
                  {a.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td class="px-5 py-3">
                <div class="flex gap-2">
                  <button onclick={() => openModal('edit-agent', a)} class="btn-sm">Edit</button>
                  {#if a.is_active}
                    <button onclick={() => openModal('deactivate-agent', a)} class="btn-sm btn-danger">Deactivate</button>
                  {:else}
                    <button onclick={() => openModal('reactivate-agent', a)} class="btn-sm btn-success">Reactivate</button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
          {#if filteredAgents.length === 0}
            <tr><td colspan="7" class="px-5 py-8 text-center text-sm text-gray-400">No agents found.</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- ═══════════════════════════════════════════════════════════
     MODALS
     ═══════════════════════════════════════════════════════════ -->
{#if modalType !== null}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-40 bg-black/40"
    role="button"
    tabindex="-1"
    aria-label="Close modal"
    onclick={closeModal}
    onkeydown={(e) => e.key === 'Escape' && closeModal()}
  ></div>

  <!-- Modal container -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-xl bg-white shadow-2xl">

      <!-- ── CREATE / EDIT STAFF ── -->
      {#if modalType === 'create-staff' || modalType === 'edit-staff'}
        <div class="border-b border-gray-100 px-6 py-4">
          <h2 class="font-semibold text-gray-800">{modalType === 'create-staff' ? 'Add Staff Member' : 'Edit Staff Member'}</h2>
        </div>
        <form
          method="POST"
          action={modalType === 'create-staff' ? '?/createStaff' : '?/editStaff'}
          use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}
          class="space-y-4 px-6 py-5"
        >
          {#if modalType === 'edit-staff'}
            <input type="hidden" name="id" value={selectedStaff?.id} />
          {/if}
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ms-first_name" class="form-label">First Name</label>
              <input id="ms-first_name" name="first_name" type="text" required class="form-input" value={selectedStaff?.first_name ?? ''} />
            </div>
            <div>
              <label for="ms-last_name" class="form-label">Last Name</label>
              <input id="ms-last_name" name="last_name" type="text" required class="form-input" value={selectedStaff?.last_name ?? ''} />
            </div>
          </div>
          <div>
            <label for="ms-email" class="form-label">Email</label>
            <input id="ms-email" name="email" type="email" required class="form-input" value={selectedStaff?.email ?? ''} />
          </div>
          <div>
            <label for="ms-role" class="form-label">Role</label>
            <select id="ms-role" name="role" required class="form-input">
              {#each ROLES as r}
                <option value={r} selected={selectedStaff?.role === r}>{formatRole(r)}</option>
              {/each}
            </select>
          </div>
          {#if modalType === 'create-staff'}
            <div>
              <label for="ms-password" class="form-label">Password</label>
              <input id="ms-password" name="password" type="password" required minlength="8" class="form-input" placeholder="Min. 8 characters" />
            </div>
          {/if}
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" onclick={closeModal} class="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} class="btn-primary">{submitting ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      {/if}

      <!-- ── DEACTIVATE / REACTIVATE STAFF ── -->
      {#if modalType === 'deactivate-staff' || modalType === 'reactivate-staff'}
        {@const isDeactivate = modalType === 'deactivate-staff'}
        <div class="border-b border-gray-100 px-6 py-4">
          <h2 class="font-semibold text-gray-800">{isDeactivate ? 'Deactivate' : 'Reactivate'} Staff Member</h2>
        </div>
        <form
          method="POST"
          action={isDeactivate ? '?/deactivateStaff' : '?/reactivateStaff'}
          use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}
          class="px-6 py-5"
        >
          <input type="hidden" name="id" value={selectedStaff?.id} />
          <p class="mb-5 text-sm text-gray-600">
            Are you sure you want to {isDeactivate ? 'deactivate' : 'reactivate'}
            <strong>{selectedStaff?.first_name} {selectedStaff?.last_name}</strong>?
            {#if isDeactivate}They will lose access to the dashboard.{/if}
          </p>
          <div class="flex justify-end gap-3">
            <button type="button" onclick={closeModal} class="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} class="{isDeactivate ? 'btn-danger-solid' : 'btn-primary'}">
              {submitting ? 'Saving…' : isDeactivate ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        </form>
      {/if}

      <!-- ── RESET PASSWORD ── -->
      {#if modalType === 'reset-password'}
        <div class="border-b border-gray-100 px-6 py-4">
          <h2 class="font-semibold text-gray-800">Reset Password</h2>
        </div>
        <form
          method="POST"
          action="?/resetPassword"
          use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}
          class="space-y-4 px-6 py-5"
        >
          <input type="hidden" name="id" value={selectedStaff?.id} />
          <p class="text-sm text-gray-500">Setting new password for <strong>{selectedStaff?.first_name} {selectedStaff?.last_name}</strong>.</p>
          <div>
            <label for="rp-password" class="form-label">New Password</label>
            <input id="rp-password" name="password" type="password" required minlength="8" class="form-input" placeholder="Min. 8 characters" />
          </div>
          <div>
            <label for="rp-confirm_password" class="form-label">Confirm Password</label>
            <input id="rp-confirm_password" name="confirm_password" type="password" required minlength="8" class="form-input" placeholder="Repeat password" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" onclick={closeModal} class="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} class="btn-primary">{submitting ? 'Saving…' : 'Reset Password'}</button>
          </div>
        </form>
      {/if}

      <!-- ── CREATE / EDIT LEAD ── -->
      {#if modalType === 'create-lead' || modalType === 'edit-lead'}
        <div class="border-b border-gray-100 px-6 py-4">
          <h2 class="font-semibold text-gray-800">{modalType === 'create-lead' ? 'Add Lead' : 'Edit Lead'}</h2>
        </div>
        <form
          method="POST"
          action={modalType === 'create-lead' ? '?/createLead' : '?/editLead'}
          use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}
          class="space-y-4 px-6 py-5"
        >
          {#if modalType === 'edit-lead'}
            <input type="hidden" name="id" value={selectedAgent?.id} />
          {/if}
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ml-first_name" class="form-label">First Name</label>
              <input id="ml-first_name" name="first_name" type="text" required class="form-input" value={selectedAgent?.first_name ?? ''} />
            </div>
            <div>
              <label for="ml-last_name" class="form-label">Last Name</label>
              <input id="ml-last_name" name="last_name" type="text" required class="form-input" value={selectedAgent?.last_name ?? ''} />
            </div>
          </div>
          <div>
            <label for="ml-phone_number" class="form-label">Phone Number</label>
            <input id="ml-phone_number" name="phone_number" type="tel" required class="form-input" value={selectedAgent?.phone_number ?? ''} />
          </div>
          <div>
            <label for="ml-email" class="form-label">Email <span class="font-normal text-gray-400">(optional)</span></label>
            <input id="ml-email" name="email" type="email" class="form-input" value={selectedAgent?.email ?? ''} />
          </div>
          <div>
            <label for="ml-address" class="form-label">Address</label>
            <input id="ml-address" name="address" type="text" required class="form-input" value={selectedAgent?.address ?? ''} />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ml-state" class="form-label">State</label>
              <select id="ml-state" name="state" required class="form-input">
                {#each STATES as st}
                  <option value={st} selected={selectedAgent?.state === st}>{st}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="ml-lga" class="form-label">LGA</label>
              <input id="ml-lga" name="lga" type="text" required class="form-input" value={selectedAgent?.lga ?? ''} placeholder="Local Government Area" />
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" onclick={closeModal} class="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} class="btn-primary">{submitting ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      {/if}

      <!-- ── DEACTIVATE / REACTIVATE LEAD ── -->
      {#if modalType === 'deactivate-lead' || modalType === 'reactivate-lead'}
        {@const isDeactivate = modalType === 'deactivate-lead'}
        <div class="border-b border-gray-100 px-6 py-4">
          <h2 class="font-semibold text-gray-800">{isDeactivate ? 'Deactivate' : 'Reactivate'} Lead</h2>
        </div>
        <form
          method="POST"
          action={isDeactivate ? '?/deactivateLead' : '?/reactivateLead'}
          use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}
          class="px-6 py-5"
        >
          <input type="hidden" name="id" value={selectedAgent?.id} />
          <p class="mb-5 text-sm text-gray-600">
            Are you sure you want to {isDeactivate ? 'deactivate' : 'reactivate'} lead
            <strong>{selectedAgent?.agent_code} — {selectedAgent?.first_name} {selectedAgent?.last_name}</strong>?
          </p>
          <div class="flex justify-end gap-3">
            <button type="button" onclick={closeModal} class="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} class="{isDeactivate ? 'btn-danger-solid' : 'btn-primary'}">
              {submitting ? 'Saving…' : isDeactivate ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        </form>
      {/if}

      <!-- ── CREATE / EDIT AGENT ── -->
      {#if modalType === 'create-agent' || modalType === 'edit-agent'}
        <div class="border-b border-gray-100 px-6 py-4">
          <h2 class="font-semibold text-gray-800">{modalType === 'create-agent' ? 'Add Agent' : 'Edit Agent'}</h2>
        </div>
        <form
          method="POST"
          action={modalType === 'create-agent' ? '?/createAgent' : '?/editAgent'}
          use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}
          class="space-y-4 px-6 py-5"
        >
          {#if modalType === 'edit-agent'}
            <input type="hidden" name="id" value={selectedAgent?.id} />
          {/if}
          <div>
            <label for="ma-super_agent_id" class="form-label">Lead (Super Agent)</label>
            <select id="ma-super_agent_id" name="super_agent_id" required class="form-input">
              <option value="">— Select a lead —</option>
              {#each data.leads.filter((l) => l.is_active) as l}
                <option value={l.id} selected={selectedAgent?.super_agent_id === l.id}>
                  {l.agent_code} — {l.first_name} {l.last_name}
                </option>
              {/each}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ma-first_name" class="form-label">First Name</label>
              <input id="ma-first_name" name="first_name" type="text" required class="form-input" value={selectedAgent?.first_name ?? ''} />
            </div>
            <div>
              <label for="ma-last_name" class="form-label">Last Name</label>
              <input id="ma-last_name" name="last_name" type="text" required class="form-input" value={selectedAgent?.last_name ?? ''} />
            </div>
          </div>
          <div>
            <label for="ma-phone_number" class="form-label">Phone Number</label>
            <input id="ma-phone_number" name="phone_number" type="tel" required class="form-input" value={selectedAgent?.phone_number ?? ''} />
          </div>
          <div>
            <label for="ma-email" class="form-label">Email <span class="font-normal text-gray-400">(optional)</span></label>
            <input id="ma-email" name="email" type="email" class="form-input" value={selectedAgent?.email ?? ''} />
          </div>
          <div>
            <label for="ma-address" class="form-label">Address</label>
            <input id="ma-address" name="address" type="text" required class="form-input" value={selectedAgent?.address ?? ''} />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ma-state" class="form-label">State</label>
              <select id="ma-state" name="state" required class="form-input">
                {#each STATES as st}
                  <option value={st} selected={selectedAgent?.state === st}>{st}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="ma-lga" class="form-label">LGA</label>
              <input id="ma-lga" name="lga" type="text" required class="form-input" value={selectedAgent?.lga ?? ''} placeholder="Local Government Area" />
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" onclick={closeModal} class="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} class="btn-primary">{submitting ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      {/if}

      <!-- ── DEACTIVATE / REACTIVATE AGENT ── -->
      {#if modalType === 'deactivate-agent' || modalType === 'reactivate-agent'}
        {@const isDeactivate = modalType === 'deactivate-agent'}
        <div class="border-b border-gray-100 px-6 py-4">
          <h2 class="font-semibold text-gray-800">{isDeactivate ? 'Deactivate' : 'Reactivate'} Agent</h2>
        </div>
        <form
          method="POST"
          action={isDeactivate ? '?/deactivateAgent' : '?/reactivateAgent'}
          use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}
          class="px-6 py-5"
        >
          <input type="hidden" name="id" value={selectedAgent?.id} />
          <p class="mb-5 text-sm text-gray-600">
            Are you sure you want to {isDeactivate ? 'deactivate' : 'reactivate'} agent
            <strong>{selectedAgent?.agent_code} — {selectedAgent?.first_name} {selectedAgent?.last_name}</strong>?
          </p>
          <div class="flex justify-end gap-3">
            <button type="button" onclick={closeModal} class="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} class="{isDeactivate ? 'btn-danger-solid' : 'btn-primary'}">
              {submitting ? 'Saving…' : isDeactivate ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        </form>
      {/if}

    </div>
  </div>
{/if}

<style>
  :global(.btn-primary) {
    background-color: #082b67;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    transition: opacity 0.15s;
    cursor: pointer;
    border: none;
  }
  :global(.btn-primary:hover) { opacity: 0.9; }
  :global(.btn-primary:disabled) { opacity: 0.6; cursor: not-allowed; }

  :global(.btn-outline) {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
    cursor: pointer;
    transition: background 0.15s;
  }
  :global(.btn-outline:hover) { background: #f9fafb; }

  :global(.btn-danger-solid) {
    background-color: #dc2626;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  :global(.btn-danger-solid:hover) { opacity: 0.9; }

  :global(.btn-sm) {
    padding: 0.25rem 0.625rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
  }
  :global(.btn-sm:hover) { background: #f3f4f6; }
  :global(.btn-sm.btn-danger) { color: #dc2626; border-color: #fca5a5; }
  :global(.btn-sm.btn-danger:hover) { background: #fef2f2; }
  :global(.btn-sm.btn-success) { color: #16a34a; border-color: #86efac; }
  :global(.btn-sm.btn-success:hover) { background: #f0fdf4; }

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

  :global(.form-label) {
    display: block;
    margin-bottom: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
  }
  :global(.form-input) {
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.5rem 0.875rem;
    font-size: 0.875rem;
    color: #1f2937;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  :global(.form-input:focus) {
    border-color: #082b67;
    box-shadow: 0 0 0 2px rgba(8, 43, 103, 0.15);
  }
</style>
