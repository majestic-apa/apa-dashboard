<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const stats = $derived(data.stats);
  const user = $derived(data.user);

  const statCards = $derived([
    { label: 'Active Staff', value: stats.active_staff },
    { label: 'Active Agents', value: stats.active_agents },
    { label: 'Total Onboardings', value: stats.total_onboardings }
  ]);

  // Bar chart dimensions
  const chartHeight = 160;
  const barWidth = 48;
  const gap = 16;
  const maxVal = $derived(Math.max(...stats.enrolment_trend.map((m) => m.count)));
</script>

<svelte:head>
  <title>Dashboard — Majestic APA</title>
</svelte:head>

<div class="min-h-full px-8 py-8">
  <!-- Welcome banner -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900">
      Welcome back{user ? `, ${user.first_name}` : ''}.
    </h1>
    <p class="mt-1 text-sm text-gray-500">Here's what's happening with Majestic APA today.</p>
  </div>

  <!-- Stat cards -->
  <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
    {#each statCards as card}
      <div class="rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">{card.label}</p>
        <p class="mt-2 text-3xl font-bold" style="color: #082b67;">{card.value}</p>
      </div>
    {/each}
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Enrolment trend chart -->
    <div class="col-span-2 rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
      <h2 class="mb-4 text-sm font-semibold text-gray-700">Enrolment Trend — Last 6 Months</h2>
      <div class="overflow-x-auto">
        <svg
          width={stats.enrolment_trend.length * (barWidth + gap) - gap}
          height={chartHeight + 40}
          role="img"
          aria-label="Enrolment trend bar chart"
        >
          {#each stats.enrolment_trend as month, i}
            {@const barH = Math.round((month.count / maxVal) * chartHeight)}
            {@const x = i * (barWidth + gap)}
            {@const y = chartHeight - barH}

            <!-- Bar -->
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx="4"
              fill="#082b67"
              fill-opacity="0.85"
            />

            <!-- Value label -->
            <text
              x={x + barWidth / 2}
              y={y - 5}
              text-anchor="middle"
              font-size="11"
              font-weight="600"
              fill="#374151"
            >
              {month.count}
            </text>

            <!-- Month label -->
            <text
              x={x + barWidth / 2}
              y={chartHeight + 18}
              text-anchor="middle"
              font-size="11"
              fill="#9ca3af"
            >
              {month.month}
            </text>
          {/each}
        </svg>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
      <h2 class="mb-4 text-sm font-semibold text-gray-700">Quick Actions</h2>
      <div class="space-y-2">
        <a
          href="/staff"
          class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-200 hover:bg-gray-50"
        >
          Manage Staff
          <span class="text-gray-300">→</span>
        </a>
        <a
          href="/reports"
          class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-200 hover:bg-gray-50"
        >
          View Reports
          <span class="text-gray-300">→</span>
        </a>
        <a
          href="/profile"
          class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-200 hover:bg-gray-50"
        >
          Edit Profile
          <span class="text-gray-300">→</span>
        </a>
      </div>
    </div>
  </div>
</div>
