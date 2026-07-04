<script lang="ts">
  import BotIcon from "@lucide/svelte/icons/bot";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import TrashIcon from "@lucide/svelte/icons/trash";
  import * as Avatar from "@repo/ui/avatar";
  import { Button, buttonVariants } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as Dialog from "@repo/ui/dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { Input } from "@repo/ui/input";
  import { LightSwitch } from "@repo/ui/light-switch";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import * as Sidebar from "@repo/ui/sidebar";
  import { useSidebar } from "@repo/ui/sidebar";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import type { ComponentProps } from "svelte";

  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { authClient } from "$lib/auth_client";
  import { orpc } from "$lib/orpc_client";

  interface Chat {
    id: string;
    title: string;
    updatedAt: Date;
  }

  interface Props extends ComponentProps<typeof Sidebar.Root> {
    shop: {
      id: string;
      name: string;
      logo?: string | null;
    };
    user: {
      name: string;
      email: string;
      image?: string | null;
    };
    currentPath: string;
    chats?: Chat[];
    hasNextPage?: boolean;
    fetchNextPage?: () => Promise<unknown>;
    isFetchingNextPage?: boolean;
  }

  let {
    shop,
    user,
    currentPath,
    chats = [],
    hasNextPage = false,
    fetchNextPage,
    isFetchingNextPage = false,
    ...restProps
  }: Props = $props();

  const sidebar = useSidebar();

  let searchQuery = $state("");

  const filteredChats = $derived(
    chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const queryClient = useQueryClient();

  let renamingChat: Chat | null = $state(null);
  let renameTitle = $state("");

  let updateTitleMutation = createMutation(() =>
    orpc.threads.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.threads.list.key() });
      },
    }),
  );

  let deleteThreadMutation = createMutation(() =>
    orpc.threads.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.threads.list.key() });
      },
    }),
  );

  function openRenameDialog(chat: Chat) {
    renamingChat = chat;
    renameTitle = chat.title;
  }

  async function handleRename() {
    if (!renamingChat || !renameTitle.trim()) return;
    await updateTitleMutation.mutateAsync({
      threadId: renamingChat.id,
      title: renameTitle.trim(),
    });
    renamingChat = null;
  }

  function handleDelete(chat: Chat) {
    confirmDelete({
      title: "Delete Chat",
      description: `Are you sure you want to delete "${chat.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        await deleteThreadMutation.mutateAsync({
          threadId: chat.id,
        });
        if (page.url.pathname === `/chats/${chat.id}`) {
          goto(`/chats`);
        }
      },
    });
  }
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg" class="group-data-[collapsible=icon]:!p-1.5">
          {#snippet child({ props })}
            <a href={`/`} {...props}>
              <div
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                {#if shop.logo}
                  <img src={shop.logo} alt={shop.name} class="size-full rounded-lg object-cover" />
                {:else}
                  <BotIcon class="size-4" />
                {/if}
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{shop.name}</span>
                <span class="text-muted-foreground truncate text-xs">AI Assistant</span>
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content class="overflow-hidden">
    <ScrollArea class="h-full">
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <a href={`/chats`} class={buttonVariants({ variant: "outline", class: "w-full" })}>
              <PlusIcon class="size-4" />
              <span>New Chat</span>
            </a>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <Sidebar.Group>
        <Sidebar.GroupLabel>Chat History</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <div class="px-2 pb-2">
            <Input
              type="search"
              placeholder="Search chats..."
              class="h-8"
              bind:value={searchQuery}
            />
          </div>
          <Sidebar.Menu>
            {#each filteredChats as chat (chat.id)}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  class="data-[active=true]:bg-primary/10 data-[active=true]:text-primary min-w-0"
                  tooltipContent={chat.title}
                  isActive={currentPath === `/chats/${chat.id}`}
                >
                  {#snippet child({ props })}
                    <a
                      href={`/chats/${chat.id}`}
                      {...props}
                      onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                    >
                      <span class="truncate">{chat.title}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                      <Sidebar.MenuAction {...props}>
                        <MoreVerticalIcon />
                      </Sidebar.MenuAction>
                    {/snippet}
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content side="right" align="start">
                    <DropdownMenu.Item onclick={() => openRenameDialog(chat)}>
                      <PencilIcon class="size-4" />
                      Rename
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item variant="destructive" onclick={() => handleDelete(chat)}>
                      <TrashIcon class="size-4" />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Sidebar.MenuItem>
            {/each}
            {#if hasNextPage}
              <Sidebar.MenuItem>
                <Button
                  variant="ghost"
                  class="w-full justify-center text-xs"
                  onclick={() => fetchNextPage?.()}
                  disabled={isFetchingNextPage}
                >
                  {#if isFetchingNextPage}
                    <Loader2Icon class="mr-1 size-3 animate-spin" />
                    Loading...
                  {:else}
                    Load more
                  {/if}
                </Button>
              </Sidebar.MenuItem>
            {/if}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </ScrollArea>
  </Sidebar.Content>

  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem class="flex items-center gap-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props }: { props: Record<string, unknown> })}
              <Sidebar.MenuButton
                {...props}
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar.Root class="size-8 rounded-lg">
                  <Avatar.Image src={user.image ?? undefined} alt={user.name} />
                  <Avatar.Fallback
                    class="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">{user.name}</span>
                  <span class="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </Sidebar.MenuButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
            side="right"
            align="end"
            sideOffset={4}
          >
            <DropdownMenu.Label class="p-0 font-normal">
              <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar.Root class="size-8 rounded-lg">
                  <Avatar.Image src={user.image ?? undefined} alt={user.name} />
                  <Avatar.Fallback class="rounded-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">{user.name}</span>
                  <span class="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              <DropdownMenu.Item>
                {#snippet child({ props })}
                  <a href={`/settings`} {...props}>
                    <SettingsIcon class="size-4" />
                    Settings
                  </a>
                {/snippet}
              </DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              onclick={() => {
                authClient.signOut().then(() => (window.location.href = "/"));
              }}
            >
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        <LightSwitch />
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>

<Dialog.Root
  open={renamingChat !== null}
  onOpenChange={(open) => {
    if (!open && !updateTitleMutation.isPending) renamingChat = null;
  }}
>
  <Dialog.Content class="px-0 sm:max-w-md">
    <Dialog.Header class="px-3 sm:px-4">
      <Dialog.Title>Rename Chat</Dialog.Title>
      <Dialog.Description>Enter a new name for this chat.</Dialog.Description>
    </Dialog.Header>
    <form
      class="px-1"
      onsubmit={(e) => {
        e.preventDefault();
        handleRename();
      }}
    >
      <div class="py-4">
        <Input bind:value={renameTitle} placeholder="Chat title" autofocus />
      </div>
      <Dialog.Footer class="mx-0">
        <Button
          type="button"
          variant="outline"
          onclick={() => (renamingChat = null)}
          disabled={updateTitleMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={updateTitleMutation.isPending}>Save</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
