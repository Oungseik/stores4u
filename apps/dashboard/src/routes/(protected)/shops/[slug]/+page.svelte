<script lang="ts">
  import DashboardHeader from "$lib/components/dashboard-header.svelte";

  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="flex flex-1 flex-col">
  <DashboardHeader
    breadcrumbs={[{ label: "Shops", href: "/shops" }, { label: data.organization.name }]}
  />

  <section class="flex flex-col gap-4 px-4 md:px-6">
    <h1 class="text-2xl font-bold">{data.organization.name}</h1>
    <p class="text-muted-foreground">Welcome to your shop dashboard.</p>
  </section>
</div>
