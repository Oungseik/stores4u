<script lang="ts">
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
  import { PUBLIC_SITE_NAME } from "$env/static/public";
  import { orpc } from "$lib/orpc_client";

  let isSubmitting = $state(false);
  const defaultValues = { name: "", slug: "" };

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      isSubmitting = true;
      try {
        await createShopMutation.mutateAsync({
          name: value.name,
          slug: value.slug,
        });
        goto("/");
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
    orpc.shops.createShop.mutationOptions({
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

<div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <a href="/" class="flex items-center gap-2 self-center font-medium">
      <img src="/logo.svg" class="size-5" alt="logo" />
      <span>{PUBLIC_SITE_NAME}</span>
    </a>

    <Card.Root>
      <Card.Header class="text-center">
        <Card.Title class="text-xl">Set Up Your Shop</Card.Title>
        <Card.Description>Create your first shop to start selling</Card.Description>
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
          <div class="space-y-4">
            <form.Field
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
            </form.Field>

            <form.Field
              name="slug"
              validators={{
                onChange: ({ value }) =>
                  z
                    .string()
                    .min(1, "Slug is required")
                    .max(100)
                    .regex(
                      /^[a-z0-9-]+$/,
                      "Slug must contain only lowercase letters, numbers, and hyphens"
                    )
                    .safeParse(value)
                    .error?.issues.at(0)?.message,
              }}
            >
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Slug</Label>
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground text-sm"
                      >{PUBLIC_SITE_NAME.toLowerCase()}.com/</span
                    >
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
                  </div>
                  {#if field.state.meta.errors.length}
                    <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                  {/if}
                </div>
              {/snippet}
            </form.Field>

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
