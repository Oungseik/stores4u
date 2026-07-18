<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import BuildingIcon from "@lucide/svelte/icons/building-2";
  import PercentIcon from "@lucide/svelte/icons/percent";
  import StoreIcon from "@lucide/svelte/icons/store";
  import * as Tabs from "@repo/ui/tabs";
  import { useSearchParams } from "runed/kit";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { settingsTabSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";
  import Business from "./Business.svelte";
  import Profile from "./Profile.svelte";
  import Tax from "./Tax.svelte";

  const { data: shop }: PageProps = $props();

  const searchParams = useSearchParams(settingsTabSchema, { noScroll: true });
</script>

<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: msg.ui_dashboard(), href: `/` }, { label: msg.ui_settings() }]}
  />

  <Tabs.Root bind:value={searchParams.tab} class="w-full max-w-2xl">
    <div class="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <Tabs.List
        class="bg-muted inline-flex h-auto w-max min-w-full gap-1 rounded-lg p-1 md:grid md:w-full md:grid-cols-3 lg:grid-cols-3"
      >
        <Tabs.Trigger value="profile" class="data-[state=active]:bg-background gap-2">
          <StoreIcon class="size-4" />
          <span class="hidden sm:inline">{msg.ui_profile()}</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="business" class="data-[state=active]:bg-background gap-2">
          <BuildingIcon class="size-4" />
          <span class="hidden sm:inline">{msg.ui_business()}</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="tax" class="data-[state=active]:bg-background gap-2">
          <PercentIcon class="size-4" />
          <span class="hidden sm:inline">{msg.ui_tax()}</span>
        </Tabs.Trigger>
      </Tabs.List>
    </div>

    <Tabs.Content value="profile" class="mt-6">
      <Profile {shop} />
    </Tabs.Content>

    <Tabs.Content value="business" class="mt-6">
      <Business {shop} />
    </Tabs.Content>

    <Tabs.Content value="tax" class="mt-6">
      <Tax {shop} />
    </Tabs.Content>
  </Tabs.Root>
</section>
