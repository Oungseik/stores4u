<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import BotIcon from "@lucide/svelte/icons/bot";
  import MessageSquareIcon from "@lucide/svelte/icons/message-square";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import * as Avatar from "@repo/ui/avatar";
  import { Button } from "@repo/ui/button";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { Input } from "@repo/ui/input";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import * as Sidebar from "@repo/ui/sidebar";
  import { useSidebar } from "@repo/ui/sidebar";
  import type { ComponentProps } from "svelte";

  import { authClient } from "$lib/auth_client";

  interface Chat {
    id: string;
    title: string;
    updatedAt: Date;
  }

  interface Props extends ComponentProps<typeof Sidebar.Root> {
    shop: {
      id: string;
      name: string;
      slug: string;
      logo?: string | null;
    };
    user: {
      name: string;
      email: string;
      image?: string | null;
    };
    currentPath: string;
    chats?: Chat[];
  }

  let { shop, user, currentPath, chats = [], ...restProps }: Props = $props();

  const sidebar = useSidebar();

  let searchQuery = $state("");

  const filteredChats = $derived(
    chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + "/");
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg" class="group-data-[collapsible=icon]:!p-1.5">
          {#snippet child({ props })}
            <a href={`/${shop.slug}`} {...props}>
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
          <a href={`/${shop.slug}/chats`} class="block">
            <Button variant="outline" class="w-full justify-start gap-2">
              <PlusIcon class="size-4" />
              <span>New Chat</span>
            </Button>
          </a>
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <Sidebar.Group>
        <Sidebar.GroupLabel>AI Assistant</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent="Chats" isActive={isActive(`/${shop.slug}/chats`)}>
                {#snippet child({ props })}
                  <a
                    href={`/${shop.slug}/chats`}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <MessageSquareIcon class="size-4" />
                    <span>Chats</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent="Back to dashboard"
                isActive={isActive(`/${shop.slug}/dashboard`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/${shop.slug}/dashboard`}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <ArrowLeftIcon class="size-4" />
                    <span>Back to dashboard</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
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
                  isActive={currentPath === `/${shop.slug}/chats/${chat.id}`}
                >
                  {#snippet child({ props })}
                    <a
                      href={`/${shop.slug}/chats/${chat.id}`}
                      {...props}
                      onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                    >
                      <span class="truncate">{chat.title}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </ScrollArea>
  </Sidebar.Content>

  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
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
                  <a href={`/${shop.slug}/dashboard/settings`} {...props}>
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
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>
