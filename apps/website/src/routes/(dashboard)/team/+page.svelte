<script lang="ts">
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
      toast.success("Invite link generated (expires in 15 min).");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create invite.");
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
      toast.success("Reset link generated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate reset link.");
    } finally {
      isResetting = false;
    }
  }
</script>

<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader breadcrumbs={[{ label: "Dashboard", href: `/` }, { label: "Team" }]} />

  <div class="grid w-full max-w-2xl gap-4">
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <UserPlusIcon class="size-5" />
          Invite a team member
        </Card.Title>
        <Card.Description>
          Generate a one-time invite link (expires in 15 min). Copy the offline link to send via SMS
          when the internet is down, or the online link for email. The recipient opens it on the same
          wifi or over the internet to set up their account.
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="flex items-end gap-3">
          <div class="space-y-2">
            <Label for="invite-role">Role</Label>
            <Select.Root type="single" bind:value={inviteRole}>
              <Select.Trigger id="invite-role" class="w-40">{inviteRole}</Select.Trigger>
              <Select.Content>
                <Select.Item label="Member" value="member">Member</Select.Item>
                <Select.Item label="Admin" value="admin">Admin</Select.Item>
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
          Reset a member's password
        </Card.Title>
        <Card.Description>
          Generate a reset link for a team member who is locked out. Copy the link and hand it over
          manually (works offline on the same wifi).
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
            <Label for="reset-email">Member email</Label>
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
