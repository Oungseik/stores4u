<script lang="ts">
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import BuildingIcon from "@lucide/svelte/icons/building-2";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MailIcon from "@lucide/svelte/icons/mail";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import SaveIcon from "@lucide/svelte/icons/save";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Command from "@repo/ui/command";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { PhoneInput } from "@repo/ui/phone-input";
  import * as Popover from "@repo/ui/popover";
  import * as Select from "@repo/ui/select";
  import { Separator } from "@repo/ui/separator";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import { z } from "zod";

  import { COUNTRIES, isValidTimezone, TIMEZONES } from "@repo/config";
  import { invalidateAll } from "$app/navigation";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  type Shop = PageProps["data"];

  const queryClient = useQueryClient();

  interface Props {
    shop: Shop;
  }

  let { shop }: Props = $props();

  const businessSettings = $derived({
    address: shop.address ?? "",
    city: shop.city ?? "",
    state: shop.state ?? "",
    zipCode: shop.zipCode ?? "",
    country: shop.country ?? "US",
    phone: shop.phone ?? "",
    email: shop.email ?? "",
    taxId: shop.taxId ?? "",
    timezone: shop.timezone ?? "UTC",
  });

  const requiredText = (field: string, max: number) =>
    z
      .string()
      .trim()
      .min(1, msg.error_field_required({ field }))
      .max(max, msg.error_field_too_long({ field, max }));

  const businessSchema = z.object({
    address: requiredText(msg.ui_street_address(), 200),
    city: requiredText(msg.ui_city(), 100),
    state: requiredText(msg.ui_state(), 100),
    zipCode: requiredText(msg.ui_zip_code(), 20),
    country: z.enum(COUNTRIES, {
      error: msg.error_invalid_field({ field: msg.ui_country() }),
    }),
    phone: requiredText(msg.ui_phone_number(), 50),
    email: requiredText(msg.ui_email_address(), 200).pipe(
      z.email({ error: msg.error_invalid_field({ field: msg.ui_email_address() }) }),
    ),
    taxId: z
      .string()
      .max(100, msg.error_field_too_long({ field: msg.ui_tax_id_vat_number(), max: 100 })),
    timezone: z
      .string()
      .refine(isValidTimezone, msg.error_invalid_field({ field: msg.ui_timezone() })),
  });

  const updateShopMutation = createMutation(() =>
    orpc.shops.update.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_settings_updated_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.dashboard.key() });
        invalidateAll();
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_update_settings"));
      },
    }),
  );

  const businessForm = createForm(() => ({
    defaultValues: businessSettings,
    validators: { onChange: businessSchema },
    onSubmit: async ({ value }) => {
      await updateShopMutation.mutateAsync({
        ...value,
        country: value.country as "MM" | "TH" | "US",
      });
    },
  }));

  const countries: { value: "MM" | "TH" | "US"; label: string }[] = [
    { value: "US", label: msg.ui_united_states() },
    { value: "TH", label: msg.ui_thailand() },
    { value: "MM", label: msg.ui_myanmar() },
  ];

  let tzOpen = $state(false);
  let tzSearch = $state("");
  const filteredTimezones = $derived.by(() => {
    const search = tzSearch.toLowerCase().trim();
    if (!search) return TIMEZONES.slice(0, 50);
    return TIMEZONES.filter((tz) => tz.toLowerCase().includes(search)).slice(0, 50);
  });
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <BuildingIcon class="size-5" />
      {msg.ui_business_information()}
    </Card.Title>
    <Card.Description>{msg.ui_your_business_address_and_contact_details()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      class="space-y-6"
      novalidate
      onsubmit={(e) => {
        e.preventDefault();
        businessForm.handleSubmit();
      }}
    >
      <div class="space-y-4">
        <h3 class="text-sm font-medium">{msg.ui_address()}</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <businessForm.Field name="address">
            {#snippet children(field)}
              <div class="space-y-2 sm:col-span-2">
                <Label for={field.name}>{msg.ui_street_address()}</Label>
                <div class="relative">
                  <MapPinIcon
                    class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  />
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={`${field.name}-error`}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="123 Main Street"
                    class="pl-10"
                  />
                </div>
                {#if field.state.meta.errors[0]}
                  <p id={`${field.name}-error`} class="text-destructive text-sm">
                    {field.state.meta.errors[0].message}
                  </p>
                {/if}
              </div>
            {/snippet}
          </businessForm.Field>

          <businessForm.Field name="city">
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>{msg.ui_city()}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby={`${field.name}-error`}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                  placeholder="New York"
                />
                {#if field.state.meta.errors[0]}
                  <p id={`${field.name}-error`} class="text-destructive text-sm">
                    {field.state.meta.errors[0].message}
                  </p>
                {/if}
              </div>
            {/snippet}
          </businessForm.Field>

          <div class="grid grid-cols-2 gap-4">
            <businessForm.Field name="state">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>{msg.ui_state()}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={`${field.name}-error`}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="NY"
                  />
                  {#if field.state.meta.errors[0]}
                    <p id={`${field.name}-error`} class="text-destructive text-sm">
                      {field.state.meta.errors[0].message}
                    </p>
                  {/if}
                </div>
              {/snippet}
            </businessForm.Field>

            <businessForm.Field name="zipCode">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>{msg.ui_zip_code()}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={`${field.name}-error`}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="10001"
                  />
                  {#if field.state.meta.errors[0]}
                    <p id={`${field.name}-error`} class="text-destructive text-sm">
                      {field.state.meta.errors[0].message}
                    </p>
                  {/if}
                </div>
              {/snippet}
            </businessForm.Field>
          </div>

          <businessForm.Field name="country">
            {#snippet children(field)}
              <div class="space-y-2 sm:col-span-2">
                <Label for={field.name}>{msg.ui_country()}</Label>
                <Select.Root
                  type="single"
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as "MM" | "TH" | "US")}
                >
                  <Select.Trigger
                    class="w-full"
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={`${field.name}-error`}
                  >
                    {countries.find((c) => c.value === field.state.value)?.label ??
                      "Select country"}
                  </Select.Trigger>
                  <Select.Content>
                    {#each countries as country (country.value)}
                      <Select.Item value={country.value}>{country.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
                {#if field.state.meta.errors[0]}
                  <p id={`${field.name}-error`} class="text-destructive text-sm">
                    {field.state.meta.errors[0].message}
                  </p>
                {/if}
              </div>
            {/snippet}
          </businessForm.Field>
        </div>
      </div>

      <Separator />

      <div class="space-y-4">
        <h3 class="text-sm font-medium">{msg.ui_contact_information()}</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <businessForm.Field name="phone">
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>{msg.ui_phone_number()}</Label>
                <PhoneInput
                  value={field.state.value}
                  name={field.name}
                  class={field.state.meta.errors.length ? "border-destructive z-1" : "z-1"}
                  placeholder="+1 (555) 123-4567"
                  onValueChange={(value) => field.handleChange(value)}
                />
                {#if field.state.meta.errors[0]}
                  <p id={`${field.name}-error`} class="text-destructive text-sm">
                    {field.state.meta.errors[0].message}
                  </p>
                {/if}
              </div>
            {/snippet}
          </businessForm.Field>

          <businessForm.Field name="email">
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>{msg.ui_email_address()}</Label>
                <div class="relative">
                  <MailIcon
                    class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  />
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={`${field.name}-error`}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="hello@yourshop.com"
                    type="email"
                    class="pl-10"
                  />
                </div>
                {#if field.state.meta.errors[0]}
                  <p id={`${field.name}-error`} class="text-destructive text-sm">
                    {field.state.meta.errors[0].message}
                  </p>
                {/if}
              </div>
            {/snippet}
          </businessForm.Field>

          <businessForm.Field name="taxId">
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>{msg.ui_tax_id_vat_number()}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby={`${field.name}-error`}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                  placeholder="12-3456789"
                />
                {#if field.state.meta.errors[0]}
                  <p id={`${field.name}-error`} class="text-destructive text-sm">
                    {field.state.meta.errors[0].message}
                  </p>
                {/if}
              </div>
            {/snippet}
          </businessForm.Field>
        </div>
      </div>

      <Separator />

      <div class="space-y-4">
        <h3 class="text-sm font-medium">{msg.ui_localization()}</h3>
        <businessForm.Field name="timezone">
          {#snippet children(field)}
            <div class="space-y-2">
              <Label for={field.name}>{msg.ui_timezone()}</Label>
              <p class="text-muted-foreground text-xs">
                {msg.ui_used_for_dashboard_charts_today_stats_and_date_displays()}
              </p>
              <Popover.Root bind:open={tzOpen}>
                <Popover.Trigger
                  id={field.name}
                  name={field.name}
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby={`${field.name}-error`}
                  class="hover:bg-accent hover:text-accent-foreground flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm"
                >
                  <span class="flex items-center gap-2">
                    <ClockIcon class="text-muted-foreground size-4" />
                    <span class="truncate">{field.state.value}</span>
                  </span>
                </Popover.Trigger>
                <Popover.Content class="w-(--bits-popover-anchor-width) p-0" align="start">
                  <Command.Root shouldFilter={false}>
                    <Command.Input bind:value={tzSearch} placeholder={msg.ui_search_timezone()} />
                    <Command.List>
                      {#each filteredTimezones as tz (tz)}
                        <Command.Item
                          value={tz}
                          onSelect={() => {
                            field.handleChange(tz);
                            tzOpen = false;
                          }}
                        >
                          <CheckIcon
                            class={["size-4", field.state.value !== tz && "text-transparent"]}
                          />
                          <span>{tz}</span>
                        </Command.Item>
                      {/each}
                    </Command.List>
                  </Command.Root>
                </Popover.Content>
              </Popover.Root>
              {#if field.state.meta.errors[0]}
                <p id={`${field.name}-error`} class="text-destructive text-sm">
                  {field.state.meta.errors[0].message}
                </p>
              {/if}
            </div>
          {/snippet}
        </businessForm.Field>
      </div>

      <div class="flex justify-end">
        <Button type="submit" class="gap-2" disabled={updateShopMutation.isPending}>
          {#if updateShopMutation.isPending}
            <Loader2Icon class="size-4 animate-spin" />
            {msg.ui_saving()}
          {:else}
            <SaveIcon class="size-4" />
            {msg.ui_save_changes()}
          {/if}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
