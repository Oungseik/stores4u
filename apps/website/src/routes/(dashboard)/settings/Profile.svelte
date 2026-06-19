<script lang="ts">
  import ImageIcon from "@lucide/svelte/icons/image";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import SaveIcon from "@lucide/svelte/icons/save";
  import StoreIcon from "@lucide/svelte/icons/store";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { invalidateAll } from "$app/navigation";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  type Shop = PageProps["data"];

  interface Props {
    shop: Shop;
  }

  let { shop }: Props = $props();

  const shopSettings = $derived({
    profile: {
      name: shop.name ?? "",
      title: shop.title ?? "",
      description: shop.description ?? "",
      logo: shop.logo ?? "",
      heroImage: shop.heroImage ?? "",
    },
    business: {
      address: shop.address ?? "",
      city: shop.city ?? "",
      state: shop.state ?? "",
      zipCode: shop.zipCode ?? "",
      country: shop.country ?? "US",
      phone: shop.phone ?? "",
      email: shop.email ?? "",
      taxId: shop.taxId ?? "",
    },
  });

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

  const uploadMutation = createMutation(() =>
    orpc.images.upload.mutationOptions({
      onError: () => {
        toast.error("Failed to upload image");
      },
    })
  );

  let logoPreview = $derived(shop.logo);
  let heroImagePreview = $derived(shop.heroImage);
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
      const result = await uploadMutation.mutateAsync({ file });
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
      const result = await uploadMutation.mutateAsync({ file });
      profileForm.setFieldValue("heroImage", result.objectPath);
      heroImagePreview = result.objectPath;
    } catch {
      toast.error("Failed to upload hero image");
    } finally {
      isUploadingHeroImage = false;
    }
  }

  function handleLogoRemove() {
    profileForm.setFieldValue("logo", "");
    logoPreview = null;
  }

  function handleHeroImageRemove() {
    profileForm.setFieldValue("heroImage", "");
    heroImagePreview = null;
  }

  const profileForm = createForm(() => ({
    defaultValues: shopSettings.profile,
    onSubmit: async () => {
      // TODO: redesign settings page with separate shop info form
      // await updateShopMutation.mutateAsync({...});
    },
  }));
</script>

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
            z.string().min(1, "Shop name is required").max(100).safeParse(value).error?.issues.at(0)
              ?.message,
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

      <profileForm.Field
        name="title"
        validators={{
          onChange: ({ value }) =>
            z.string().max(200).optional().safeParse(value).error?.issues.at(0)?.message,
        }}
      >
        {#snippet children(field)}
          <div class="space-y-2">
            <Label for={field.name}>Shop Title</Label>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onblur={field.handleBlur}
              onchange={(e) => field.handleChange(e.currentTarget.value)}
              placeholder="My Awesome Shop - Best Products in Town"
            />
            <p class="text-muted-foreground text-xs">The display title shown on your shop page</p>
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
                variant="secondary"
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
                <Button type="button" variant="outline" class="pointer-events-none gap-2" disabled>
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
                variant="secondary"
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
            <div class="bg-muted flex h-32 w-full items-center justify-center rounded-lg border">
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
                <Button type="button" variant="outline" class="pointer-events-none gap-2" disabled>
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
