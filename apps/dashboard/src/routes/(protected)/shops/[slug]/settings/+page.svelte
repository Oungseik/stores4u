<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { PhoneInput } from "@repo/ui/phone-input";
  import * as Select from "@repo/ui/select";
  import { untrack } from "svelte";
  import { toast } from "svelte-sonner";

  import DashboardHeader from "$lib/components/dashboard-header.svelte";
  import { updateShop } from "$lib/remote/shops/update_shop.remote";
  import { shopUpdateSchema } from "$lib/types/shop";

  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const countryLabels: Record<string, string> = {
    MM: "Myanmar",
    TH: "Thailand",
    US: "United States",
  };

  untrack(() => {
    updateShop.fields.organizationId.set(data.organization.id);
    updateShop.fields.name.set(data.organization.name);
    updateShop.fields.slug.set(data.organization.slug);
    updateShop.fields.title.set(data.organization.shopInfo?.title ?? "");
    updateShop.fields.address.set(data.organization.shopInfo?.address ?? "");
    updateShop.fields.city.set(data.organization.shopInfo?.city ?? "");
    updateShop.fields.state.set(data.organization.shopInfo?.state ?? "");
    updateShop.fields.zipCode.set(data.organization.shopInfo?.zipCode ?? "");
    updateShop.fields.country.set(data.organization.shopInfo?.country ?? "US");
    updateShop.fields.phone.set(data.organization.shopInfo?.phone ?? "");
    updateShop.fields.email.set(data.organization.shopInfo?.email ?? "");
    updateShop.fields.taxId.set(data.organization.shopInfo?.taxId ?? "");
  });
</script>

<div class="flex flex-1 flex-col">
  <DashboardHeader
    breadcrumbs={[
      { label: "Shops", href: "/shops" },
      { label: data.organization.name, href: `/shops/${data.organization.slug}` },
      { label: "Settings" },
    ]}
  />

  <section class="flex flex-col gap-6 px-4 pb-8 md:px-6">
    <div>
      <h1 class="text-2xl font-bold">Settings</h1>
      <p class="text-muted-foreground">Manage your shop details and contact information.</p>
    </div>

    <Card.Root class="max-w-2xl">
      <Card.Content class="pt-6">
        <form
          onchange={() => updateShop.validate()}
          {...updateShop.preflight(shopUpdateSchema).enhance(async ({ submit }) => {
            if (await submit()) {
              const result = updateShop.result;
              if (result?.success) {
                return void toast.success("Settings updated successfully!");
              }
              toast.error(result?.message || "Failed to update settings.");
            }
          })}
          class="space-y-8"
        >
          <input {...updateShop.fields.organizationId.as("hidden", data.organization.id)} />

          <div class="space-y-4">
            <h3 class="text-sm font-medium">General</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="name">Shop Name *</Label>
                <Input
                  id="name"
                  {...updateShop.fields.name.as("text")}
                  placeholder="My Awesome Shop"
                />
                {#each updateShop.fields.name.issues() as issue}
                  <p class="text-sm text-destructive">{issue.message}</p>
                {/each}
              </div>

              <div class="space-y-2">
                <Label for="slug">Slug *</Label>
                <Input
                  id="slug"
                  {...updateShop.fields.slug.as("text")}
                  placeholder="my-awesome-shop"
                />
                {#each updateShop.fields.slug.issues() as issue}
                  <p class="text-sm text-destructive">{issue.message}</p>
                {/each}
              </div>

              <div class="space-y-2 sm:col-span-2">
                <Label for="title">Shop Title *</Label>
                <Input
                  id="title"
                  {...updateShop.fields.title.as("text")}
                  placeholder="My Awesome Shop"
                />
                {#each updateShop.fields.title.issues() as issue}
                  <p class="text-sm text-destructive">{issue.message}</p>
                {/each}
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-medium">Address</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2 sm:col-span-2">
                <Label for="address">Street Address *</Label>
                <Input
                  id="address"
                  {...updateShop.fields.address.as("text")}
                  placeholder="123 Main Street"
                />
                {#each updateShop.fields.address.issues() as issue}
                  <p class="text-sm text-destructive">{issue.message}</p>
                {/each}
              </div>

              <div class="space-y-2">
                <Label for="city">City *</Label>
                <Input id="city" {...updateShop.fields.city.as("text")} placeholder="New York" />
                {#each updateShop.fields.city.issues() as issue}
                  <p class="text-sm text-destructive">{issue.message}</p>
                {/each}
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="state">State *</Label>
                  <Input id="state" {...updateShop.fields.state.as("text")} placeholder="NY" />
                  {#each updateShop.fields.state.issues() as issue}
                    <p class="text-sm text-destructive">{issue.message}</p>
                  {/each}
                </div>

                <div class="space-y-2">
                  <Label for="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    {...updateShop.fields.zipCode.as("text")}
                    placeholder="10001"
                  />
                  {#each updateShop.fields.zipCode.issues() as issue}
                    <p class="text-sm text-destructive">{issue.message}</p>
                  {/each}
                </div>
              </div>

              <div class="space-y-2 sm:col-span-2">
                <Label for="country">Country *</Label>
                <Select.Root
                  type="single"
                  name="country"
                  value={String(updateShop.fields.country.as("text").value)}
                  onValueChange={(value) =>
                    updateShop.fields.country.set(value as "MM" | "TH" | "US")}
                >
                  <Select.Trigger class="w-full">
                    {countryLabels[String(updateShop.fields.country.as("text").value ?? "US")] ??
                      "Select country"}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="MM">Myanmar</Select.Item>
                    <Select.Item value="TH">Thailand</Select.Item>
                    <Select.Item value="US">United States</Select.Item>
                  </Select.Content>
                </Select.Root>
                {#each updateShop.fields.country.issues() as issue}
                  <p class="text-sm text-destructive">{issue.message}</p>
                {/each}
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-medium">Contact</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="phone">Phone Number *</Label>
                <PhoneInput
                  name="phone"
                  value={String(updateShop.fields.phone.as("text").value ?? "")}
                  defaultCountry={data.organization.shopInfo?.country ?? "US"}
                  placeholder="+1 234 567 8900"
                  onchange={(e) => updateShop.fields.phone.set(e.currentTarget.value)}
                />
                {#each updateShop.fields.phone.issues() as issue}
                  <p class="text-sm text-destructive">{issue.message}</p>
                {/each}
              </div>

              <div class="space-y-2">
                <Label for="email">Email Address *</Label>
                <Input
                  id="email"
                  {...updateShop.fields.email.as("text")}
                  placeholder="hello@yourshop.com"
                />
                {#each updateShop.fields.email.issues() as issue}
                  <p class="text-sm text-destructive">{issue.message}</p>
                {/each}
              </div>

              <div class="space-y-2 sm:col-span-2">
                <Label for="taxId">Tax ID (Optional)</Label>
                <Input
                  id="taxId"
                  {...updateShop.fields.taxId.as("text")}
                  placeholder="12-3456789"
                />
                {#each updateShop.fields.taxId.issues() as issue}
                  <p class="text-sm text-destructive">{issue.message}</p>
                {/each}
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <Button disabled={!!updateShop.pending} type="submit">
              {#if updateShop.pending}
                <Loader2Icon class="mr-2 size-4 animate-spin" />
                Saving...
              {:else}
                Save Changes
              {/if}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </section>
</div>
