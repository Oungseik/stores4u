<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import * as msg from "$lib/paraglide/messages";
  import type { IconProps } from "@lucide/svelte";
  import ArrowLeftRightIcon from "@lucide/svelte/icons/arrow-left-right";
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import ClipboardListIcon from "@lucide/svelte/icons/clipboard-list";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import FolderIcon from "@lucide/svelte/icons/folder";
  import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import BoxIcon from "@lucide/svelte/icons/package";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import StoreIcon from "@lucide/svelte/icons/store";
  import UserIcon from "@lucide/svelte/icons/user";
  import UsersIcon from "@lucide/svelte/icons/users";
  import * as Avatar from "@repo/ui/avatar";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { LightSwitch } from "@repo/ui/light-switch";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { untrack } from "svelte";
  import { slide } from "svelte/transition";
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
      logo?: string | null;
    };
    user: {
      name: string;
      email: string;
      image?: string | null;
      role?: string | null | undefined;
    };
    currentPath: string;
  }

  let { shop, user, currentPath, ...restProps }: Props = $props();

  const sidebar = useSidebar();

  const mainNavItems: NavItem[] = [
    { title: msg.ui_dashboard(), href: "/", icon: LayoutDashboard },
    { title: msg.ui_point_of_sale(), href: "/cart", icon: ScanBarcodeIcon },
    { title: msg.ui_orders(), href: "/orders", icon: ClipboardListIcon },
    { title: msg.ui_customers(), href: "/customers", icon: UsersIcon },
    { title: msg.ui_products(), href: "/products", icon: BoxIcon },
    { title: msg.ui_product_categories(), href: "/products/categories", icon: FolderIcon },
    { title: msg.ui_purchase_invoices(), href: "/purchases/invoices", icon: FileTextIcon },
    { title: msg.ui_suppliers(), href: "/purchases/suppliers", icon: Building2Icon },
  ];

  const settingsHref = "/settings";

  const isActive = (href: string) => currentPath === localizePath(href);
  // $state (not $derived): binding open to a $derived breaks manual collapse.
  // untrack: capture only the initial route state; the effect below handles
  // subsequent settings-route entries, and manual toggles persist otherwise.
  let settingsOpen = $state(untrack(() => currentPath.startsWith(localizePath(settingsHref))));
  // Auto-expand when entering a settings route; manual collapse is preserved
  // (this only opens, never closes, so it never fights a user toggle).
  $effect(() => {
    if (currentPath.startsWith(localizePath(settingsHref))) settingsOpen = true;
  });

  const teamHref = "/team";
  let teamOpen = $state(untrack(() => currentPath.startsWith(localizePath(teamHref))));
  $effect(() => {
    if (currentPath.startsWith(localizePath(teamHref))) teamOpen = true;
  });
</script>

<Sidebar.Root collapsible="icon" style="view-transition-name: sidebar;" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <div class="flex items-center gap-2">
          <Sidebar.MenuButton size="lg" class="min-w-0 flex-1">
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
              <span class="truncate text-xs opacity-60">{msg.ui_admin_dashboard()}</span>
            </div>
          </Sidebar.MenuButton>
          <div class="group-data-[collapsible=icon]:hidden">
            <LightSwitch />
          </div>
        </div>
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
                      href={localizePath(item.href)}
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

      <!-- Inventory Group -->
      <Sidebar.Group>
        <Sidebar.GroupLabel>{msg.ui_inventory()}</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContent={msg.ui_movements()}
                isActive={isActive("/inventory/movements")}
              >
                {#snippet child({ props })}
                  <a
                    href={localizePath("/inventory/movements")}
                    {...props}
                    onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                  >
                    <ArrowLeftRightIcon class="size-4" />
                    <span>{msg.ui_movements()}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>

      {#if user.role === "owner"}
        <!-- Team -->
        <Sidebar.Group>
          <Sidebar.GroupLabel>{msg.ui_team()}</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  tooltipContent={msg.ui_team()}
                  isActive={sidebar.state === "collapsed" &&
                    currentPath.startsWith(localizePath(teamHref))}
                  aria-expanded={teamOpen}
                  onclick={() => (teamOpen = !teamOpen)}
                >
                  <UsersIcon class="size-4" />
                  <span>{msg.ui_team()}</span>
                  <ChevronRightIcon
                    class="ml-auto transition-transform duration-200 {teamOpen ? 'rotate-90' : ''}"
                  />
                </Sidebar.MenuButton>
                {#if teamOpen}
                  <div transition:slide={{ duration: 200 }}>
                    <Sidebar.MenuSub>
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton class="w-full" isActive={isActive("/team/members")}>
                          {#snippet child({ props })}
                            <a
                              href={localizePath("/team/members")}
                              {...props}
                              onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                            >
                              <span>{msg.ui_members()}</span>
                            </a>
                          {/snippet}
                        </Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton class="w-full" isActive={isActive(teamHref)}>
                          {#snippet child({ props })}
                            <a
                              href={localizePath(teamHref)}
                              {...props}
                              onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                            >
                              <span>{msg.ui_management()}</span>
                            </a>
                          {/snippet}
                        </Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                    </Sidebar.MenuSub>
                  </div>
                {/if}
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>

        <!-- Settings -->
        <Sidebar.Group class="mt-auto">
          <Sidebar.GroupLabel>{msg.ui_settings()}</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  tooltipContent={msg.ui_settings()}
                  isActive={sidebar.state === "collapsed" &&
                    currentPath.startsWith(localizePath(settingsHref))}
                  aria-expanded={settingsOpen}
                  onclick={() => (settingsOpen = !settingsOpen)}
                >
                  <SettingsIcon />
                  <span>{msg.ui_settings()}</span>
                  <ChevronRightIcon
                    class="ml-auto transition-transform duration-200 {settingsOpen
                      ? 'rotate-90'
                      : ''}"
                  />
                </Sidebar.MenuButton>
                {#if settingsOpen}
                  <div transition:slide={{ duration: 200 }}>
                    <Sidebar.MenuSub>
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton class="w-full" isActive={isActive(settingsHref)}>
                          {#snippet child({ props })}
                            <a
                              href={localizePath(settingsHref)}
                              {...props}
                              onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                            >
                              <span>{msg.ui_shop()}</span>
                            </a>
                          {/snippet}
                        </Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton
                          class="w-full"
                          isActive={currentPath.startsWith(localizePath("/settings/invoice"))}
                        >
                          {#snippet child({ props })}
                            <a
                              href={localizePath("/settings/invoice")}
                              {...props}
                              onclick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
                            >
                              <span>{msg.ui_invoice()}</span>
                            </a>
                          {/snippet}
                        </Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                    </Sidebar.MenuSub>
                  </div>
                {/if}
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>
      {/if}
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
                  <a href={localizePath("/accounts")} {...props}>
                    <UserIcon class="size-4" />
                    {msg.ui_account()}
                  </a>
                {/snippet}
              </DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              onclick={() => {
                authClient.signOut().then(() => (window.location.href = localizePath("/")));
              }}
            >
              <LogOutIcon class="size-4" />
              {msg.ui_log_out()}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>
