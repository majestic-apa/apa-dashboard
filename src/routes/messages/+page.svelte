<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import type { PageData, ActionData } from './$types';
  import type { Message, Complaint } from '$lib/types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // ── Tab state ─────────────────────────────────────────────────────────────
  type MainTab = 'inbox' | 'compose' | 'complaints';
  type ComplaintTab = 'mine' | 'all';

  let activeTab = $state<MainTab>('inbox');
  let activeComplaintTab = $state<ComplaintTab>('mine');

  // ── Local reactive copies of server data (updated optimistically) ─────────
  // untrack() signals intentional initial-value capture — we want a mutable
  // local copy, not a derived view of server data.
  let localMessages = $state<Message[]>(untrack(() => data.messages));
  let localComplaints = $state<Complaint[]>(untrack(() => data.complaints));

  // ── Inbox state ───────────────────────────────────────────────────────────
  let expandedMsgId = $state<string | null>(null);
  let typeFilter = $state<'all' | 'announcement' | 'general'>('all');
  let inboxSearch = $state('');

  const localUnread = $derived(localMessages.filter((m) => !m.read).length);

  const visibleMessages = $derived(
    localMessages.filter((m) => {
      const matchesType = typeFilter === 'all' || m.message_type === typeFilter;
      const q = inboxSearch.toLowerCase();
      const matchesSearch =
        !q || m.subject.toLowerCase().includes(q) || m.sender_name.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    })
  );

  function toggleMessage(id: string) {
    expandedMsgId = expandedMsgId === id ? null : id;
  }

  // ── Compose state ─────────────────────────────────────────────────────────
  const canCompose = $derived(
    data.user?.role === 'super_admin' || data.user?.role === 'management'
  );

  let composeSubject = $state('');
  let composeBody = $state('');
  let composeRecipients = $state('all');
  let composeSameGroup = $state(false);
  let composeType = $state('general');
  let composeSent = $state(false);

  // ── Complaints state ──────────────────────────────────────────────────────
  let showComplaintForm = $state(false);
  let complainSubject = $state('');
  let complainBody = $state('');
  let complainSent = $state(false);

  let respondingToId = $state<string | null>(null);
  let respondBody = $state('');

  const myComplaints = $derived(
    localComplaints.filter((c) => c.sender_id === data.user?.id)
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  function statusColor(status: Complaint['status']): string {
    if (status === 'open') return 'bg-red-50 text-red-700';
    if (status === 'in_progress') return 'bg-amber-50 text-amber-700';
    return 'bg-green-50 text-green-700';
  }

  function statusLabel(status: Complaint['status']): string {
    if (status === 'in_progress') return 'In Progress';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function msgTypeBadge(type: string): string {
    if (type === 'announcement') return 'bg-[#082b67] text-white';
    return 'bg-gray-100 text-gray-600';
  }

  function recipientLabel(r: string): string {
    switch (r) {
      case 'all': return 'Everyone';
      case 'rm': return 'Regional Managers';
      case 'manager': return 'Managers';
      case 'lead': return 'Leads';
      case 'field': return 'Field Agents';
      case 'management': return 'Management';
      default: return r;
    }
  }
</script>

<svelte:head><title>Messages | Majestic APA</title></svelte:head>

<div class="min-h-full px-8 py-8">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Messages</h1>
    <p class="mt-1 text-sm text-gray-500">Internal communications and complaints.</p>
  </div>

  <!-- Tab bar -->
  <div class="mb-6 flex gap-0 border-b border-gray-200">
    <button
      class="relative px-5 py-2.5 text-sm font-medium transition-colors
        {activeTab === 'inbox'
          ? 'border-b-2 border-[#082b67] text-[#082b67]'
          : 'text-gray-500 hover:text-gray-700'}"
      onclick={() => (activeTab = 'inbox')}
    >
      Inbox
      {#if localUnread > 0}
        <span class="ml-1.5 inline-block rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
          {localUnread}
        </span>
      {/if}
    </button>

    {#if canCompose}
      <button
        class="relative px-5 py-2.5 text-sm font-medium transition-colors
          {activeTab === 'compose'
            ? 'border-b-2 border-[#082b67] text-[#082b67]'
            : 'text-gray-500 hover:text-gray-700'}"
        onclick={() => { activeTab = 'compose'; composeSent = false; }}
      >
        Compose
      </button>
    {/if}

    <button
      class="relative px-5 py-2.5 text-sm font-medium transition-colors
        {activeTab === 'complaints'
          ? 'border-b-2 border-[#082b67] text-[#082b67]'
          : 'text-gray-500 hover:text-gray-700'}"
      onclick={() => (activeTab = 'complaints')}
    >
      Complaints
    </button>
  </div>

  <!-- ── INBOX ────────────────────────────────────────────────────────────── -->
  {#if activeTab === 'inbox'}
    <!-- Search and filter bar -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <input
        type="search"
        placeholder="Search by subject or sender..."
        bind:value={inboxSearch}
        class="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-[#082b67] focus:outline-none"
      />
      <div class="flex gap-1">
        {#each ['all', 'announcement', 'general'] as f}
          <button
            class="rounded px-3 py-1 text-xs font-medium capitalize transition-colors
              {typeFilter === f
                ? 'bg-[#082b67] text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}"
            onclick={() => (typeFilter = f as typeof typeFilter)}
          >
            {f === 'all' ? 'All' : f === 'announcement' ? 'Announcements' : 'General'}
          </button>
        {/each}
      </div>
      <span class="text-xs text-gray-400">{visibleMessages.length} messages</span>
    </div>

    <!-- Message list -->
    <div class="space-y-2">
      {#each visibleMessages as msg}
        {@const expanded = expandedMsgId === msg.id}
        <div
          class="rounded-lg bg-white border transition-all
            {!msg.read ? 'border-l-4 border-l-[#082b67] border-gray-200' : 'border-gray-200'}
            shadow-sm"
        >
          <!-- Message row (always visible) -->
          <button
            class="w-full px-5 py-3.5 text-left"
            onclick={() => toggleMessage(msg.id)}
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm {!msg.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'} truncate">
                    {msg.subject}
                  </span>
                  <span class="inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {msgTypeBadge(msg.message_type)}">
                    {msg.message_type === 'announcement' ? 'Announcement' : 'General'}
                  </span>
                </div>
                <p class="mt-0.5 text-xs text-gray-500">
                  From {msg.sender_name} &middot; To {recipientLabel(msg.recipients)}
                </p>
                {#if !expanded}
                  <p class="mt-1 text-xs text-gray-400 line-clamp-1">{msg.body}</p>
                {/if}
              </div>
              <div class="shrink-0 text-right">
                <p class="text-xs text-gray-400">{formatDate(msg.created_at)}</p>
                <p class="text-xs text-gray-400">{formatTime(msg.created_at)}</p>
                {#if !msg.read}
                  <span class="mt-1 inline-block h-2 w-2 rounded-full bg-[#082b67]"></span>
                {/if}
              </div>
            </div>
          </button>

          <!-- Expanded body -->
          {#if expanded}
            <div class="border-t border-gray-100 px-5 pb-4 pt-3">
              <p class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{msg.body}</p>
              <div class="mt-4 flex items-center justify-between">
                <p class="text-xs text-gray-400">
                  Sent {formatDate(msg.created_at)} at {formatTime(msg.created_at)}
                  {#if msg.read_at} &middot; Read {formatDate(msg.read_at)}{/if}
                </p>
                {#if !msg.read}
                  <form
                    method="POST"
                    action="?/markRead"
                    use:enhance={({ formData }) => {
                      const id = formData.get('message_id') as string;
                      return async ({ result }) => {
                        if (result.type === 'success') {
                          localMessages = localMessages.map((m) =>
                            m.id === id ? { ...m, read: true, read_at: new Date().toISOString() } : m
                          );
                        }
                      };
                    }}
                  >
                    <input type="hidden" name="message_id" value={msg.id} />
                    <button
                      type="submit"
                      class="rounded border border-[#082b67] px-3 py-1 text-xs font-medium text-[#082b67] hover:bg-[#082b67] hover:text-white transition-colors"
                    >
                      Mark as read
                    </button>
                  </form>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/each}

      {#if visibleMessages.length === 0}
        <div class="rounded-lg bg-white border border-gray-200 px-5 py-12 text-center shadow-sm">
          <p class="text-gray-400 text-sm">No messages found.</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- ── COMPOSE ───────────────────────────────────────────────────────────── -->
  {#if activeTab === 'compose' && canCompose}
    <div class="max-w-2xl">
      {#if composeSent}
        <div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Message sent successfully.
        </div>
      {/if}

      {#if form?.action === 'send' && form.error}
        <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {form.error}
        </div>
      {/if}

      <form
        method="POST"
        action="?/send"
        class="space-y-4"
        use:enhance={() => {
          return async ({ result, update }) => {
            if (result.type === 'success') {
              composeSent = true;
              composeSubject = '';
              composeBody = '';
              composeRecipients = 'all';
              composeSameGroup = false;
              composeType = 'general';
            }
            await update({ reset: false });
          };
        }}
      >
        <!-- Subject -->
        <div>
          <label for="compose-subject" class="block text-sm font-medium text-gray-700 mb-1">
            Subject <span class="text-red-500">*</span>
          </label>
          <input
            id="compose-subject"
            name="subject"
            type="text"
            required
            bind:value={composeSubject}
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#082b67] focus:outline-none"
            placeholder="Enter message subject"
          />
        </div>

        <!-- Body -->
        <div>
          <label for="compose-body" class="block text-sm font-medium text-gray-700 mb-1">
            Message <span class="text-red-500">*</span>
          </label>
          <textarea
            id="compose-body"
            name="body"
            required
            minlength="10"
            rows="6"
            bind:value={composeBody}
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#082b67] focus:outline-none resize-none"
            placeholder="Type your message here..."
          ></textarea>
        </div>

        <!-- Send to -->
        <div>
          <label for="compose-recipients" class="block text-sm font-medium text-gray-700 mb-1">
            Send to <span class="text-red-500">*</span>
          </label>
          <select
            id="compose-recipients"
            name="recipients"
            bind:value={composeRecipients}
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#082b67] focus:outline-none"
          >
            <option value="all">Everyone</option>
            <option value="rm">Regional Managers only</option>
            <option value="manager">Managers only</option>
            <option value="lead">Leads only</option>
            <option value="field">Field Agents only</option>
          </select>
        </div>

        <!-- Message type -->
        <fieldset class="border-0 p-0 m-0">
          <legend class="text-sm font-medium text-gray-700 mb-2">Message type</legend>
          <div class="flex gap-4">
            <label for="msg-type-general" class="flex items-center gap-2 cursor-pointer">
              <input
                id="msg-type-general"
                type="radio"
                name="message_type"
                value="general"
                bind:group={composeType}
                class="accent-[#082b67]"
              />
              <span class="text-sm text-gray-700">General</span>
            </label>
            <label for="msg-type-announcement" class="flex items-center gap-2 cursor-pointer">
              <input
                id="msg-type-announcement"
                type="radio"
                name="message_type"
                value="announcement"
                bind:group={composeType}
                class="accent-[#082b67]"
              />
              <span class="text-sm text-gray-700">Announcement</span>
            </label>
          </div>
        </fieldset>

        <!-- Same group only -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="same_group_only"
            value="true"
            bind:checked={composeSameGroup}
            class="accent-[#082b67]"
          />
          <span class="text-sm text-gray-700">Send only to people in my group</span>
        </label>

        <!-- Hidden field for same_group_only value -->
        <input type="hidden" name="same_group_only" value={composeSameGroup ? 'true' : 'false'} />

        <div class="pt-2">
          <button type="submit" class="btn-primary">Send Message</button>
        </div>
      </form>
    </div>
  {/if}

  <!-- ── COMPLAINTS ─────────────────────────────────────────────────────────── -->
  {#if activeTab === 'complaints'}
    <!-- Sub-tab bar -->
    <div class="mb-5 flex gap-0 border-b border-gray-200">
      <button
        class="px-4 py-2 text-sm font-medium transition-colors
          {activeComplaintTab === 'mine'
            ? 'border-b-2 border-[#082b67] text-[#082b67]'
            : 'text-gray-500 hover:text-gray-700'}"
        onclick={() => { activeComplaintTab = 'mine'; showComplaintForm = false; complainSent = false; }}
      >
        My Complaints
      </button>
      {#if data.canViewComplaints}
        <button
          class="px-4 py-2 text-sm font-medium transition-colors
            {activeComplaintTab === 'all'
              ? 'border-b-2 border-[#082b67] text-[#082b67]'
              : 'text-gray-500 hover:text-gray-700'}"
          onclick={() => { activeComplaintTab = 'all'; respondingToId = null; }}
        >
          All Complaints
        </button>
      {/if}
    </div>

    <!-- My Complaints -->
    {#if activeComplaintTab === 'mine'}
      <div class="max-w-2xl space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">
            {myComplaints.length} complaint{myComplaints.length !== 1 ? 's' : ''} submitted
          </p>
          <button
            class="btn-primary text-sm"
            onclick={() => { showComplaintForm = !showComplaintForm; complainSent = false; }}
          >
            {showComplaintForm ? 'Cancel' : '+ New Complaint'}
          </button>
        </div>

        {#if complainSent}
          <div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Complaint submitted. We will review it and get back to you shortly.
          </div>
        {/if}

        {#if form?.action === 'complaint' && form.error}
          <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {form.error}
          </div>
        {/if}

        <!-- New complaint form -->
        {#if showComplaintForm}
          <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
            <h3 class="mb-4 text-sm font-semibold text-gray-800">Submit a Complaint</h3>
            <form
              method="POST"
              action="?/complaint"
              class="space-y-3"
              use:enhance={() => {
                return async ({ result, update }) => {
                  if (result.type === 'success') {
                    complainSent = true;
                    showComplaintForm = false;
                    complainSubject = '';
                    complainBody = '';
                  }
                  await update({ reset: false });
                };
              }}
            >
              <div>
                <label for="cmp-subject" class="block text-xs font-medium text-gray-600 mb-1">
                  Subject <span class="text-red-500">*</span>
                </label>
                <input
                  id="cmp-subject"
                  name="subject"
                  type="text"
                  required
                  bind:value={complainSubject}
                  class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#082b67] focus:outline-none"
                  placeholder="Brief description of your issue"
                />
              </div>
              <div>
                <label for="cmp-body" class="block text-xs font-medium text-gray-600 mb-1">
                  Details <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="cmp-body"
                  name="body"
                  required
                  rows="4"
                  bind:value={complainBody}
                  class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#082b67] focus:outline-none resize-none"
                  placeholder="Describe your complaint in detail..."
                ></textarea>
              </div>
              <button type="submit" class="btn-primary text-sm">Submit Complaint</button>
            </form>
          </div>
        {/if}

        <!-- My complaint list -->
        {#each myComplaints as c}
          <div class="rounded-lg bg-white border border-gray-200 p-5 shadow-sm space-y-2">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-medium text-gray-800 text-sm">{c.subject}</p>
                <p class="text-xs text-gray-400 mt-0.5">{formatDate(c.created_at)}</p>
              </div>
              <span class="inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {statusColor(c.status)}">
                {statusLabel(c.status)}
              </span>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">{c.body}</p>
            {#if c.response}
              <div class="rounded-lg bg-gray-50 border border-gray-100 p-3 mt-2">
                <p class="text-xs font-medium text-gray-500 mb-1">
                  Response from {c.responded_by}
                  {#if c.responded_at} &middot; {formatDate(c.responded_at)}{/if}
                </p>
                <p class="text-sm text-gray-700">{c.response}</p>
              </div>
            {/if}
          </div>
        {/each}

        {#if myComplaints.length === 0 && !showComplaintForm}
          <div class="rounded-lg bg-white border border-gray-200 px-5 py-12 text-center shadow-sm">
            <p class="text-gray-400 text-sm">You have not submitted any complaints.</p>
            <button
              class="mt-3 text-sm text-[#082b67] hover:underline font-medium"
              onclick={() => (showComplaintForm = true)}
            >
              Submit a complaint
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- All Complaints (BD only) -->
    {#if activeComplaintTab === 'all' && data.canViewComplaints}
      <div class="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="py-2.5 pl-4 pr-2 text-left font-medium text-gray-600">Name</th>
                <th class="py-2.5 px-3 text-left font-medium text-gray-600">Code</th>
                <th class="py-2.5 px-3 text-left font-medium text-gray-600">Subject</th>
                <th class="py-2.5 px-3 text-left font-medium text-gray-600">Status</th>
                <th class="py-2.5 px-3 text-left font-medium text-gray-600">Date</th>
                <th class="py-2.5 px-3 text-left font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {#each localComplaints as c}
                <tr class="border-b border-gray-50 align-top">
                  <td class="py-3 pl-4 pr-2 font-medium text-gray-800">{c.sender_name}</td>
                  <td class="py-3 px-3 font-mono text-xs text-gray-500">{c.sender_code}</td>
                  <td class="py-3 px-3 text-gray-700 max-w-xs">
                    <p class="font-medium">{c.subject}</p>
                    <p class="text-xs text-gray-400 line-clamp-2 mt-0.5">{c.body}</p>
                  </td>
                  <td class="py-3 px-3">
                    <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {statusColor(c.status)}">
                      {statusLabel(c.status)}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-xs text-gray-500">{formatDate(c.created_at)}</td>
                  <td class="py-3 px-3">
                    {#if c.status !== 'resolved'}
                      <button
                        class="text-xs font-medium text-[#082b67] hover:underline"
                        onclick={() => {
                          respondingToId = respondingToId === c.id ? null : c.id;
                          respondBody = '';
                        }}
                      >
                        {respondingToId === c.id ? 'Cancel' : 'Respond'}
                      </button>
                    {:else}
                      <span class="text-xs text-gray-400">Resolved</span>
                    {/if}
                  </td>
                </tr>

                <!-- Inline response form -->
                {#if respondingToId === c.id}
                  <tr class="bg-gray-50 border-b border-gray-100">
                    <td colspan="6" class="px-4 py-3">
                      {#if form?.action === 'respond' && form.error}
                        <p class="mb-2 text-xs text-red-600">{form.error}</p>
                      {/if}
                      <form
                        method="POST"
                        action="?/respond"
                        class="flex gap-3 items-end"
                        use:enhance={({ formData }) => {
                          const cId = formData.get('complaint_id') as string;
                          const resp = formData.get('response') as string;
                          return async ({ result, update }) => {
                            if (result.type === 'success') {
                              const responderName = data.user
                                ? `${data.user.first_name} ${data.user.last_name}`
                                : 'Admin';
                              localComplaints = localComplaints.map((complaint) =>
                                complaint.id === cId
                                  ? {
                                      ...complaint,
                                      status: 'resolved' as const,
                                      response: resp,
                                      responded_by: responderName,
                                      responded_at: new Date().toISOString()
                                    }
                                  : complaint
                              );
                              respondingToId = null;
                              respondBody = '';
                            }
                            await update({ reset: false });
                          };
                        }}
                      >
                        <input type="hidden" name="complaint_id" value={c.id} />
                        <div class="flex-1">
                          <label for="respond-{c.id}" class="block text-xs font-medium text-gray-600 mb-1">
                            Response to {c.sender_name}
                          </label>
                          <textarea
                            id="respond-{c.id}"
                            name="response"
                            required
                            rows="2"
                            bind:value={respondBody}
                            class="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-[#082b67] focus:outline-none resize-none"
                            placeholder="Type your response..."
                          ></textarea>
                        </div>
                        <button type="submit" class="btn-primary text-xs shrink-0">Send Response</button>
                      </form>
                    </td>
                  </tr>
                {/if}
              {/each}

              {#if localComplaints.length === 0}
                <tr>
                  <td colspan="6" class="py-10 text-center text-gray-400 text-sm">
                    No complaints have been submitted.
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  {/if}
</div>
