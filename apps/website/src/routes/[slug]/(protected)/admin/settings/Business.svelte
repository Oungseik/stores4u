<script lang="ts">
  import BuildingIcon from "@lucide/svelte/icons/building-2";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MailIcon from "@lucide/svelte/icons/mail";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import SaveIcon from "@lucide/svelte/icons/save";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Select from "@repo/ui/select";
  import { Separator } from "@repo/ui/separator";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import { invalidateAll } from "$app/navigation";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  type Shop = PageProps["data"];

  interface Props {
    shop: Shop;
  }

  let { shop }: Props = $props();

  const profileSettings = $derived({
    name: shop.name ?? "",
    title: shop.title,
    description: shop.description,
    logo: shop.logo,
    heroImage: shop.heroImage,
  });

  const businessSettings = $derived({
    address: shop.address,
    city: shop.city,
    state: shop.state ?? "",
    zipCode: shop.zipCode ?? "",
    country: shop.country ?? "US",
    phone: shop.phone,
    email: shop.email ?? "",
    taxId: shop.taxId ?? "",
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

  const businessForm = createForm(() => ({
    defaultValues: businessSettings,
    onSubmit: async ({ value }) => {
      await updateShopMutation.mutateAsync({
        slug: shop.slug,
        name: profileSettings.name,
        title: profileSettings.title,
        description: profileSettings.description,
        logo: profileSettings.logo ?? undefined,
        heroImage: profileSettings.heroImage ?? undefined,
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

  const countries: { value: "MM" | "TH" | "US"; label: string }[] = [
    { value: "US", label: "United States" },
    { value: "TH", label: "Thailand" },
    { value: "MM", label: "Myanmar" },
  ];
</script>

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
