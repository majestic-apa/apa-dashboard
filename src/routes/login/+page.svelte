<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let loading = $state(false);
  let email = $state('');
  let password = $state('');
</script>

<svelte:head>
  <title>Sign In — Majestic APA</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4" style="background-color: #082b67;">
  <div class="w-full max-w-sm">
    <!-- Logo mark -->
    <div class="mb-8 text-center">
      <div
        class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold"
        style="background-color: #febf26; color: #082b67;"
      >
        M
      </div>
      <h1 class="text-xl font-bold text-white">Majestic APA</h1>
      <p class="mt-1 text-sm text-white/50">Pension Administration Dashboard</p>
    </div>

    <!-- Card -->
    <div class="rounded-xl bg-white px-8 py-8 shadow-2xl">
      <h2 class="mb-6 text-base font-semibold text-gray-800">Sign in to your account</h2>

      {#if form?.error}
        <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {form.error}
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
          };
        }}
        class="space-y-4"
      >
        <div>
          <label for="email" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 outline-none ring-0 transition focus:border-transparent focus:ring-2"
            style="--tw-ring-color: #082b67;"
            placeholder="you@majesticapa.com"
          />
        </div>

        <div>
          <label for="password" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            bind:value={password}
            class="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-transparent focus:ring-2"
            style="--tw-ring-color: #082b67;"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="mt-2 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-70"
          style="background-color: #082b67;"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>

    <p class="mt-6 text-center text-xs text-white/30">
      Majestic APA Limited &copy; {new Date().getFullYear()}
    </p>
  </div>
</div>
