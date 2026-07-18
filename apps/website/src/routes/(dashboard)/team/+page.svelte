<script lang="ts">
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import KeyRoundIcon from "@lucide/svelte/icons/key-round";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import UserPlusIcon from "@lucide/svelte/icons/user-plus";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Select from "@repo/ui/select";
  import { toast } from "svelte-sonner";

  import { orpc } from "$lib/orpc_client";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import AuthLinkPair from "$lib/components/auth/AuthLinkPair.svelte";
  import type { LinkPair } from "$lib/server/links";

  // Route is owner-only (+page.server.ts guard), so no per-role UI branch here.

  // --- Invite ---
  let inviteRole = $state<"admin" | "member">("member");
  let inviteLinks = $state<LinkPair | null>(null);
  let isInviting = $state(false);

  async function createInvite() {
    isInviting = true;
    try {
      const res = await orpc.invites.create.call({ role: inviteRole });
      inviteLinks = res.links;
      toast.success(msg.ui_invite_link_generated_expires_in_15_min());
    } catch (err) {
      toast.error(localizeError(err, "ui_could_not_create_invite"));
    } finally {
      isInviting = false;
    }
  }

  // --- Reset for user ---
  let resetEmail = $state("");
  let resetLinks = $state<LinkPair | null>(null);
  let isResetting = $state(false);

  async function resetForUser() {
    if (!resetEmail) return;
    isResetting = true;
    try {
      const res = await orpc.recovery.forUser.call({ email: resetEmail });
      resetLinks = res.links;
      toast.success(msg.ui_reset_link_generated());
    } catch (err) {
      toast.error(localizeError(err, "ui_could_not_generate_reset_link"));
    } finally {
      isResetting = false;
    }
  }
</script>

<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: msg.ui_dashboard(), href: `/` }, { label: msg.ui_team() }]}
  />

  <div class="grid w-full max-w-2xl gap-4">
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <UserPlusIcon class="size-5" />
          {msg.ui_invite_a_team_member()}
        </Card.Title>
        <Card.Description>
          {msg.ui_generate_a_one_time_invite_link_expires_in_15_min_copy_()}
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="flex items-end gap-3">
          <div class="space-y-2">
            <Label for="invite-role">{msg.ui_role()}</Label>
            <Select.Root type="single" bind:value={inviteRole}>
              <Select.Trigger id="invite-role" class="w-40">{inviteRole}</Select.Trigger>
              <Select.Content>
                <Select.Item label={msg.ui_member()} value="member">{msg.ui_member()}</Select.Item>
                <Select.Item label={msg.ui_admin()} value="admin">{msg.ui_admin()}</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
          <Button onclick={createInvite} disabled={isInviting} class="gap-2">
            {#if isInviting}<Loader2Icon class="animate-spin" />{:else}Generate invite link{/if}
          </Button>
        </div>
        {#if inviteLinks}
          <AuthLinkPair links={inviteLinks} />
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <KeyRoundIcon class="size-5" />
          {msg.ui_reset_a_member_s_password()}
        </Card.Title>
        <Card.Description>
          {msg.ui_generate_a_reset_link_for_a_team_member_who_is_locked_o()}
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <form
          class="flex items-end gap-3"
          onsubmit={(e) => {
            e.preventDefault();
            resetForUser();
          }}
        >
          <div class="flex-1 space-y-2">
            <Label for="reset-email">{msg.ui_member_email()}</Label>
            <Input
              id="reset-email"
              type="email"
              bind:value={resetEmail}
              placeholder="member@example.com"
              required
            />
          </div>
          <Button type="submit" disabled={isResetting} class="gap-2">
            {#if isResetting}<Loader2Icon class="animate-spin" />{:else}Generate reset link{/if}
          </Button>
        </form>
        {#if resetLinks}
          <AuthLinkPair links={resetLinks} />
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</section>
