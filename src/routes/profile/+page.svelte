<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import { formatRole } from '$lib/stores/auth.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // ── Profile form state ────────────────────────────────────────────────────
  let first_name = $state(untrack(() => data.profile.first_name));
  let last_name = $state(untrack(() => data.profile.last_name));
  let email = $state(untrack(() => data.profile.email));

  let profileSubmitting = $state(false);
  let passwordSubmitting = $state(false);

  $effect(() => {
    if (form?.success && form.action === 'updateProfile') {
      first_name = (form as { first_name: string }).first_name ?? first_name;
      last_name = (form as { last_name: string }).last_name ?? last_name;
      email = (form as { email: string }).email ?? email;
    }
  });

  const profileSuccess = $derived(form?.success && form.action === 'updateProfile');
  const passwordSuccess = $derived(form?.success && form.action === 'changePassword');
  const profileError = $derived(!form?.success && form?.action === 'updateProfile' ? form?.error : null);
  const passwordError = $derived(!form?.success && form?.action === 'changePassword' ? form?.error : null);

  // ── Bank account state ────────────────────────────────────────────────────
  let showBankEdit = $state(false);
  let bankSubmitting = $state(false);

  const bankSuccess = $derived((form as Record<string, unknown> | null)?.bankSuccess as string | undefined);
  const bankError = $derived((form as Record<string, unknown> | null)?.bankError as string | undefined);

  $effect(() => {
    if (bankSuccess) showBankEdit = false;
  });

  function maskAccount(num: string): string {
    return '****' + num.slice(-4);
  }

  function bankStatus(b: typeof data.bankAccount): { label: string; color: string } {
    if (b.flagged_for_update) return { label: 'Flagged for Update', color: '#b45309' };
    if (b.is_verified) return { label: 'Verified', color: '#15803d' };
    return { label: 'Pending Verification', color: '#b45309' };
  }

  // ── Complaint state ───────────────────────────────────────────────────────
  let complaintSubmitting = $state(false);

  const complaintSuccess = $derived(
    (form as Record<string, unknown> | null)?.complaintSuccess as string | undefined
  );
  const complaintError = $derived(
    (form as Record<string, unknown> | null)?.complaintError as string | undefined
  );

  // ── Termination state ─────────────────────────────────────────────────────
  let terminateSubmitting = $state(false);
  let terminateConfirmed = $state(false);

  const currentTermination = $derived(data.terminations[0] ?? null);

  const terminateSuccess = $derived(
    (form as Record<string, unknown> | null)?.terminateSuccess as string | undefined
  );
  const terminateError = $derived(
    (form as Record<string, unknown> | null)?.terminateError as string | undefined
  );

  // Min effective date: 30 days from today (static per page load, which is correct)
  const minTermDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  })();

  function termStatusStyle(status: string): string {
    switch (status) {
      case 'pending': return 'background:#fef3c7;color:#b45309;';
      case 'acknowledged': return 'background:#dbeafe;color:#1d4ed8;';
      case 'approved': return 'background:#dcfce7;color:#15803d;';
      case 'rejected': return 'background:#fee2e2;color:#dc2626;';
      default: return 'background:#f3f4f6;color:#6b7280;';
    }
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Profile — Majestic APA</title>
</svelte:head>

<div class="min-h-full px-8 py-8">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
    <p class="mt-1 text-sm text-gray-500">Manage your account details and password.</p>
  </div>

  <!-- ── Account Details + Change Password (2-col grid) ────────────────── -->
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Profile details card -->
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div class="border-b border-gray-100 px-6 py-4">
        <h2 class="font-semibold text-gray-800">Account Details</h2>
      </div>
      <div class="px-6 py-6">
        <div class="mb-5 flex items-center gap-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
            style="background-color: #082b67;"
          >
            {data.profile.first_name.charAt(0)}{data.profile.last_name.charAt(0)}
          </div>
          <div>
            <p class="font-semibold text-gray-800">{data.profile.first_name} {data.profile.last_name}</p>
            <p class="text-xs text-gray-400">{formatRole(data.profile.role)}</p>
          </div>
        </div>

        {#if profileSuccess}
          <div class="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Profile updated successfully.
          </div>
        {/if}
        {#if profileError}
          <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {profileError}
          </div>
        {/if}

        <form
          method="POST"
          action="?/updateProfile"
          use:enhance={() => {
            profileSubmitting = true;
            return async ({ update }) => {
              await update({ reset: false });
              profileSubmitting = false;
            };
          }}
          class="space-y-4"
        >
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="p-first_name" class="form-label">First Name</label>
              <input id="p-first_name" name="first_name" type="text" required bind:value={first_name} class="form-input" />
            </div>
            <div>
              <label for="p-last_name" class="form-label">Last Name</label>
              <input id="p-last_name" name="last_name" type="text" required bind:value={last_name} class="form-input" />
            </div>
          </div>
          <div>
            <label for="p-email" class="form-label">Email Address</label>
            <input id="p-email" name="email" type="email" required bind:value={email} class="form-input" />
          </div>
          <div>
            <label for="p-role" class="form-label">Role</label>
            <input
              id="p-role"
              type="text"
              value={formatRole(data.profile.role)}
              disabled
              class="form-input bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-400">Role can only be changed by a Super Admin.</p>
          </div>
          <div class="pt-2">
            <button type="submit" disabled={profileSubmitting} class="btn-primary">
              {profileSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Change password card -->
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div class="border-b border-gray-100 px-6 py-4">
        <h2 class="font-semibold text-gray-800">Change Password</h2>
      </div>
      <div class="px-6 py-6">
        {#if passwordSuccess}
          <div class="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Password changed successfully.
          </div>
        {/if}
        {#if passwordError}
          <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {passwordError}
          </div>
        {/if}

        <form
          method="POST"
          action="?/changePassword"
          use:enhance={() => {
            passwordSubmitting = true;
            return async ({ update }) => {
              await update();
              passwordSubmitting = false;
            };
          }}
          class="space-y-4"
        >
          <div>
            <label for="p-current_password" class="form-label">Current Password</label>
            <input id="p-current_password" name="current_password" type="password" required class="form-input" placeholder="Your current password" />
          </div>
          <div>
            <label for="p-new_password" class="form-label">New Password</label>
            <input id="p-new_password" name="new_password" type="password" required minlength="8" class="form-input" placeholder="Min. 8 characters" />
          </div>
          <div>
            <label for="p-confirm_password" class="form-label">Confirm New Password</label>
            <input id="p-confirm_password" name="confirm_password" type="password" required minlength="8" class="form-input" placeholder="Repeat new password" />
          </div>
          <div class="pt-2">
            <button type="submit" disabled={passwordSubmitting} class="btn-primary">
              {passwordSubmitting ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- ── Bank Account for Commission Payment ───────────────────────────── -->
  <div class="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm">
    <div class="border-b border-gray-100 px-6 py-4">
      <h2 class="font-semibold text-gray-800">Bank Account for Commission Payment</h2>
    </div>
    <div class="px-6 py-6">
      {#if bankSuccess}
        <div class="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {bankSuccess}
        </div>
      {/if}
      {#if bankError}
        <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bankError}
        </div>
      {/if}

      {#if data.bankAccount.flagged_for_update}
        <div class="mb-4 rounded-md border px-4 py-3 text-sm" style="background:#fffbeb;border-color:#fde68a;color:#92400e;">
          Your bank account update is being processed by finance. This usually takes 2 business days.
        </div>
      {/if}

      <!-- Read-only display -->
      {#if !showBankEdit}
        {@const st = bankStatus(data.bankAccount)}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p class="form-label">Bank Name</p>
            <p class="text-sm font-medium text-gray-800">{data.bankAccount.bank_name}</p>
          </div>
          <div>
            <p class="form-label">Account Number</p>
            <p class="font-mono text-sm font-medium text-gray-800">{maskAccount(data.bankAccount.account_number)}</p>
          </div>
          <div>
            <p class="form-label">Account Name</p>
            <p class="text-sm font-medium text-gray-800">{data.bankAccount.account_name}</p>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <p class="form-label mb-0">Status</p>
            <span class="rounded px-2 py-0.5 text-xs font-semibold" style="background:{st.color}1a;color:{st.color};">
              {st.label}
            </span>
          </div>
          <button
            type="button"
            onclick={() => (showBankEdit = true)}
            class="btn-secondary"
          >
            Edit Bank Account
          </button>
        </div>

      <!-- Edit form -->
      {:else}
        <div class="mb-4 rounded-md border px-4 py-3 text-sm" style="background:#fffbeb;border-color:#fde68a;color:#92400e;">
          Changing your bank account will flag it for verification by finance. Commission payments will be held until verified.
        </div>
        <form
          method="POST"
          action="?/updateBank"
          use:enhance={() => {
            bankSubmitting = true;
            return async ({ update, result }) => {
              await update({ reset: false });
              bankSubmitting = false;
              if (result.type === 'success') showBankEdit = false;
            };
          }}
          class="space-y-4"
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label for="b-bank_name" class="form-label">Bank Name</label>
              <input
                id="b-bank_name"
                name="bank_name"
                type="text"
                required
                value={data.bankAccount.bank_name}
                class="form-input"
                placeholder="e.g. First Bank of Nigeria"
              />
            </div>
            <div>
              <label for="b-account_number" class="form-label">Account Number</label>
              <input
                id="b-account_number"
                name="account_number"
                type="text"
                required
                pattern="\d{10}"
                title="Account number must be exactly 10 digits"
                maxlength="10"
                class="form-input font-mono"
                placeholder="10-digit account number"
              />
            </div>
            <div>
              <label for="b-account_name" class="form-label">Account Name</label>
              <input
                id="b-account_name"
                name="account_name"
                type="text"
                required
                value={data.bankAccount.account_name}
                class="form-input"
                placeholder="Name as it appears on the account"
              />
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="submit" disabled={bankSubmitting} class="btn-primary">
              {bankSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onclick={() => (showBankEdit = false)}
              class="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>

  <!-- ── Submit a Complaint ─────────────────────────────────────────────── -->
  <div class="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm">
    <div class="border-b border-gray-100 px-6 py-4">
      <h2 class="font-semibold text-gray-800">Submit a Complaint</h2>
      <p class="mt-0.5 text-xs text-gray-400">Have an issue? Let management know.</p>
    </div>
    <div class="px-6 py-6">
      {#if complaintSuccess}
        <div class="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {complaintSuccess} You can track it in Messages &gt; Complaints.
        </div>
      {:else}
        {#if complaintError}
          <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {complaintError}
          </div>
        {/if}
        <form
          method="POST"
          action="?/quickComplaint"
          use:enhance={() => {
            complaintSubmitting = true;
            return async ({ update }) => {
              await update();
              complaintSubmitting = false;
            };
          }}
          class="space-y-4"
        >
          <div>
            <label for="c-subject" class="form-label">Subject</label>
            <input
              id="c-subject"
              name="subject"
              type="text"
              required
              class="form-input"
              placeholder="Brief description of the issue"
            />
          </div>
          <div>
            <label for="c-body" class="form-label">Message</label>
            <textarea
              id="c-body"
              name="body"
              required
              minlength="20"
              rows="4"
              class="form-input resize-none"
              placeholder="Describe your complaint in detail (min. 20 characters)"
            ></textarea>
          </div>
          <div class="pt-2">
            <button type="submit" disabled={complaintSubmitting} class="btn-primary">
              {complaintSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>

  <!-- ── Termination Letter ─────────────────────────────────────────────── -->
  <div class="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm">
    <div class="border-b border-gray-100 px-6 py-4">
      <h2 class="font-semibold text-gray-800">Termination Letter</h2>
      <p class="mt-0.5 text-xs text-gray-400">Submit a formal resignation from your role.</p>
    </div>
    <div class="px-6 py-6">
      {#if terminateSuccess}
        <div class="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {terminateSuccess}
        </div>
      {/if}
      {#if terminateError}
        <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {terminateError}
        </div>
      {/if}

      {#if currentTermination}
        <!-- Status card — existing submission -->
        <div class="rounded-lg border border-gray-200 px-5 py-5">
          <div class="mb-4 flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-700">Termination Request</p>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold capitalize"
              style={termStatusStyle(currentTermination.status)}
            >
              {currentTermination.status}
            </span>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p class="form-label">Submitted</p>
              <p class="text-sm text-gray-700">{fmtDate(currentTermination.submitted_at)}</p>
            </div>
            <div>
              <p class="form-label">Requested Effective Date</p>
              <p class="text-sm text-gray-700">{fmtDate(currentTermination.effective_date)}</p>
            </div>
          </div>
          <div class="mt-4">
            <p class="form-label">Reason</p>
            <p class="text-sm text-gray-700">{currentTermination.reason}</p>
          </div>
          {#if currentTermination.response}
            <div class="mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <p class="form-label">Management Response</p>
              <p class="mt-1 text-sm text-gray-700">{currentTermination.response}</p>
              {#if currentTermination.responded_by}
                <p class="mt-1 text-xs text-gray-400">
                  {currentTermination.responded_by}
                  {currentTermination.responded_at ? ' — ' + fmtDate(currentTermination.responded_at) : ''}
                </p>
              {/if}
            </div>
          {/if}
          <p class="mt-4 text-xs text-gray-400">
            Contact your manager if you wish to withdraw this request.
          </p>
        </div>
      {:else}
        <!-- Warning + form -->
        <div class="mb-5 rounded-md border px-4 py-4 text-sm" style="background:#fff5f5;border-color:#fecaca;color:#dc2626;">
          <p class="font-semibold">Important Notice</p>
          <p class="mt-1">
            Submitting a termination letter is a formal request to end your employment with
            Majestic APA. This will be reviewed by your manager and regional manager. Please ensure
            you have discussed this with your supervisor before submitting.
          </p>
        </div>

        <form
          method="POST"
          action="?/terminate"
          use:enhance={() => {
            terminateSubmitting = true;
            return async ({ update }) => {
              await update();
              terminateSubmitting = false;
              terminateConfirmed = false;
            };
          }}
          class="space-y-4"
        >
          <div>
            <label for="t-reason" class="form-label">Reason for Leaving</label>
            <textarea
              id="t-reason"
              name="reason"
              required
              minlength="20"
              rows="5"
              class="form-input resize-none"
              placeholder="Please provide a detailed reason (min. 20 characters)"
            ></textarea>
          </div>
          <div>
            <label for="t-effective_date" class="form-label">Requested Effective Date</label>
            <input
              id="t-effective_date"
              name="effective_date"
              type="date"
              required
              min={minTermDate}
              class="form-input"
            />
            <p class="mt-1 text-xs text-gray-400">Must be at least 30 days from today.</p>
          </div>
          <div class="flex items-start gap-3 pt-1">
            <input
              id="t-confirm"
              type="checkbox"
              required
              bind:checked={terminateConfirmed}
              class="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300"
              style="accent-color: #082b67;"
            />
            <label for="t-confirm" class="cursor-pointer text-sm text-gray-700">
              I understand this is a formal termination request and cannot be undone without
              management approval.
            </label>
          </div>
          <div class="pt-2">
            <button
              type="submit"
              disabled={terminateSubmitting || !terminateConfirmed}
              class="btn-danger"
            >
              {terminateSubmitting ? 'Submitting...' : 'Submit Termination Letter'}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>

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

  :global(.btn-secondary) {
    background-color: white;
    color: #374151;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    transition: background-color 0.15s;
    cursor: pointer;
    border: 1px solid #e5e7eb;
  }
  :global(.btn-secondary:hover) { background-color: #f9fafb; }

  :global(.btn-danger) {
    background-color: #dc2626;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    transition: opacity 0.15s;
    cursor: pointer;
    border: none;
  }
  :global(.btn-danger:hover) { opacity: 0.9; }
  :global(.btn-danger:disabled) { opacity: 0.5; cursor: not-allowed; }

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
