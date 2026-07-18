<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import UsersIcon from "@lucide/svelte/icons/users";
  import * as Avatar from "@repo/ui/avatar";
  import { Badge } from "@repo/ui/badge";
  import * as Table from "@repo/ui/table";
  import { createQuery } from "@tanstack/svelte-query";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatDate } from "$lib/utils";

  const members = createQuery(() => orpc.members.list.queryOptions());
  const items = $derived(members.data?.items ?? []);

  const roleVariant: Record<string, "default" | "secondary" | "outline"> = {
    owner: "default",
    admin: "secondary",
    member: "outline",
  };
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_team(), href: `/team` },
      { label: msg.ui_members() },
    ]}
  />

  {#if members.isLoading}
    <div class="flex items-center justify-center py-12">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if members.isError}
    <div class="flex items-center justify-center py-12">
      <p class="text-red-500">{msg.ui_failed_to_load_members()}</p>
    </div>
  {:else if items.length === 0}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
        <UsersIcon class="text-muted-foreground size-8" />
      </div>
      <h3 class="text-lg font-semibold">{msg.ui_no_team_members()}</h3>
      <p class="text-muted-foreground max-w-sm text-sm">
        {msg.ui_invite_your_first_team_member_from_the_management_page()}
      </p>
    </div>
  {:else}
    <div class="rounded-lg border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{msg.ui_name()}</Table.Head>
            <Table.Head>{msg.ui_email()}</Table.Head>
            <Table.Head>{msg.ui_role()}</Table.Head>
            <Table.Head>{msg.ui_status()}</Table.Head>
            <Table.Head>{msg.ui_joined()}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each items as member (member.id)}
            <Table.Row>
              <Table.Cell>
                <div class="flex items-center gap-3">
                  <Avatar.Root class="flex size-8 items-center justify-center rounded-full">
                    <Avatar.Image src={member.image ?? undefined} alt={member.name} />
                    <Avatar.Fallback class="bg-muted text-xs font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <span class="font-medium">{member.name}</span>
                </div>
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">{member.email}</Table.Cell>
              <Table.Cell>
                <Badge variant={roleVariant[member.role] ?? "outline"} class="capitalize">
                  {member.role}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <div class="flex flex-wrap items-center gap-2">
                  {#if member.banned}
                    <Badge variant="destructive">{msg.ui_banned()}</Badge>
                  {:else}
                    <span class="text-muted-foreground">{msg.ui_active()}</span>
                  {/if}
                  {#if member.emailVerified}
                    <Badge variant="outline" class="text-emerald-600">{msg.ui_verified()}</Badge>
                  {:else}
                    <Badge variant="outline" class="text-amber-600">{msg.ui_unverified()}</Badge>
                  {/if}
                </div>
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">{formatDate(member.createdAt)}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}
</div>
