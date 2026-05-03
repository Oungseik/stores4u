<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { createForm } from "@tanstack/svelte-form";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { goto } from "$app/navigation";
  import { createShop } from "$lib/remote/shops/create_shop.remote";
  import { actionResultSchema } from "$lib/types/shop";

  let isSubmitting = $state(false);

  const nameField = z.string().min(1, "Shop name is required").max(100);
  const slugField = z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens");

  const shopForm = createForm(() => ({
    defaultValues: {
      name: "",
      slug: "",
    },
    onSubmit: async ({ value }) => {
      isSubmitting = true;
      try {
        const formData = new FormData();
        formData.append("name", value.name);
        formData.append("slug", value.slug);

        const response = await fetch(createShop.action, {
          method: "POST",
          body: formData,
        });

        const parsed = actionResultSchema.safeParse(await response.json());
        if (!parsed.success) {
          toast.error("Invalid response from server.");
          return;
        }
        const result = parsed.data;

        if (result.data?.success && result.data.slug) {
          toast.success("Shop created successfully!");
          goto(`/shop/${result.data.slug}`);
        } else {
          toast.error(result.data?.message || "Failed to create shop.");
        }
      } catch {
        toast.error("Failed to create shop. Please try again.");
      } finally {
        isSubmitting = false;
      }
    },
  }));

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(nameValue: string) {
    shopForm.setFieldValue("slug", generateSlug(nameValue));
  }
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
  <div class="flex w-full max-w-lg flex-col gap-6">
    <Card.Root>
      <Card.Header class="text-center">
        <Card.Title class="text-xl">Create Your Shop</Card.Title>
        <Card.Description>Pick a name and URL for your shop</Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          class="space-y-6"
          {...createShop}
          onsubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            shopForm.handleSubmit();
          }}
        >
          <div class="space-y-4">
            <shopForm.Field
              name="name"
              validators={{
                onChange: ({ value }) => nameField.safeParse(value).error?.issues.at(0)?.message,
              }}
            >
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Shop Name *</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    type="text"
                    onblur={field.handleBlur}
                    onchange={(e) => {
                      const v = e.currentTarget.value;
                      field.handleChange(v);
                      handleNameChange(v);
                    }}
                    placeholder="My Awesome Shop"
                    required
                  />
                  {#if field.state.meta.errors.length}
                    <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                  {/if}
                </div>
              {/snippet}
            </shopForm.Field>

            <shopForm.Field
              name="slug"
              validators={{
                onChange: ({ value }) => slugField.safeParse(value).error?.issues.at(0)?.message,
              }}
            >
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Slug *</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    type="text"
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="my-awesome-shop"
                    required
                  />
                  <p class="text-xs text-muted-foreground">Used in your shop URL</p>
                  {#if field.state.meta.errors.length}
                    <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                  {/if}
                </div>
              {/snippet}
            </shopForm.Field>
          </div>

          <div class="pt-4">
            <Button disabled={isSubmitting} type="submit" class="w-full">
              {#if isSubmitting}
                <Loader2Icon class="animate-spin" />
              {:else}
                Create Shop
              {/if}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
