<script lang="ts">
  import BuildingIcon from "@lucide/svelte/icons/building-2";
  import CreditCardIcon from "@lucide/svelte/icons/credit-card";
  import MailIcon from "@lucide/svelte/icons/mail";
  import PercentIcon from "@lucide/svelte/icons/percent";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import StoreIcon from "@lucide/svelte/icons/store";
  import UsersIcon from "@lucide/svelte/icons/users";
  import * as Tabs from "@repo/ui/tabs";
  import { useSearchParams } from "runed/kit";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { settingsTabSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";
  import Business from "./Business.svelte";
  import Notifications from "./Notifications.svelte";
  import Payment from "./Payment.svelte";
  import Profile from "./Profile.svelte";
  import Receipt from "./Receipt.svelte";
  import Tax from "./Tax.svelte";
  import Team from "./Team.svelte";

  const { data: shop }: PageProps = $props();

  const searchParams = useSearchParams(settingsTabSchema, { noScroll: true });
</script>

<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: "Dashboard", href: `/${shop.slug}/dashboard` }, { label: "Settings" }]}
  />

  <Tabs.Root bind:value={searchParams.tab} class="w-full max-w-2xl">
    <div class="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <Tabs.List
        class="bg-muted inline-flex h-auto w-max min-w-full gap-1 rounded-lg p-1 md:grid md:w-full md:grid-cols-3 lg:grid-cols-3"
      >
        <!-- TODO: Re-enable payment, receipt, alerts, and team tabs once implemented -->
        <Tabs.Trigger value="profile" class="data-[state=active]:bg-background gap-2">
          <StoreIcon class="size-4" />
          <span class="hidden sm:inline">Profile</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="business" class="data-[state=active]:bg-background gap-2">
          <BuildingIcon class="size-4" />
          <span class="hidden sm:inline">Business</span>
        </Tabs.Trigger>
        <!-- <Tabs.Trigger value="payment" class="data-[state=active]:bg-background gap-2">
          <CreditCardIcon class="size-4" />
          <span class="hidden sm:inline">Payment</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="receipt" class="data-[state=active]:bg-background gap-2">
          <ReceiptIcon class="size-4" />
          <span class="hidden sm:inline">Receipt</span>
        </Tabs.Trigger> -->
        <Tabs.Trigger value="tax" class="data-[state=active]:bg-background gap-2">
          <PercentIcon class="size-4" />
          <span class="hidden sm:inline">Tax</span>
        </Tabs.Trigger>
        <!-- <Tabs.Trigger value="notifications" class="data-[state=active]:bg-background gap-2">
          <MailIcon class="size-4" />
          <span class="hidden sm:inline">Alerts</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="team" class="data-[state=active]:bg-background gap-2">
          <UsersIcon class="size-4" />
          <span class="hidden sm:inline">Team</span>
        </Tabs.Trigger> -->
      </Tabs.List>
    </div>

    <Tabs.Content value="profile" class="mt-6">
      <Profile {shop} />
    </Tabs.Content>

    <Tabs.Content value="business" class="mt-6">
      <Business {shop} />
    </Tabs.Content>

    <!-- <Tabs.Content value="payment" class="mt-6">
      <Payment />
    </Tabs.Content>

    <Tabs.Content value="receipt" class="mt-6">
      <Receipt />
    </Tabs.Content> -->

    <Tabs.Content value="tax" class="mt-6">
      <Tax {shop} />
    </Tabs.Content>

    <!-- <Tabs.Content value="notifications" class="mt-6">
      <Notifications />
    </Tabs.Content>

    <Tabs.Content value="team" class="mt-6">
      <Team />
    </Tabs.Content> -->
  </Tabs.Root>
</section>
