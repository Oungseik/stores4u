<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { PUBLIC_SITE_NAME } from "$env/static/public";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { createForm } from "@tanstack/svelte-form";
  import { toast } from "svelte-sonner";
  import { orpc } from "$lib/orpc_client";

  let { data } = $props();
  const token = page.url.searchParams.get("token") ?? "";
  let isSubmitting = $state(false);

  const form = createForm(() => ({
    defaultValues: { name: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      isSubmitting = true;
      try {
        await orpc.invites.accept.call({
          token,
          name: value.name,
          email: value.email,
          password: value.password,
        });
        toast.success("Account created. Welcome aboard.");
        await goto("/");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not accept invite.");
      } finally {
        isSubmitting = false;
      }
    },
  }));
</script>

<div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <a href="/" class="text-center font-medium">
      <img src="/logo.svg" class="mr-1 inline size-5 align-middle" alt="logo" />
      {PUBLIC_SITE_NAME}
    </a>
    <Card.Root>
      <Card.Header>
        <Card.Title>You've been invited</Card.Title>
        <Card.Description>
          Set up your account. You'll join as <strong class="capitalize">{data.role}</strong>.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          class="space-y-4"
          onsubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name="name">
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>Full name</Label>
                <Input
                  id="name"
                  value={field.state.value}
                  onblur={field.handleBlur}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                  required
                />
              </div>
            {/snippet}
          </form.Field>
          <form.Field name="email">
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={field.state.value}
                  onblur={field.handleBlur}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                  placeholder="m@example.com"
                  required
                />
              </div>
            {/snippet}
          </form.Field>
          <form.Field name="password">
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>Password</Label>
                <Input
                  type="password"
                  id="password"
                  value={field.state.value}
                  onblur={field.handleBlur}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                  minlength={8}
                  required
                />
              </div>
            {/snippet}
          </form.Field>
          <Button disabled={isSubmitting} type="submit" class="w-full">
            {#if isSubmitting}<Loader2Icon class="animate-spin" />{:else}Create account{/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
