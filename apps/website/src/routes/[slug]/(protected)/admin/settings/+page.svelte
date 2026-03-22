<script lang="ts">
  import BuildingIcon from "@lucide/svelte/icons/building-2";
  import CreditCardIcon from "@lucide/svelte/icons/credit-card";
  import ImageIcon from "@lucide/svelte/icons/image";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MailIcon from "@lucide/svelte/icons/mail";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import PercentIcon from "@lucide/svelte/icons/percent";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import SaveIcon from "@lucide/svelte/icons/save";
  import StoreIcon from "@lucide/svelte/icons/store";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import UserIcon from "@lucide/svelte/icons/user";
  import UsersIcon from "@lucide/svelte/icons/users";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Checkbox } from "@repo/ui/checkbox";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Select from "@repo/ui/select";
  import { Separator } from "@repo/ui/separator";
  import { Switch } from "@repo/ui/switch";
  import * as Tabs from "@repo/ui/tabs";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { invalidateAll } from "$app/navigation";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  const shopSettings = $derived({
    profile: {
      name: shop.name ?? "",
      title: shop.title,
      description: shop.description,
      logo: shop.logo,
      heroImage: shop.heroImage,
    },
    business: {
      address: shop.address,
      city: shop.city,
      state: shop.state ?? "",
      zipCode: shop.zipCode ?? "",
      country: shop.country ?? "US",
      phone: shop.phone,
      email: shop.email ?? "",
      taxId: shop.taxId ?? "",
    },
  });

  const mockSettings = {
    payment: {
      currency: "USD",
      acceptCash: true,
      acceptCard: true,
      acceptDigitalWallet: false,
    },
    receipt: {
      showLogo: true,
      showAddress: true,
      showPhone: true,
      showEmail: false,
      footerText: "Thank you for your business!",
    },
    tax: {
      enabled: true,
      rate: 8.875,
      name: "Sales Tax",
      applyToAll: true,
    },
    notifications: {
      emailReceipts: true,
      lowStockAlerts: true,
      dailyReports: false,
      newOrderNotifications: true,
    },
    team: [
      { id: "1", name: "John Doe", email: "john@example.com", role: "owner" },
      { id: "2", name: "Jane Smith", email: "jane@example.com", role: "manager" },
      { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "cashier" },
    ],
  };

  const updateShopMutation = createMutation(() =>
    orpc.shops.update.mutationOptions({
      onSuccess: () => {
        toast.success("Settings updated successfully");
        invalidateAll();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update settings");
      },
    })
  );

  const getUploadUrlMutation = createMutation(() =>
    orpc.images.getUploadUrl.mutationOptions({
      onError: () => {
        toast.error("Failed to upload image");
      },
    })
  );

  const confirmUploadMutation = createMutation(() =>
    orpc.images.confirmUpload.mutationOptions({
      onError: () => {
        toast.error("Failed to upload image");
      },
    })
  );

  let logoPreview = $state<string | null>(shop.logo);
  let heroImagePreview = $state<string | null>(shop.heroImage);
  let isUploadingLogo = $state(false);
  let isUploadingHeroImage = $state(false);

  const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as const;
  type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

  function isValidImageType(type: string): type is AcceptedImageType {
    return ACCEPTED_IMAGE_TYPES.includes(type as AcceptedImageType);
  }

  async function handleLogoUpload(file: File) {
    if (!isValidImageType(file.type)) {
      toast.error("Invalid image type. Accepted: JPEG, PNG, WebP, SVG");
      return;
    }

    isUploadingLogo = true;
    try {
      const { uploadUrl, objectKey } = await getUploadUrlMutation.mutateAsync({
        slug: shop.slug,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const result = await confirmUploadMutation.mutateAsync({ slug: shop.slug, objectKey });
      profileForm.setFieldValue("logo", result.objectPath);
      logoPreview = result.objectPath;
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      isUploadingLogo = false;
    }
  }

  async function handleHeroImageUpload(file: File) {
    if (!isValidImageType(file.type)) {
      toast.error("Invalid image type. Accepted: JPEG, PNG, WebP, SVG");
      return;
    }

    isUploadingHeroImage = true;
    try {
      const { uploadUrl, objectKey } = await getUploadUrlMutation.mutateAsync({
        slug: shop.slug,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const result = await confirmUploadMutation.mutateAsync({ slug: shop.slug, objectKey });
      profileForm.setFieldValue("heroImage", result.objectPath);
      heroImagePreview = result.objectPath;
    } catch {
      toast.error("Failed to upload hero image");
    } finally {
      isUploadingHeroImage = false;
    }
  }

  function handleLogoRemove() {
    profileForm.setFieldValue("logo", null);
    logoPreview = null;
  }

  function handleHeroImageRemove() {
    profileForm.setFieldValue("heroImage", null);
    heroImagePreview = null;
  }

  const profileForm = createForm(() => ({
    defaultValues: shopSettings.profile,
    onSubmit: async ({ value }) => {
      await updateShopMutation.mutateAsync({
        slug: shop.slug,
        name: value.name,
        title: value.title,
        description: value.description,
        logo: value.logo ?? undefined,
        heroImage: value.heroImage ?? undefined,
        address: shopSettings.business.address,
        city: shopSettings.business.city,
        state: shopSettings.business.state || undefined,
        zipCode: shopSettings.business.zipCode || undefined,
        country: shopSettings.business.country,
        phone: shopSettings.business.phone,
        email: shopSettings.business.email || undefined,
        taxId: shopSettings.business.taxId || undefined,
      });
    },
  }));

  const businessForm = createForm(() => ({
    defaultValues: shopSettings.business,
    onSubmit: async ({ value }) => {
      await updateShopMutation.mutateAsync({
        slug: shop.slug,
        name: shopSettings.profile.name,
        title: shopSettings.profile.title,
        description: shopSettings.profile.description,
        logo: shopSettings.profile.logo ?? undefined,
        heroImage: shopSettings.profile.heroImage ?? undefined,
        address: value.address,
        city: value.city,
        state: value.state || undefined,
        zipCode: value.zipCode || undefined,
        country: value.country,
        phone: value.phone,
        email: value.email || undefined,
        taxId: value.taxId || undefined,
      });
    },
  }));

  // Payment form
  const paymentForm = createForm(() => ({
    defaultValues: mockSettings.payment,
    onSubmit: async ({ value }) => {
      // TODO: Replace with API call
      console.log("Saving payment settings:", value);
      toast.success("Payment settings updated");
    },
  }));

  // Receipt form
  const receiptForm = createForm(() => ({
    defaultValues: mockSettings.receipt,
    onSubmit: async ({ value }) => {
      // TODO: Replace with API call
      console.log("Saving receipt settings:", value);
      toast.success("Receipt settings updated");
    },
  }));

  // Tax form
  const taxForm = createForm(() => ({
    defaultValues: mockSettings.tax,
    onSubmit: async ({ value }) => {
      // TODO: Replace with API call
      console.log("Saving tax settings:", value);
      toast.success("Tax settings updated");
    },
  }));

  // Notifications form
  const notificationForm = createForm(() => ({
    defaultValues: mockSettings.notifications,
    onSubmit: async ({ value }) => {
      // TODO: Replace with API call
      console.log("Saving notification settings:", value);
      toast.success("Notification preferences updated");
    },
  }));

  const currencies = [
    { value: "USD", label: "US Dollar ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "British Pound (£)" },
    { value: "CAD", label: "Canadian Dollar (C$)" },
    { value: "AUD", label: "Australian Dollar (A$)" },
    { value: "JPY", label: "Japanese Yen (¥)" },
  ];

  const countries: { value: "MM" | "TH" | "US"; label: string }[] = [
    { value: "US", label: "United States" },
    { value: "TH", label: "Thailand" },
    { value: "MM", label: "Myanmar" },
  ];

  let activeTab = $state("profile");
</script>

<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: "Dashboard", href: `/${shop.slug}/admin` }, { label: "Settings" }]}
  />

  <!-- Settings Tabs -->
  <Tabs.Root bind:value={activeTab} class="w-full max-w-2xl">
    <div class="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <Tabs.List
        class="bg-muted inline-flex h-auto w-max min-w-full gap-1 rounded-lg p-1 md:grid md:w-full md:grid-cols-4 lg:grid-cols-7"
      >
        <Tabs.Trigger value="profile" class="gap-2">
          <StoreIcon class="size-4" />
          <span class="hidden sm:inline">Profile</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="business" class="gap-2">
          <BuildingIcon class="size-4" />
          <span class="hidden sm:inline">Business</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="payment" class="gap-2">
          <CreditCardIcon class="size-4" />
          <span class="hidden sm:inline">Payment</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="receipt" class="gap-2">
          <ReceiptIcon class="size-4" />
          <span class="hidden sm:inline">Receipt</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="tax" class="gap-2">
          <PercentIcon class="size-4" />
          <span class="hidden sm:inline">Tax</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="notifications" class="gap-2">
          <MailIcon class="size-4" />
          <span class="hidden sm:inline">Alerts</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="team" class="gap-2">
          <UsersIcon class="size-4" />
          <span class="hidden sm:inline">Team</span>
        </Tabs.Trigger>
      </Tabs.List>
    </div>

    <!-- Profile Tab -->
    <Tabs.Content value="profile" class="mt-6">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <StoreIcon class="size-5" />
            Shop Profile
          </Card.Title>
          <Card.Description>Manage your shop's public profile and branding</Card.Description>
        </Card.Header>
        <Card.Content>
          <form
            class="space-y-6"
            onsubmit={(e) => {
              e.preventDefault();
              profileForm.handleSubmit();
            }}
          >
            <profileForm.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  z
                    .string()
                    .min(1, "Shop name is required")
                    .max(100)
                    .safeParse(value)
                    .error?.issues.at(0)?.message,
              }}
            >
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Shop Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="Your shop name"
                  />
                  {#if field.state.meta.errors.length}
                    <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                  {/if}
                </div>
              {/snippet}
            </profileForm.Field>

            <profileForm.Field name="description">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Description</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="Brief description of your shop"
                    rows={3}
                  />
                </div>
              {/snippet}
            </profileForm.Field>

            <div class="space-y-2">
              <Label>Shop Logo</Label>
              {#if logoPreview}
                <div class="flex items-center gap-4">
                  <div class="relative">
                    <img
                      src={logoPreview}
                      alt="Shop logo"
                      class="bg-muted flex size-20 items-center justify-center rounded-lg border object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      class="absolute -top-2 -right-2 size-6"
                      onclick={handleLogoRemove}
                    >
                      <XIcon class="size-3" />
                    </Button>
                  </div>
                </div>
              {:else}
                <div class="flex items-center gap-4">
                  <div class="bg-muted flex size-20 items-center justify-center rounded-lg border">
                    <StoreIcon class="text-muted-foreground size-8" />
                  </div>
                  <div class="relative">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      class={[
                        "absolute inset-0 cursor-pointer opacity-0",
                        isUploadingLogo && "invisible",
                      ]}
                      onchange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                      disabled={isUploadingLogo}
                    />
                    {#if isUploadingLogo}
                      <Button
                        type="button"
                        variant="outline"
                        class="pointer-events-none gap-2"
                        disabled
                      >
                        <Loader2Icon class="size-4 animate-spin" />
                        <span class="ml-2">Uploading...</span>
                      </Button>
                    {:else}
                      <Button type="button" variant="outline" class="pointer-events-none gap-2">
                        <UploadIcon class="size-4" />
                        Upload Logo
                      </Button>
                    {/if}
                  </div>
                </div>
              {/if}
              <p class="text-muted-foreground text-xs">Recommended size: 400x400px. Max 2MB.</p>
            </div>

            <div class="space-y-2">
              <Label>Hero Image</Label>
              {#if heroImagePreview}
                <div class="space-y-4">
                  <div class="relative">
                    <img
                      src={heroImagePreview}
                      alt="Shop hero banner"
                      class="bg-muted w-full rounded-lg border object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      class="absolute top-2 right-2"
                      onclick={handleHeroImageRemove}
                    >
                      <XIcon class="mr-1 size-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              {:else}
                <div class="space-y-4">
                  <div
                    class="bg-muted flex h-32 w-full items-center justify-center rounded-lg border"
                  >
                    <ImageIcon class="text-muted-foreground size-12" />
                  </div>
                  <div class="relative">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      class={[
                        "absolute inset-0 cursor-pointer opacity-0",
                        isUploadingHeroImage && "invisible",
                      ]}
                      onchange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) handleHeroImageUpload(file);
                      }}
                      disabled={isUploadingHeroImage}
                    />
                    {#if isUploadingHeroImage}
                      <Button
                        type="button"
                        variant="outline"
                        class="pointer-events-none gap-2"
                        disabled
                      >
                        <Loader2Icon class="size-4 animate-spin" />
                        <span class="ml-2">Uploading...</span>
                      </Button>
                    {:else}
                      <Button type="button" variant="outline" class="pointer-events-none gap-2">
                        <UploadIcon class="size-4" />
                        Upload Hero Image
                      </Button>
                    {/if}
                  </div>
                </div>
              {/if}
              <p class="text-muted-foreground text-xs">
                Recommended size: 1920x600px. Max 2MB. This appears at the top of your shop page.
              </p>
            </div>

            <div class="flex justify-end">
              <Button
                type="submit"
                class="gap-2"
                disabled={updateShopMutation.isPending || isUploadingLogo || isUploadingHeroImage}
              >
                {#if updateShopMutation.isPending}
                  <Loader2Icon class="size-4 animate-spin" />
                  Saving...
                {:else}
                  <SaveIcon class="size-4" />
                  Save Changes
                {/if}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Business Tab -->
    <Tabs.Content value="business" class="mt-6">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <BuildingIcon class="size-5" />
            Business Information
          </Card.Title>
          <Card.Description>Your business address and contact details</Card.Description>
        </Card.Header>
        <Card.Content>
          <form
            class="space-y-6"
            onsubmit={(e) => {
              e.preventDefault();
              businessForm.handleSubmit();
            }}
          >
            <div class="space-y-4">
              <h3 class="text-sm font-medium">Address</h3>
              <div class="grid gap-4 sm:grid-cols-2">
                <businessForm.Field name="address">
                  {#snippet children(field)}
                    <div class="space-y-2 sm:col-span-2">
                      <Label for={field.name}>Street Address</Label>
                      <div class="relative">
                        <MapPinIcon
                          class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                        />
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onblur={field.handleBlur}
                          onchange={(e) => field.handleChange(e.currentTarget.value)}
                          placeholder="123 Main Street"
                          class="pl-10"
                        />
                      </div>
                    </div>
                  {/snippet}
                </businessForm.Field>

                <businessForm.Field name="city">
                  {#snippet children(field)}
                    <div class="space-y-2">
                      <Label for={field.name}>City</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onblur={field.handleBlur}
                        onchange={(e) => field.handleChange(e.currentTarget.value)}
                        placeholder="New York"
                      />
                    </div>
                  {/snippet}
                </businessForm.Field>

                <div class="grid grid-cols-2 gap-4">
                  <businessForm.Field name="state">
                    {#snippet children(field)}
                      <div class="space-y-2">
                        <Label for={field.name}>State</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onblur={field.handleBlur}
                          onchange={(e) => field.handleChange(e.currentTarget.value)}
                          placeholder="NY"
                        />
                      </div>
                    {/snippet}
                  </businessForm.Field>

                  <businessForm.Field name="zipCode">
                    {#snippet children(field)}
                      <div class="space-y-2">
                        <Label for={field.name}>ZIP Code</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onblur={field.handleBlur}
                          onchange={(e) => field.handleChange(e.currentTarget.value)}
                          placeholder="10001"
                        />
                      </div>
                    {/snippet}
                  </businessForm.Field>
                </div>

                <businessForm.Field name="country">
                  {#snippet children(field)}
                    <div class="space-y-2 sm:col-span-2">
                      <Label for={field.name}>Country</Label>
                      <Select.Root
                        type="single"
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value as "MM" | "TH" | "US")}
                      >
                        <Select.Trigger class="w-full">
                          {countries.find((c) => c.value === field.state.value)?.label ??
                            "Select country"}
                        </Select.Trigger>
                        <Select.Content>
                          {#each countries as country}
                            <Select.Item value={country.value}>{country.label}</Select.Item>
                          {/each}
                        </Select.Content>
                      </Select.Root>
                    </div>
                  {/snippet}
                </businessForm.Field>
              </div>
            </div>

            <Separator />

            <div class="space-y-4">
              <h3 class="text-sm font-medium">Contact Information</h3>
              <div class="grid gap-4 sm:grid-cols-2">
                <businessForm.Field name="phone">
                  {#snippet children(field)}
                    <div class="space-y-2">
                      <Label for={field.name}>Phone Number</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onblur={field.handleBlur}
                        onchange={(e) => field.handleChange(e.currentTarget.value)}
                        placeholder="+1 (555) 123-4567"
                        type="tel"
                      />
                    </div>
                  {/snippet}
                </businessForm.Field>

                <businessForm.Field name="email">
                  {#snippet children(field)}
                    <div class="space-y-2">
                      <Label for={field.name}>Email Address</Label>
                      <div class="relative">
                        <MailIcon
                          class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                        />
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onblur={field.handleBlur}
                          onchange={(e) => field.handleChange(e.currentTarget.value)}
                          placeholder="hello@yourshop.com"
                          type="email"
                          class="pl-10"
                        />
                      </div>
                    </div>
                  {/snippet}
                </businessForm.Field>

                <businessForm.Field name="taxId">
                  {#snippet children(field)}
                    <div class="space-y-2">
                      <Label for={field.name}>Tax ID / VAT Number</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onblur={field.handleBlur}
                        onchange={(e) => field.handleChange(e.currentTarget.value)}
                        placeholder="12-3456789"
                      />
                    </div>
                  {/snippet}
                </businessForm.Field>
              </div>
            </div>

            <div class="flex justify-end">
              <Button type="submit" class="gap-2" disabled={updateShopMutation.isPending}>
                {#if updateShopMutation.isPending}
                  <Loader2Icon class="size-4 animate-spin" />
                  Saving...
                {:else}
                  <SaveIcon class="size-4" />
                  Save Changes
                {/if}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Payment Tab -->
    <Tabs.Content value="payment" class="mt-6">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <CreditCardIcon class="size-5" />
            Payment Settings
          </Card.Title>
          <Card.Description>Configure accepted payment methods and currency</Card.Description>
        </Card.Header>
        <Card.Content>
          <form
            class="space-y-6"
            onsubmit={(e) => {
              e.preventDefault();
              paymentForm.handleSubmit();
            }}
          >
            <paymentForm.Field name="currency">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Default Currency</Label>
                  <Select.Root
                    type="single"
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <Select.Trigger class="w-full sm:w-[300px]">
                      {currencies.find((c) => c.value === field.state.value)?.label ??
                        "Select currency"}
                    </Select.Trigger>
                    <Select.Content>
                      {#each currencies as currency}
                        <Select.Item value={currency.value}>{currency.label}</Select.Item>
                      {/each}
                    </Select.Content>
                  </Select.Root>
                </div>
              {/snippet}
            </paymentForm.Field>

            <Separator />

            <div class="space-y-4">
              <h3 class="text-sm font-medium">Accepted Payment Methods</h3>
              <div class="space-y-3">
                <paymentForm.Field name="acceptCash">
                  {#snippet children(field)}
                    <div class="flex items-center justify-between rounded-lg border p-4">
                      <div class="space-y-0.5">
                        <Label class="text-base">Cash</Label>
                        <p class="text-muted-foreground text-sm">Accept cash payments</p>
                      </div>
                      <Switch
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                    </div>
                  {/snippet}
                </paymentForm.Field>

                <paymentForm.Field name="acceptCard">
                  {#snippet children(field)}
                    <div class="flex items-center justify-between rounded-lg border p-4">
                      <div class="space-y-0.5">
                        <Label class="text-base">Credit/Debit Cards</Label>
                        <p class="text-muted-foreground text-sm">
                          Accept card payments via terminal
                        </p>
                      </div>
                      <Switch
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                    </div>
                  {/snippet}
                </paymentForm.Field>

                <paymentForm.Field name="acceptDigitalWallet">
                  {#snippet children(field)}
                    <div class="flex items-center justify-between rounded-lg border p-4">
                      <div class="space-y-0.5">
                        <Label class="text-base">Digital Wallets</Label>
                        <p class="text-muted-foreground text-sm">Apple Pay, Google Pay, etc.</p>
                      </div>
                      <Switch
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                    </div>
                  {/snippet}
                </paymentForm.Field>
              </div>
            </div>

            <div class="flex justify-end">
              <Button type="submit" class="gap-2">
                <SaveIcon class="size-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Receipt Tab -->
    <Tabs.Content value="receipt" class="mt-6">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <ReceiptIcon class="size-5" />
            Receipt Customization
          </Card.Title>
          <Card.Description>Customize what appears on customer receipts</Card.Description>
        </Card.Header>
        <Card.Content>
          <form
            class="space-y-6"
            onsubmit={(e) => {
              e.preventDefault();
              receiptForm.handleSubmit();
            }}
          >
            <div class="space-y-4">
              <h3 class="text-sm font-medium">Receipt Elements</h3>
              <div class="space-y-3">
                <receiptForm.Field name="showLogo">
                  {#snippet children(field)}
                    <div class="flex items-center gap-3">
                      <Checkbox
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                      <Label>Show shop logo on receipts</Label>
                    </div>
                  {/snippet}
                </receiptForm.Field>

                <receiptForm.Field name="showAddress">
                  {#snippet children(field)}
                    <div class="flex items-center gap-3">
                      <Checkbox
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                      <Label>Show business address</Label>
                    </div>
                  {/snippet}
                </receiptForm.Field>

                <receiptForm.Field name="showPhone">
                  {#snippet children(field)}
                    <div class="flex items-center gap-3">
                      <Checkbox
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                      <Label>Show phone number</Label>
                    </div>
                  {/snippet}
                </receiptForm.Field>

                <receiptForm.Field name="showEmail">
                  {#snippet children(field)}
                    <div class="flex items-center gap-3">
                      <Checkbox
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                      <Label>Show email address</Label>
                    </div>
                  {/snippet}
                </receiptForm.Field>
              </div>
            </div>

            <Separator />

            <receiptForm.Field name="footerText">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Receipt Footer Text</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="Thank you message or return policy"
                    rows={2}
                  />
                  <p class="text-muted-foreground text-xs">
                    This text appears at the bottom of every receipt
                  </p>
                </div>
              {/snippet}
            </receiptForm.Field>

            <div class="flex justify-end">
              <Button type="submit" class="gap-2">
                <SaveIcon class="size-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Tax Tab -->
    <Tabs.Content value="tax" class="mt-6">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <PercentIcon class="size-5" />
            Tax Settings
          </Card.Title>
          <Card.Description>Configure tax rates and application rules</Card.Description>
        </Card.Header>
        <Card.Content>
          <form
            class="space-y-6"
            onsubmit={(e) => {
              e.preventDefault();
              taxForm.handleSubmit();
            }}
          >
            <taxForm.Field name="enabled">
              {#snippet children(field)}
                <div class="flex items-center justify-between rounded-lg border p-4">
                  <div class="space-y-0.5">
                    <Label class="text-base">Enable Tax</Label>
                    <p class="text-muted-foreground text-sm">Apply tax to transactions</p>
                  </div>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </div>
              {/snippet}
            </taxForm.Field>

            {#if taxForm.getFieldValue("enabled")}
              <div class="grid gap-4 sm:grid-cols-2">
                <taxForm.Field name="name">
                  {#snippet children(field)}
                    <div class="space-y-2">
                      <Label for={field.name}>Tax Name</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onblur={field.handleBlur}
                        onchange={(e) => field.handleChange(e.currentTarget.value)}
                        placeholder="Sales Tax, VAT, etc."
                      />
                    </div>
                  {/snippet}
                </taxForm.Field>

                <taxForm.Field name="rate">
                  {#snippet children(field)}
                    <div class="space-y-2">
                      <Label for={field.name}>Tax Rate (%)</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onblur={field.handleBlur}
                        onchange={(e) =>
                          field.handleChange(Number.parseFloat(e.currentTarget.value) || 0)}
                        type="number"
                        step="0.001"
                        min="0"
                        max="100"
                        placeholder="8.875"
                      />
                    </div>
                  {/snippet}
                </taxForm.Field>
              </div>

              <taxForm.Field name="applyToAll">
                {#snippet children(field)}
                  <div class="flex items-center gap-3">
                    <Checkbox
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                    <Label>Apply tax to all products by default</Label>
                  </div>
                {/snippet}
              </taxForm.Field>
            {/if}

            <div class="flex justify-end">
              <Button type="submit" class="gap-2">
                <SaveIcon class="size-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Notifications Tab -->
    <Tabs.Content value="notifications" class="mt-6">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <MailIcon class="size-5" />
            Notification Preferences
          </Card.Title>
          <Card.Description>Choose what notifications you want to receive</Card.Description>
        </Card.Header>
        <Card.Content>
          <form
            class="space-y-6"
            onsubmit={(e) => {
              e.preventDefault();
              notificationForm.handleSubmit();
            }}
          >
            <div class="space-y-4">
              <notificationForm.Field name="emailReceipts">
                {#snippet children(field)}
                  <div class="flex items-center justify-between rounded-lg border p-4">
                    <div class="space-y-0.5">
                      <Label class="text-base">Email Receipts</Label>
                      <p class="text-muted-foreground text-sm">
                        Send email copies of receipts to customers
                      </p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                  </div>
                {/snippet}
              </notificationForm.Field>

              <notificationForm.Field name="lowStockAlerts">
                {#snippet children(field)}
                  <div class="flex items-center justify-between rounded-lg border p-4">
                    <div class="space-y-0.5">
                      <Label class="text-base">Low Stock Alerts</Label>
                      <p class="text-muted-foreground text-sm">
                        Get notified when inventory is running low
                      </p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                  </div>
                {/snippet}
              </notificationForm.Field>

              <notificationForm.Field name="dailyReports">
                {#snippet children(field)}
                  <div class="flex items-center justify-between rounded-lg border p-4">
                    <div class="space-y-0.5">
                      <Label class="text-base">Daily Reports</Label>
                      <p class="text-muted-foreground text-sm">
                        Receive daily sales summary via email
                      </p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                  </div>
                {/snippet}
              </notificationForm.Field>

              <notificationForm.Field name="newOrderNotifications">
                {#snippet children(field)}
                  <div class="flex items-center justify-between rounded-lg border p-4">
                    <div class="space-y-0.5">
                      <Label class="text-base">New Order Notifications</Label>
                      <p class="text-muted-foreground text-sm">Real-time alerts for new orders</p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                  </div>
                {/snippet}
              </notificationForm.Field>
            </div>

            <div class="flex justify-end">
              <Button type="submit" class="gap-2">
                <SaveIcon class="size-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Team Tab -->
    <Tabs.Content value="team" class="mt-6">
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between">
          <div>
            <Card.Title class="flex items-center gap-2">
              <UsersIcon class="size-5" />
              Team Members
            </Card.Title>
            <Card.Description>Manage access and permissions</Card.Description>
          </div>
          <Button variant="outline" class="gap-2">
            <UserIcon class="size-4" />
            Invite Member
          </Button>
        </Card.Header>
        <Card.Content>
          <div class="space-y-4">
            {#each mockSettings.team as member}
              <div class="flex items-center justify-between rounded-lg border p-4">
                <div class="flex items-center gap-3">
                  <div class="bg-muted flex size-10 items-center justify-center rounded-full">
                    <UserIcon class="text-muted-foreground size-5" />
                  </div>
                  <div>
                    <p class="font-medium">{member.name}</p>
                    <p class="text-muted-foreground text-sm">{member.email}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    class="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                  >
                    {member.role}
                  </span>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            {/each}
          </div>

          <Separator class="my-6" />

          <div class="rounded-lg border border-dashed p-6 text-center">
            <UsersIcon class="text-muted-foreground mx-auto size-8" />
            <h3 class="mt-2 font-medium">Add team members</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              Invite colleagues to help manage your shop
            </p>
            <Button variant="outline" class="mt-4 gap-2">
              <UserIcon class="size-4" />
              Invite Member
            </Button>
          </div>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
  </Tabs.Root>
</section>
