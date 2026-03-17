<script lang="ts">
  import BellIcon from "@lucide/svelte/icons/bell";
  import ChartNoAxesCombinedIcon from "@lucide/svelte/icons/chart-no-axes-combined";
  import HelpIcon from "@lucide/svelte/icons/help-circle";
  import type DashboardIcon from "@lucide/svelte/icons/layout-dashboard";
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import BoxIcon from "@lucide/svelte/icons/package";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import StoreIcon from "@lucide/svelte/icons/store";
  import UserIcon from "@lucide/svelte/icons/user";
  import * as Avatar from "@repo/ui/avatar";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import * as Sidebar from "@repo/ui/sidebar";
  import { useSidebar } from "@repo/ui/sidebar";
  import type { ComponentProps } from "svelte";

  interface NavItem {
    title: string;
    href: string;
    icon: typeof DashboardIcon;
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
      title: "Checkout",
      href: `/${shop.slug}/admin`,
      icon: ScanBarcodeIcon,
    },
    {
      title: "Analytics",
      href: `/${shop.slug}/admin/analytics`,
      icon: ChartNoAxesCombinedIcon,
    },
    {
      title: "Products",
      href: `/${shop.slug}/admin/products`,
      icon: BoxIcon,
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

  <Sidebar.Content>
    <!-- Main Navigation -->
    <Sidebar.Group>
      <Sidebar.GroupLabel>Main</Sidebar.GroupLabel>
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

    <!-- Secondary Navigation -->
    <Sidebar.Group class="mt-auto">
      <Sidebar.GroupLabel>Support</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each secondaryNavItems as item (item.title)}
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
                <UserIcon class="mr-2 size-4" />
                Account
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <SettingsIcon class="mr-2 size-4" />
                Settings
              </DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Item>
              <LogOutIcon class="mr-2 size-4" />
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>
