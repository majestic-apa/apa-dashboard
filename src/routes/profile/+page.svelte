<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import { formatRole } from '$lib/stores/auth.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // untrack() breaks the reactive dependency so Svelte won't warn about
  // capturing an initial value — this is intentional for editable form fields
  let first_name = $state(untrack(() => data.profile.first_name));
  let last_name = $state(untrack(() => data.profile.last_name));
  let email = $state(untrack(() => data.profile.email));

  let profileSubmitting = $state(false);
  let passwordSubmitting = $state(false);

  // Sync form return values back into local state on successful update
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
</script>

<svelte:head>
  <title>Profile — Majestic APA</title>
</svelte:head>

<div class="min-h-full px-8 py-8">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
    <p class="mt-1 text-sm text-gray-500">Manage your account details and password.</p>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Profile details card -->
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div class="border-b border-gray-100 px-6 py-4">
        <h2 class="font-semibold text-gray-800">Account Details</h2>
      </div>
      <div class="px-6 py-6">
        <!-- Avatar initials -->
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
              <input
                id="p-first_name"
                name="first_name"
                type="text"
                required
                bind:value={first_name}
                class="form-input"
              />
            </div>
            <div>
              <label for="p-last_name" class="form-label">Last Name</label>
              <input
                id="p-last_name"
                name="last_name"
                type="text"
                required
                bind:value={last_name}
                class="form-input"
              />
            </div>
          </div>
          <div>
            <label for="p-email" class="form-label">Email Address</label>
            <input
              id="p-email"
              name="email"
              type="email"
              required
              bind:value={email}
              class="form-input"
            />
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
              {profileSubmitting ? 'Saving…' : 'Save Changes'}
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
            <input
              id="p-current_password"
              name="current_password"
              type="password"
              required
              class="form-input"
              placeholder="Your current password"
            />
          </div>
          <div>
            <label for="p-new_password" class="form-label">New Password</label>
            <input
              id="p-new_password"
              name="new_password"
              type="password"
              required
              minlength="8"
              class="form-input"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label for="p-confirm_password" class="form-label">Confirm New Password</label>
            <input
              id="p-confirm_password"
              name="confirm_password"
              type="password"
              required
              minlength="8"
              class="form-input"
              placeholder="Repeat new password"
            />
          </div>
          <div class="pt-2">
            <button type="submit" disabled={passwordSubmitting} class="btn-primary">
              {passwordSubmitting ? 'Updating…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
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
