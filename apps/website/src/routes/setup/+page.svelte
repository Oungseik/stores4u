<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { goto } from "$app/navigation";
  import { PUBLIC_DOMAIN } from "$env/static/public";
  import { orpc } from "$lib/orpc_client";

  const schema = z.object({
    name: z.string().min(1, "Shop name is required").max(100),
    slug: z
      .string()
      .min(1, "Slug is required")
      .max(100)
      .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  });

  let isSubmitting = $state(false);

  const form = createForm(() => ({
    defaultValues: { name: "", slug: "" },
    onSubmit: async ({ value }) => {
      isSubmitting = true;
      try {
        await createShopMutation.mutateAsync({ name: value.name, slug: value.slug });
        goto(`/${value.slug}`);
      } catch (error) {
        isSubmitting = false;
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Failed to create shop. Please try again.");
        }
      }
    },
  }));

  const queryClient = useQueryClient();

  const createShopMutation = createMutation(() =>
    orpc.shops.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["shops"] });
      },
    })
  );

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(nameValue: string) {
    form.setFieldValue("slug", generateSlug(nameValue));
  }
</script>

<div class="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
  <div class="w-full max-w-lg">
    <a
      href="/"
      class="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2 text-sm transition-colors"
    >
      <ArrowLeftIcon class="size-4" />
      Back to shops
    </a>

    <a href="/" class="mb-6 flex items-center gap-2 self-center font-medium">
      <img src="/logo.svg" class="size-5" alt="logo" />
      <span>{PUBLIC_DOMAIN}</span>
    </a>

    <Card.Root>
      <Card.Header>
        <Card.Title class="text-2xl font-semibold tracking-tight">Create a new shop</Card.Title>
        <Card.Description>
          Choose a name and unique URL for your shop. You can update these later in settings.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          class="space-y-6"
          onsubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                schema.shape.name.safeParse(value).error?.issues.at(0)?.message,
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
                  <p class="text-destructive text-sm">{field.state.meta.errors}</p>
                {/if}
              </div>
            {/snippet}
          </form.Field>

          <form.Field
            name="slug"
            validators={{
              onChange: ({ value }) =>
                schema.shape.slug.safeParse(value).error?.issues.at(0)?.message,
            }}
          >
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>Slug *</Label>
                <div class="relative">
                  <span
                    class="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm"
                    >/</span
                  >
                  <Input
                    id={field.name}
                    name={field.name}
                    class="pl-7"
                    value={field.state.value}
                    type="text"
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="my-awesome-shop"
                    required
                  />
                </div>
                <p class="text-muted-foreground text-xs">
                  Your shop will be accessible at /{field.state.value || "your-slug"}
                </p>
                {#if field.state.meta.errors.length}
                  <p class="text-destructive text-sm">{field.state.meta.errors}</p>
                {/if}
              </div>
            {/snippet}
          </form.Field>

          <Button disabled={isSubmitting} type="submit" class="w-full">
            {#if isSubmitting}
              <Loader2Icon class="mr-2 size-4 animate-spin" />
              Creating...
            {:else}
              Create Shop
            {/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
