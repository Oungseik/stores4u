<script lang="ts">
  import { localizeError } from "$lib/error-message";
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import CameraIcon from "@lucide/svelte/icons/camera";
  import KeyIcon from "@lucide/svelte/icons/key";
  import LaptopIcon from "@lucide/svelte/icons/laptop";
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
  import * as Tabs from "@repo/ui/tabs";
  import { createMutation } from "@tanstack/svelte-query";
  import { useSearchParams } from "runed/kit";
  import { untrack } from "svelte";
  import { toast } from "svelte-sonner";

  import { invalidateAll } from "$app/navigation";
  import { authClient } from "$lib/auth_client";
  import { orpc } from "$lib/orpc_client";
  import { accountsTabSchema } from "$lib/search_param";

  import type { Language } from "@repo/config";
  import * as Select from "@repo/ui/select";
  import * as msg from "$lib/paraglide/messages";
  import { setLocale } from "$lib/paraglide/runtime";

  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();
  let user = $derived(data.user);
  const session = $derived(data.session);
  let selectedLanguage = $state<Language>(untrack(() => data.language));

  // Cookie-only: setLocale writes PARAGLIDE_LOCALE directly, no DB call.
  async function handleLanguageChange(value: string) {
    if (value !== "en" && value !== "my") return;
    selectedLanguage = value;
    setLocale(value, { reload: false });
    await invalidateAll();
    toast.success(msg.language_updated());
  }

  const searchParams = useSearchParams(accountsTabSchema, { noScroll: true });

  // --- Profile Tab ---
  let isUploadingAvatar = $state(false);

  const uploadAvatarMutation = createMutation(() => orpc.user.uploadAvatar.mutationOptions());

  let isUpdatingProfile = $state(false);

  async function handleAvatarUpload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(msg.ui_invalid_image_type_accepted_jpeg_png_webp());
      return;
    }
    isUploadingAvatar = true;
    uploadAvatarMutation.mutate(
      { file },
      {
        onSuccess: (result) => {
          user.name = result.objectPath;
          toast.success(msg.ui_avatar_updated());
        },
        onError: (error) => {
          toast.error(localizeError(error, "ui_failed_to_upload_avatar"));
        },
        onSettled: () => {
          isUploadingAvatar = false;
        },
      },
    );
  }

  async function handleUpdateName() {
    if (!user.name.trim()) {
      toast.error(msg.ui_name_is_required());
      return;
    }
    isUpdatingProfile = true;
    const result = await authClient.updateUser({ name: user.name.trim() });
    if (result.error) {
      toast.error(localizeError(result.error, "ui_failed_to_update_name"));
      isUpdatingProfile = false;
      return;
    }
    toast.success(msg.ui_name_updated());
    await invalidateAll();
    isUpdatingProfile = false;
  }

  // --- Security Tab ---
  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmPassword = $state("");
  let isChangingPassword = $state(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast.error(msg.ui_all_password_fields_are_required());
      return;
    }
    if (newPassword.length < 8) {
      toast.error(msg.ui_new_password_must_be_at_least_8_characters());
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(msg.ui_passwords_do_not_match());
      return;
    }
    isChangingPassword = true;
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    if (result.error) {
      toast.error(localizeError(result.error, "ui_failed_to_change_password"));
      isChangingPassword = false;
      return;
    }
    toast.success(msg.ui_password_changed_successfully());
    currentPassword = "";
    newPassword = "";
    confirmPassword = "";
    isChangingPassword = false;
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
      toast.error(localizeError(result.error, "ui_failed_to_load_sessions"));
      sessionsLoading = false;
      return;
    }
    sessions = result.data;
    sessionsLoading = false;
  }

  async function revokeSession(token: string) {
    revokingSessionId = token;
    const result = await authClient.revokeSession({ token });
    if (result.error) {
      toast.error(localizeError(result.error, "ui_failed_to_revoke_session"));
      revokingSessionId = null;
      return;
    }
    toast.success(msg.ui_session_revoked());
    await loadSessions();
    revokingSessionId = null;
  }

  async function revokeOtherSessions() {
    revokingAll = true;
    const result = await authClient.revokeOtherSessions();
    if (result.error) {
      toast.error(localizeError(result.error, "ui_failed_to_revoke_sessions"));
      revokingAll = false;
      return;
    }
    toast.success(msg.ui_all_other_sessions_revoked());
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
    if (!ua) return msg.ui_unknown_device();
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
      toast.error(msg.ui_enter_your_password_to_delete_your_account());
      return;
    }
    confirmDelete({
      title: msg.ui_delete_account(),
      description: msg.ui_this_will_permanently_delete_your_account_all_your_shop(),
      input: { confirmationText: "DELETE" },
      confirm: { text: msg.ui_delete_my_account() },
      onConfirm: async () => {
        isDeleting = true;
        const result = await authClient.deleteUser({ password: deletePassword });
        if (result.error) {
          toast.error(localizeError(result.error, "ui_failed_to_delete_account"));
          isDeleting = false;
          return;
        }
        toast.success(msg.ui_account_deleted());
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
        <h1 class="text-lg font-semibold">{msg.ui_account_settings()}</h1>
      </div>
      <a class={buttonVariants({ variant: "ghost", size: "sm" })} href="/">
        <ArrowLeftIcon class="size-4" />
        <span class="hidden sm:inline">{msg.ui_back_to_app()}</span>
      </a>
    </div>
  </header>

  <main class="mx-auto w-full max-w-2xl flex-1 px-4 py-6 md:px-6">
    <Tabs.Root bind:value={searchParams.tab} class="w-full">
      <div class="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Tabs.List
          class="bg-muted inline-flex h-auto w-max min-w-full gap-1 rounded-lg p-1 md:grid md:w-full md:grid-cols-4"
        >
          <Tabs.Trigger value="profile" class="data-[state=active]:bg-background gap-2">
            <UserIcon class="size-4" />
            <span class="hidden sm:inline">{msg.ui_profile()}</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="security" class="data-[state=active]:bg-background gap-2">
            <ShieldIcon class="size-4" />
            <span class="hidden sm:inline">{msg.ui_security()}</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="sessions" class="data-[state=active]:bg-background gap-2">
            <LaptopIcon class="size-4" />
            <span class="hidden sm:inline">{msg.ui_sessions()}</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="danger" class="data-[state=active]:bg-background gap-2">
            <Trash2Icon class="size-4" />
            <span class="hidden sm:inline">{msg.ui_danger()}</span>
          </Tabs.Trigger>
        </Tabs.List>
      </div>

      <!-- Profile Tab -->
      <Tabs.Content value="profile" class="mt-6 space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <UserIcon class="size-5" />
              {msg.ui_profile()}
            </Card.Title>
            <Card.Description>{msg.ui_manage_your_personal_information()}</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Avatar -->
            <div class="space-y-2">
              <Label>{msg.ui_avatar()}</Label>
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
                  <p>{msg.ui_supported_image_formats()}</p>
                  <p>{msg.ui_max_2mb_auto_resized_to_256x256()}</p>
                </div>
              </div>
            </div>

            <!-- Name -->
            <div class="space-y-2">
              <Label for="account-name">{msg.ui_name()}</Label>
              <div class="flex gap-2">
                <Input
                  id="account-name"
                  value={user.name}
                  onchange={(e) => {
                    user.name = e.currentTarget.value;
                  }}
                  placeholder={msg.ui_your_name()}
                  class="flex-1"
                />
                <Button onclick={handleUpdateName} disabled={isUpdatingProfile} class="gap-2">
                  {#if isUpdatingProfile}
                    <Loader2Icon class="size-4 animate-spin" />
                  {:else}
                    <SaveIcon class="size-4" />
                  {/if}
                  {msg.ui_save()}
                </Button>
              </div>
            </div>

            <!-- Email (read-only) -->
            <div class="space-y-2">
              <Label for="account-email">{msg.ui_email()}</Label>
              <Input id="account-email" value={user.email} disabled />
              <p class="text-muted-foreground text-xs">
                {msg.ui_email_changes_are_not_yet_supported_contact_support_if_()}
              </p>
            </div>

            <div class="space-y-2">
              <Label for="account-language">{msg.language()}</Label>
              <Select.Root
                type="single"
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
              >
                <Select.Trigger id="account-language" class="w-full">
                  {selectedLanguage === "my" ? msg.burmese() : msg.english()}
                </Select.Trigger>
                <Select.Content>
                  <Select.Group>
                    <Select.Item label="English" value="en">English</Select.Item>
                    <Select.Item label="မြန်မာ" value="my">မြန်မာ</Select.Item>
                  </Select.Group>
                </Select.Content>
              </Select.Root>
              <p class="text-muted-foreground text-xs">{msg.language_description()}</p>
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
              {msg.ui_change_password()}
            </Card.Title>
            <Card.Description
              >{msg.ui_update_your_password_to_keep_your_account_secure()}</Card.Description
            >
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="space-y-2">
              <Label for="current-password">{msg.ui_current_password()}</Label>
              <Input
                id="current-password"
                type="password"
                bind:value={currentPassword}
                placeholder={msg.ui_enter_current_password()}
              />
            </div>
            <div class="space-y-2">
              <Label for="new-password">{msg.ui_new_password()}</Label>
              <Input
                id="new-password"
                type="password"
                bind:value={newPassword}
                placeholder={msg.ui_at_least_8_characters()}
              />
            </div>
            <div class="space-y-2">
              <Label for="confirm-password">{msg.ui_confirm_new_password()}</Label>
              <Input
                id="confirm-password"
                type="password"
                bind:value={confirmPassword}
                placeholder={msg.ui_re_enter_new_password()}
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
                  {msg.ui_updating()}
                {:else}
                  <KeyIcon class="size-4" />
                  {msg.ui_update_password()}
                {/if}
              </Button>
            </div>
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
                  {msg.ui_active_sessions()}
                </Card.Title>
                <Card.Description
                  >{msg.ui_manage_devices_where_you_are_signed_in()}</Card.Description
                >
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
                  {msg.ui_revoke_others()}
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
              <p class="text-muted-foreground py-12 text-center">
                {msg.ui_no_active_sessions_found()}
              </p>
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
                          <Badge variant="secondary" class="text-xs">{msg.ui_current()}</Badge>
                        {/if}
                      </div>
                      <p class="text-muted-foreground text-xs">
                        {sess.ipAddress ?? msg.ui_unknown_ip()} &middot; {formatDate(
                          sess.createdAt,
                        )}
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

      <!-- Danger Zone Tab -->
      <Tabs.Content value="danger" class="mt-6">
        <Card.Root class="border-destructive/30">
          <Card.Header>
            <Card.Title class="text-destructive flex items-center gap-2">
              <Trash2Icon class="size-5" />
              {msg.ui_danger_zone()}
            </Card.Title>
            <Card.Description>{msg.ui_irreversible_actions_for_your_account()}</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <p class="text-muted-foreground text-sm">
              {msg.ui_permanently_delete_your_account_all_shops_products_orde()}
            </p>
            <div class="space-y-2">
              <Label for="delete-password">{msg.ui_password()}</Label>
              <Input
                id="delete-password"
                type="password"
                bind:value={deletePassword}
                placeholder={msg.ui_enter_your_password_to_confirm()}
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
              {msg.ui_delete_account()}
            </Button>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>
  </main>
</div>
