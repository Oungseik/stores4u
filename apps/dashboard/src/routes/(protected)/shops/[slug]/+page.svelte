<script lang="ts">
  import DashboardHeader from "$lib/components/dashboard-header.svelte";

  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="flex flex-1 flex-col gap-4">
  <DashboardHeader
    breadcrumbs={[{ label: "Shops", href: "/shops" }, { label: data.organization.name }]}
  />

  <h1 class="text-2xl font-bold">{data.organization.name}</h1>
  <p class="text-muted-foreground">Welcome to your shop dashboard.</p>
</div>
