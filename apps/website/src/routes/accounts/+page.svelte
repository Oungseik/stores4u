<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import CameraIcon from "@lucide/svelte/icons/camera";
  import CheckIcon from "@lucide/svelte/icons/check";
  import KeyIcon from "@lucide/svelte/icons/key";
  import LaptopIcon from "@lucide/svelte/icons/laptop";
  import LinkIcon from "@lucide/svelte/icons/link";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import MonitorIcon from "@lucide/svelte/icons/monitor";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import SaveIcon from "@lucide/svelte/icons/save";
  import ShieldIcon from "@lucide/svelte/icons/shield";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UserIcon from "@lucide/svelte/icons/user";
  import XIcon from "@lucide/svelte/icons/x";
  import * as Avatar from "@repo/ui/avatar";
  import { Badge } from "@repo/ui/badge";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { Separator } from "@repo/ui/separator";
  import * as Tabs from "@repo/ui/tabs";
  import { createMutation } from "@tanstack/svelte-query";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";

  import { invalidateAll } from "$app/navigation";
  import { PUBLIC_SITE_NAME } from "$env/static/public";
  import { authClient } from "$lib/auth_client";
  import { orpc } from "$lib/orpc_client";
  import { accountsTabSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();
  let user = $derived(data.user);
  const session = $derived(data.session);

  const searchParams = useSearchParams(accountsTabSchema);

  // --- Profile Tab ---
  let isUploadingAvatar = $state(false);

  const uploadAvatarMutation = createMutation(() => orpc.user.uploadAvatar.mutationOptions());

  let isUpdatingProfile = $state(false);

  async function handleAvatarUpload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Invalid image type. Accepted: JPEG, PNG, WebP");
      return;
    }
    isUploadingAvatar = true;
    uploadAvatarMutation.mutate(
      { file },
      {
        onSuccess: (result) => {
          user.name = result.objectPath;
          toast.success("Avatar updated");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to upload avatar");
        },
        onSettled: () => {
          isUploadingAvatar = false;
        },
      }
    );
  }

  async function handleUpdateName() {
    if (!user.name.trim()) {
      toast.error("Name is required");
      return;
    }
    isUpdatingProfile = true;
    const result = await authClient.updateUser({ name: user.name.trim() });
    if (result.error) {
      toast.error(result.error.message || "Failed to update name");
      isUpdatingProfile = false;
      return;
    }
    toast.success("Name updated");
    await invalidateAll();
    isUpdatingProfile = false;
  }

  // --- Security Tab ---
  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmPassword = $state("");
  let isChangingPassword = $state(false);
  let twoFactorLoading = $state(false);
  let twoFactorPassword = $state("");
  let twoFactorStep = $state<"idle" | "setup" | "verify">("idle");
  let twoFactorTotpUri = $state("");
  let twoFactorBackupCodes = $state<string[]>([]);
  let twoFactorVerifyCode = $state("");
  let twoFactorShowBackupCodes = $state(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    isChangingPassword = true;
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    if (result.error) {
      toast.error(result.error.message || "Failed to change password");
      isChangingPassword = false;
      return;
    }
    toast.success("Password changed successfully");
    currentPassword = "";
    newPassword = "";
    confirmPassword = "";
    isChangingPassword = false;
  }

  async function handleTwoFactorEnableStep1() {
    if (!twoFactorPassword) {
      toast.error("Password is required");
      return;
    }
    twoFactorLoading = true;
    const result = await authClient.twoFactor.enable({
      password: twoFactorPassword,
    });

    if (result.error) {
      toast.error("Failed to start 2FA setup. Check your password.");
      twoFactorLoading = false;
      return;
    }

    twoFactorTotpUri = result.data.totpURI;
    twoFactorBackupCodes = result.data.backupCodes;
    twoFactorStep = "setup";
    toast.success("Scan the key or enter it in your authenticator app");
    twoFactorLoading = false;
  }

  async function handleTwoFactorVerify() {
    if (!twoFactorVerifyCode || twoFactorVerifyCode.length !== 6) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }
    twoFactorLoading = true;
    const result = await authClient.twoFactor.verifyTotp({ code: twoFactorVerifyCode });

    if (result.error) {
      toast.error("Invalid code. Try again.");
      twoFactorLoading = false;
      return;
    }
    toast.success("Two-factor authentication enabled");
    twoFactorStep = "idle";
    twoFactorPassword = "";
    twoFactorVerifyCode = "";
    twoFactorTotpUri = "";
    twoFactorBackupCodes = [];
    await invalidateAll();
    twoFactorLoading = false;
  }

  async function handleTwoFactorCancelSetup() {
    twoFactorStep = "idle";
    twoFactorPassword = "";
    twoFactorVerifyCode = "";
    twoFactorTotpUri = "";
    twoFactorBackupCodes = [];
  }

  async function handleTwoFactorDisable() {
    if (!twoFactorPassword) {
      toast.error("Password is required to disable 2FA");
      return;
    }
    twoFactorLoading = true;
    const result = await authClient.twoFactor.disable({ password: twoFactorPassword });
    if (result.error) {
      toast.error(result.error.message || "Failed to disable 2FA. Check your password.");
      twoFactorLoading = false;
      return;
    }
    toast.success("Two-factor authentication disabled");
    twoFactorPassword = "";
    await invalidateAll();
    twoFactorLoading = false;
  }

  // --- Sessions Tab ---
  interface SessionInfo {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    userId: string;
  }

  let sessions = $state<SessionInfo[]>([]);
  let sessionsLoading = $state(false);
  let revokingSessionId = $state<string | null>(null);
  let revokingAll = $state(false);

  async function loadSessions() {
    sessionsLoading = true;
    const result = await authClient.listSessions();
    if (result.error) {
      toast.error(result.error.message || "Failed to load sessions");
      sessionsLoading = false;
      return;
    }
    sessions = result.data as SessionInfo[];
    sessionsLoading = false;
  }

  async function revokeSession(token: string) {
    revokingSessionId = token;
    const result = await authClient.revokeSession({ token });
    if (result.error) {
      toast.error(result.error.message || "Failed to revoke session");
      revokingSessionId = null;
      return;
    }
    toast.success("Session revoked");
    await loadSessions();
    revokingSessionId = null;
  }

  async function revokeOtherSessions() {
    revokingAll = true;
    const result = await authClient.revokeOtherSessions();
    if (result.error) {
      toast.error(result.error.message || "Failed to revoke sessions");
      revokingAll = false;
      return;
    }
    toast.success("All other sessions revoked");
    await loadSessions();
    revokingAll = false;
  }

  function getDeviceIcon(ua: string | null | undefined) {
    if (!ua) return MonitorIcon;
    if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) return PhoneIcon;
    if (ua.includes("Tablet") || ua.includes("iPad")) return PhoneIcon;
    return LaptopIcon;
  }

  function formatUserAgent(ua: string | null | undefined): string {
    if (!ua) return "Unknown device";
    if (ua.includes("Edge")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    return "Browser";
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  // --- Danger Zone ---
  let isDeleting = $state(false);
  let deletePassword = $state("");

  async function handleDeleteAccount() {
    if (!deletePassword) {
      toast.error("Enter your password to delete your account");
      return;
    }
    confirmDelete({
      title: "Delete Account",
      description:
        "This will permanently delete your account, all your shops, products, orders, and associated data. This action cannot be undone.",
      input: { confirmationText: "DELETE" },
      confirm: { text: "Delete My Account" },
      onConfirm: async () => {
        isDeleting = true;
        const result = await authClient.deleteUser({ password: deletePassword });
        if (result.error) {
          toast.error(result.error.message || "Failed to delete account");
          isDeleting = false;
          return;
        }
        toast.success("Account deleted");
        window.location.href = "/";
      },
    });
  }

  // Load sessions when tab is selected
  $effect(() => {
    if (searchParams.tab === "sessions" && sessions.length === 0) {
      loadSessions();
    }
  });
</script>

<div class="bg-muted/30 flex min-h-svh flex-col">
  <header class="bg-background border-b">
    <div class="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4 md:px-6">
      <div class="flex items-center gap-3">
        <img src="/logo.svg" class="size-6" alt={PUBLIC_SITE_NAME} />
        <h1 class="text-lg font-semibold">Account Settings</h1>
      </div>
      <a class={buttonVariants({ variant: "ghost", size: "sm" })} href="/">
        <ArrowLeftIcon class="size-4" />
        <span class="hidden sm:inline">Back to app</span>
      </a>
    </div>
  </header>

  <main class="mx-auto w-full max-w-2xl flex-1 px-4 py-6 md:px-6">
    <Tabs.Root bind:value={searchParams.tab} class="w-full">
      <div class="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Tabs.List
          class="bg-muted inline-flex h-auto w-max min-w-full gap-1 rounded-lg p-1 md:grid md:w-full md:grid-cols-5"
        >
          <Tabs.Trigger value="profile" class="data-[state=active]:bg-background gap-2">
            <UserIcon class="size-4" />
            <span class="hidden sm:inline">Profile</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="security" class="data-[state=active]:bg-background gap-2">
            <ShieldIcon class="size-4" />
            <span class="hidden sm:inline">Security</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="sessions" class="data-[state=active]:bg-background gap-2">
            <LaptopIcon class="size-4" />
            <span class="hidden sm:inline">Sessions</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="connections" class="data-[state=active]:bg-background gap-2">
            <LinkIcon class="size-4" />
            <span class="hidden sm:inline">Connections</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="danger" class="data-[state=active]:bg-background gap-2">
            <Trash2Icon class="size-4" />
            <span class="hidden sm:inline">Danger</span>
          </Tabs.Trigger>
        </Tabs.List>
      </div>

      <!-- Profile Tab -->
      <Tabs.Content value="profile" class="mt-6 space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <UserIcon class="size-5" />
              Profile
            </Card.Title>
            <Card.Description>Manage your personal information</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Avatar -->
            <div class="space-y-2">
              <Label>Avatar</Label>
              <div class="flex items-center gap-4">
                <div class="relative">
                  <Avatar.Root class="size-20">
                    <Avatar.Image src={user.image || undefined} alt={user.name} />
                    <Avatar.Fallback class="bg-muted text-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <label
                    class="bg-background absolute -right-1 -bottom-1 flex size-7 cursor-pointer items-center justify-center rounded-full border shadow-sm"
                  >
                    {#if isUploadingAvatar}
                      <Loader2Icon class="size-3.5 animate-spin" />
                    {:else}
                      <CameraIcon class="size-3.5" />
                    {/if}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      class="sr-only"
                      disabled={isUploadingAvatar}
                      onchange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) handleAvatarUpload(file);
                      }}
                    />
                  </label>
                </div>
                <div class="text-muted-foreground text-sm">
                  <p>JPEG, PNG, or WebP</p>
                  <p>Max 2MB. Auto-resized to 256x256.</p>
                </div>
              </div>
            </div>

            <!-- Name -->
            <div class="space-y-2">
              <Label for="account-name">Name</Label>
              <div class="flex gap-2">
                <Input
                  id="account-name"
                  bind:value={user.name}
                  placeholder="Your name"
                  class="flex-1"
                />
                <Button onclick={handleUpdateName} disabled={isUpdatingProfile} class="gap-2">
                  {#if isUpdatingProfile}
                    <Loader2Icon class="size-4 animate-spin" />
                  {:else}
                    <SaveIcon class="size-4" />
                  {/if}
                  Save
                </Button>
              </div>
            </div>

            <!-- Email (read-only) -->
            <div class="space-y-2">
              <Label for="account-email">Email</Label>
              <Input id="account-email" value={user.email} disabled />
              <p class="text-muted-foreground text-xs">
                Email changes are not yet supported. Contact support if you need to update your
                email.
              </p>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Security Tab -->
      <Tabs.Content value="security" class="mt-6 space-y-6">
        <!-- Change Password -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <KeyIcon class="size-5" />
              Change Password
            </Card.Title>
            <Card.Description>Update your password to keep your account secure</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="space-y-2">
              <Label for="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                bind:value={currentPassword}
                placeholder="Enter current password"
              />
            </div>
            <div class="space-y-2">
              <Label for="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                bind:value={newPassword}
                placeholder="At least 8 characters"
              />
            </div>
            <div class="space-y-2">
              <Label for="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                bind:value={confirmPassword}
                placeholder="Re-enter new password"
              />
            </div>
            <div class="flex justify-end">
              <Button
                onclick={handleChangePassword}
                disabled={isChangingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword}
                class="gap-2"
              >
                {#if isChangingPassword}
                  <Loader2Icon class="size-4 animate-spin" />
                  Updating...
                {:else}
                  <KeyIcon class="size-4" />
                  Update Password
                {/if}
              </Button>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Two-Factor Authentication -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <ShieldIcon class="size-5" />
              Two-Factor Authentication
            </Card.Title>
            <Card.Description>
              Add an extra layer of security using an authenticator app
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            {#if twoFactorStep === "setup"}
              <!-- Step 1: TOTP URI shown, waiting for verification -->
              <div class="space-y-4">
                <p class="text-sm font-medium">
                  Enter this key in your authenticator app, then enter the 6-digit code below:
                </p>
                <div class="bg-muted rounded-lg p-3 font-mono text-xs break-all">
                  {twoFactorTotpUri}
                </div>

                {#if !twoFactorShowBackupCodes}
                  <button
                    class="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
                    onclick={() => (twoFactorShowBackupCodes = true)}
                  >
                    Show backup codes
                  </button>
                {:else}
                  <div class="space-y-2">
                    <p class="text-sm font-medium">Backup codes (save these!)</p>
                    <div class="bg-muted grid grid-cols-2 gap-1 rounded-lg p-3 font-mono text-xs">
                      {#each twoFactorBackupCodes as code}
                        <span>{code}</span>
                      {/each}
                    </div>
                  </div>
                {/if}

                <div class="space-y-2">
                  <Label for="totp-code">Verification Code</Label>
                  <Input
                    id="totp-code"
                    bind:value={twoFactorVerifyCode}
                    placeholder="6-digit code"
                    maxlength={6}
                    inputmode="numeric"
                  />
                </div>
                <div class="flex gap-2">
                  <Button
                    onclick={handleTwoFactorVerify}
                    disabled={twoFactorLoading || twoFactorVerifyCode.length !== 6}
                    class="gap-2"
                  >
                    {#if twoFactorLoading}
                      <Loader2Icon class="size-4 animate-spin" />
                    {:else}
                      <CheckIcon class="size-4" />
                    {/if}
                    Verify & Enable
                  </Button>
                  <Button variant="outline" onclick={handleTwoFactorCancelSetup}>Cancel</Button>
                </div>
              </div>
            {:else}
              <!-- Status + Enable/Disable -->
              <div class="space-y-4">
                <p class="text-sm">
                  {#if user.twoFactorEnabled}
                    2FA is enabled. Your account is protected with an authenticator app.
                  {:else}
                    2FA is disabled. Enable to require a one-time password on sign-in.
                  {/if}
                </p>
                <div class="space-y-2">
                  <Label for="2fa-password">Password</Label>
                  <Input
                    id="2fa-password"
                    type="password"
                    bind:value={twoFactorPassword}
                    placeholder="Enter your password"
                  />
                </div>
                {#if user.twoFactorEnabled}
                  <Button
                    variant="destructive"
                    onclick={handleTwoFactorDisable}
                    disabled={twoFactorLoading || !twoFactorPassword}
                    class="gap-2"
                  >
                    {#if twoFactorLoading}
                      <Loader2Icon class="size-4 animate-spin" />
                    {:else}
                      <ShieldIcon class="size-4" />
                    {/if}
                    Disable 2FA
                  </Button>
                {:else}
                  <Button
                    onclick={handleTwoFactorEnableStep1}
                    disabled={twoFactorLoading || !twoFactorPassword}
                    class="gap-2"
                  >
                    {#if twoFactorLoading}
                      <Loader2Icon class="size-4 animate-spin" />
                    {:else}
                      <ShieldIcon class="size-4" />
                    {/if}
                    Enable 2FA
                  </Button>
                {/if}
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Sessions Tab -->
      <Tabs.Content value="sessions" class="mt-6">
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <div>
                <Card.Title class="flex items-center gap-2">
                  <LaptopIcon class="size-5" />
                  Active Sessions
                </Card.Title>
                <Card.Description>Manage devices where you are signed in</Card.Description>
              </div>
              {#if sessions.length > 1}
                <Button
                  variant="outline"
                  size="sm"
                  onclick={revokeOtherSessions}
                  disabled={revokingAll}
                  class="gap-2"
                >
                  {#if revokingAll}
                    <Loader2Icon class="size-4 animate-spin" />
                  {:else}
                    <LogOutIcon class="size-4" />
                  {/if}
                  Revoke others
                </Button>
              {/if}
            </div>
          </Card.Header>
          <Card.Content>
            {#if sessionsLoading}
              <div class="flex items-center justify-center py-12">
                <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
              </div>
            {:else if sessions.length === 0}
              <p class="text-muted-foreground py-12 text-center">No active sessions found</p>
            {:else}
              <div class="space-y-3">
                {#each sessions as sess (sess.id)}
                  {@const DeviceIcon = getDeviceIcon(sess.userAgent)}
                  {@const isCurrentSession = sess.id === session.id}
                  <div
                    class="bg-muted/50 flex items-center gap-4 rounded-lg border p-4 {isCurrentSession
                      ? 'border-primary/30 bg-primary/5'
                      : ''}"
                  >
                    <div
                      class="bg-background flex size-10 shrink-0 items-center justify-center rounded-lg border"
                    >
                      <DeviceIcon class="text-muted-foreground size-5" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-medium">{formatUserAgent(sess.userAgent)}</p>
                        {#if isCurrentSession}
                          <Badge variant="secondary" class="text-xs">Current</Badge>
                        {/if}
                      </div>
                      <p class="text-muted-foreground text-xs">
                        {sess.ipAddress ?? "Unknown IP"} &middot; {formatDate(sess.createdAt)}
                      </p>
                    </div>
                    {#if !isCurrentSession}
                      <Button
                        variant="ghost"
                        size="icon"
                        onclick={() => revokeSession(sess.token)}
                        disabled={revokingSessionId === sess.token}
                      >
                        {#if revokingSessionId === sess.token}
                          <Loader2Icon class="size-4 animate-spin" />
                        {:else}
                          <XIcon class="text-muted-foreground size-4" />
                        {/if}
                      </Button>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Connections Tab -->
      <Tabs.Content value="connections" class="mt-6">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <LinkIcon class="size-5" />
              Connected Accounts
            </Card.Title>
            <Card.Description>Manage third-party account connections</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-lg border bg-white">
                  <svg class="size-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium">Google</p>
                  <p class="text-muted-foreground text-xs">Available for sign-in</p>
                </div>
              </div>
              <Badge variant="outline">OAuth</Badge>
            </div>

            <div class="flex items-center justify-between rounded-lg border p-4">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-lg border bg-[#1877F2]"
                >
                  <svg class="size-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium">Facebook</p>
                  <p class="text-muted-foreground text-xs">Available for sign-in</p>
                </div>
              </div>
              <Badge variant="outline">OAuth</Badge>
            </div>

            <Separator />

            <p class="text-muted-foreground text-xs">
              Social login connections are managed during sign-in. To disconnect a provider, contact
              support.
            </p>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Danger Zone Tab -->
      <Tabs.Content value="danger" class="mt-6">
        <Card.Root class="border-destructive/30">
          <Card.Header>
            <Card.Title class="text-destructive flex items-center gap-2">
              <Trash2Icon class="size-5" />
              Danger Zone
            </Card.Title>
            <Card.Description>Irreversible actions for your account</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <p class="text-muted-foreground text-sm">
              Permanently delete your account, all shops, products, orders, and data. This cannot be
              undone.
            </p>
            <div class="space-y-2">
              <Label for="delete-password">Password</Label>
              <Input
                id="delete-password"
                type="password"
                bind:value={deletePassword}
                placeholder="Enter your password to confirm"
              />
            </div>
            <Button
              variant="destructive"
              onclick={handleDeleteAccount}
              disabled={isDeleting || !deletePassword}
              class="gap-2"
            >
              {#if isDeleting}
                <Loader2Icon class="size-4 animate-spin" />
              {:else}
                <Trash2Icon class="size-4" />
              {/if}
              Delete Account
            </Button>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>
  </main>
</div>
