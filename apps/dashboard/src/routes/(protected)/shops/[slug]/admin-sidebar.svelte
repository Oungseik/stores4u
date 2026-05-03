<script lang="ts">
  import type { IconProps } from "@lucide/svelte";
  import ArrowLeftRightIcon from "@lucide/svelte/icons/arrow-left-right";
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import ClipboardListIcon from "@lucide/svelte/icons/clipboard-list";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import FolderIcon from "@lucide/svelte/icons/folder";
  import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
  import LinkIcon from "@lucide/svelte/icons/link";
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import MessageSquareIcon from "@lucide/svelte/icons/message-square";
  import BoxIcon from "@lucide/svelte/icons/package";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import StoreIcon from "@lucide/svelte/icons/store";
  import UserIcon from "@lucide/svelte/icons/user";
  import * as Avatar from "@repo/ui/avatar";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { LightSwitch } from "@repo/ui/light-switch";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import * as Sidebar from "@repo/ui/sidebar";
  import { useSidebar } from "@repo/ui/sidebar";
  import type { Component, ComponentProps } from "svelte";

  import { authClient } from "$lib/auth_client";

  interface NavItem {
    title: string;
    href: string;
    icon: Component<IconProps>;
  }

  interface Props extends ComponentProps<typeof Sidebar.Root> {
    shop: {
      id: string;
      name: string;
      slug: string;
      info?: {
        logo?: string | null;
      } | null;
    };
    user: {
      name: string;
      email: string;
      image?: string | null;
    };
    currentPath: string;
  }

  let { shop, user, currentPath, ...restProps }: Props = $props();

  const sidebar = useSidebar();

  const mainNavItems: NavItem[] = $derived([
    {
      title: "Dashboard",
      href: `/shops/${shop.slug}`,
      icon: LayoutDashboard,
    },
    {
      title: "Checkout",
      href: `/shops/${shop.slug}/checkout`,
      icon: ScanBarcodeIcon,
    },
    {
      title: "Orders",
      href: `/shops/${shop.slug}/orders`,
      icon: ClipboardListIcon,
    },
    {
      title: "Integrations",
      href: `/shops/${shop.slug}/integrations`,
      icon: LinkIcon,
    },
  ]);

  const aiAssistantNavItems: NavItem[] = $derived([
    {
      title: "Chats",
      href: `/shops/${shop.slug}/chats`,
      icon: MessageSquareIcon,
    },
  ]);

  const secondaryNavItems: NavItem[] = $derived([
    {
      title: "Settings",
      href: `/shops/${shop.slug}/settings`,
      icon: SettingsIcon,
    },
  ]);

  const isActive = (href: string) => currentPath === href;
</script>

<Sidebar.Root collapsible="icon" style="view-transition-name: sidebar;" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg" class="group-data-[collapsible=icon]:!p-1.5">
          {#snippet child({ props })}
            <a href={`/shops/${shop.slug}`} {...props}>
              <div
                class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
              >
                {#if shop.info?.logo}
                  <img
                    src={shop.info.logo}
                    alt={shop.name}
                    class="size-full rounded-lg object-cover"
                  />
                {:else}
                  <StoreIcon class="size-4" />
                {/if}
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{shop.name}</span>
                <span class="truncate text-xs opacity-60">Admin Dashboard</span>
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content class="overflow-hidden">
    <ScrollArea class="h-full">
      <!-- Main Navigation -->
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each mainNavItems as item (item.title)}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton tooltipContent={item.title} isActive={isActive(item.href)}>
                  {#snippet child({ props })}
                    <a
                      href={item.href}
                      {...props}
                      onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <!-- Products Group -->
      <Sidebar.Group>
        <Sidebar.GroupLabel>Products</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent="All Products"
                isActive={isActive(`/shops/${shop.slug}/products`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/shops/${shop.slug}/products`}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <BoxIcon class="size-4" />
                    <span>All Products</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent="Categories"
                isActive={isActive(`/shops/${shop.slug}/products/categories`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/shops/${shop.slug}/products/categories`}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <FolderIcon class="size-4" />
                    <span>Categories</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <!-- Purchases Group -->
      <Sidebar.Group>
        <Sidebar.GroupLabel>Purchases</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent="Invoices"
                isActive={isActive(`/shops/${shop.slug}/purchases/invoices`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/shops/${shop.slug}/purchases/invoices`}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <FileTextIcon class="size-4" />
                    <span>Invoices</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent="Suppliers"
                isActive={isActive(`/shops/${shop.slug}/purchases/suppliers`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/shops/${shop.slug}/purchases/suppliers`}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <Building2Icon class="size-4" />
                    <span>Suppliers</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <!-- Inventory Group -->
      <Sidebar.Group>
        <Sidebar.GroupLabel>Inventory</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent="Movements"
                isActive={isActive(`/shops/${shop.slug}/inventory/movements`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/shops/${shop.slug}/inventory/movements`}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <ArrowLeftRightIcon class="size-4" />
                    <span>Movements</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <!-- AI Assistant Group -->
      <Sidebar.Group>
        <Sidebar.GroupLabel>AI Assistant</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each aiAssistantNavItems as item (item.title)}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton tooltipContent={item.title} isActive={isActive(item.href)}>
                  {#snippet child({ props })}
                    <a
                      href={item.href}
                      {...props}
                      onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                    >
                      <item.icon class="size-4" />
                      <span>{item.title}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <!-- Secondary Navigation -->
      <Sidebar.Group class="mt-auto">
        <Sidebar.GroupLabel>Support</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem class="flex items-center gap-2">
              <Sidebar.MenuButton
                tooltipContent="Settings"
                isActive={isActive(secondaryNavItems[0].href)}
              >
                {#snippet child({ props })}
                  <a
                    href={secondaryNavItems[0].href}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <SettingsIcon />
                    <span>Settings</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
              <LightSwitch />
            </Sidebar.MenuItem>
            {#each secondaryNavItems.slice(1) as item (item.title)}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton tooltipContent={item.title} isActive={isActive(item.href)}>
                  {#snippet child({ props })}
                    <a
                      href={item.href}
                      {...props}
                      onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
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
                    class="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">{user.name}</span>
                  <span class="truncate text-xs opacity-60">{user.email}</span>
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
                  <span class="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              <DropdownMenu.Item>
                {#snippet child({ props })}
                  <a href={"/accounts"} {...props}>
                    <UserIcon class="size-4" />
                    Account
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
              <LogOutIcon class="size-4" />
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>
