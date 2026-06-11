<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import { formatRole } from '$lib/stores/auth.svelte';
  import type { User } from '$lib/types';
  import logoSrc from '$lib/assets/majestic_logo.png';

  let { user }: { user: User | null } = $props();

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Staff', href: '/staff' },
    { label: 'Reports', href: '/reports' }
  ];

  function isActive(href: string): boolean {
    return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
  }
</script>

<aside
  class="flex h-screen w-60 shrink-0 flex-col"
  style="background-color: #082b67;"
>
  <!-- Logo -->
  <div class="px-5 py-4">
    <div class="overflow-hidden rounded-xl bg-white/95 px-3 py-2.5 shadow-sm">
      <img
        src={logoSrc}
        alt="Majestic APA"
        class="block h-auto w-full max-h-36 object-contain"
      />
    </div>
  </div>

  <!-- Divider -->
  <div class="mx-5 border-t border-white/10"></div>

  <!-- Nav links -->
  <nav class="mt-4 flex-1 px-3">
    {#each navLinks as link}
      {@const active = isActive(link.href)}
      <a
        href={link.href}
        class="relative mb-1 flex items-center rounded px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors
          {active
          ? 'bg-white/10 text-white'
          : 'text-white/60 hover:bg-white/5 hover:text-white'}"
      >
        {#if active}
          <span
            class="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r"
            style="background-color: #febf26;"
          ></span>
        {/if}
        {link.label}
      </a>
    {/each}
  </nav>

  <!-- Bottom: profile + sign out -->
  <div class="px-3 pb-5">
    <div class="mx-5 mb-4 border-t border-white/10"></div>

    <a
      href="/profile"
      class="relative mb-1 flex items-center rounded px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors
        {isActive('/profile')
        ? 'bg-white/10 text-white'
        : 'text-white/60 hover:bg-white/5 hover:text-white'}"
    >
      {#if isActive('/profile')}
        <span
          class="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r"
          style="background-color: #febf26;"
        ></span>
      {/if}
      Profile
    </a>

    {#if user}
      <div class="mt-3 px-4">
        <p class="text-xs font-medium text-white truncate">{user.first_name} {user.last_name}</p>
        <p class="text-xs text-white/40 truncate">{formatRole(user.role)}</p>
      </div>
    {/if}

    <form method="POST" action="/logout" class="mt-3 px-4">
      <button
        type="submit"
        class="w-full rounded border border-white/20 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/60 transition-colors hover:border-white/40 hover:text-white"
      >
        Sign Out
      </button>
    </form>
  </div>
</aside>
