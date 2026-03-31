<script lang="ts">
  import type { IconProps } from "@lucide/svelte";
  import BellIcon from "@lucide/svelte/icons/bell";
  import BotIcon from "@lucide/svelte/icons/bot";
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import ClipboardListIcon from "@lucide/svelte/icons/clipboard-list";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import FolderIcon from "@lucide/svelte/icons/folder";
  import HelpIcon from "@lucide/svelte/icons/help-circle";
  import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
  import LinkIcon from "@lucide/svelte/icons/link";
  import LogOutIcon from "@lucide/svelte/icons/log-out";
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
      logo?: string | null;
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
      href: `/${shop.slug}/admin`,
      icon: LayoutDashboard,
    },
    {
      title: "Checkout",
      href: `/${shop.slug}/admin/checkout`,
      icon: ScanBarcodeIcon,
    },
    {
      title: "Orders",
      href: `/${shop.slug}/admin/orders`,
      icon: ClipboardListIcon,
    },
    // {
    //   title: "Analytics",
    //   href: `/${shop.slug}/admin/analytics`,
    //   icon: ChartNoAxesCombinedIcon,
    // },
    {
      title: "Integrations",
      href: `/${shop.slug}/admin/integrations`,
      icon: LinkIcon,
    },
    {
      title: "AI Agents",
      href: `/${shop.slug}/admin/agents`,
      icon: BotIcon,
    },
    {
      title: "Notifications",
      href: `/${shop.slug}/admin/notifications`,
      icon: BellIcon,
    },
  ]);

  const secondaryNavItems: NavItem[] = $derived([
    {
      title: "Settings",
      href: `/${shop.slug}/admin/settings`,
      icon: SettingsIcon,
    },
    {
      title: "Help",
      href: `/${shop.slug}/admin/help`,
      icon: HelpIcon,
    },
  ]);

  const isActive = (href: string) => currentPath === href;
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
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
        <!-- <Sidebar.GroupLabel>Main</Sidebar.GroupLabel> -->
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
                isActive={isActive(`/${shop.slug}/admin/products`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/${shop.slug}/admin/products`}
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
                isActive={isActive(`/${shop.slug}/admin/products/categories`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/${shop.slug}/admin/products/categories`}
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
            <!-- Overview -->
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent="Overview"
                isActive={isActive(`/${shop.slug}/admin/purchases`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/${shop.slug}/admin/purchases`}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <LayoutDashboard class="size-4" />
                    <span>Overview</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            <!-- Invoices -->
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent="Invoices"
                isActive={isActive(`/${shop.slug}/admin/purchases/invoices`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/${shop.slug}/admin/purchases/invoices`}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <FileTextIcon class="size-4" />
                    <span>Invoices</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            <!-- Suppliers -->
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent="Suppliers"
                isActive={isActive(`/${shop.slug}/admin/purchases/suppliers`)}
              >
                {#snippet child({ props })}
                  <a
                    href={`/${shop.slug}/admin/purchases/suppliers`}
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
                    class="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg"
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
