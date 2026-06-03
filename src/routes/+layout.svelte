<script lang="ts">
  import './layout.css';
  import { page } from '$app/state';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { auth } from '$lib/stores/auth.svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  // Sync server-resolved user into the client auth store
  $effect(() => {
    auth.setUser(data.user ?? null);
  });

  const isPublicRoute = $derived(page.url.pathname === '/login');
</script>

{#if isPublicRoute}
  {@render children()}
{:else}
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <Sidebar user={data.user ?? null} />
    <main class="flex-1 overflow-y-auto">
      {@render children()}
    </main>
  </div>
{/if}
