<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { createForm } from "@tanstack/svelte-form";
  import { orpc } from "$lib/orpc_client";
  import AuthLinkPair from "$lib/components/auth/AuthLinkPair.svelte";
  import type { LinkPair } from "$lib/server/links";

  let isSubmitting = $state(false);
  let result = $state<{ links: LinkPair | null; emailSent: boolean } | null>(null);

  const form = createForm(() => ({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      isSubmitting = true;
      try {
        result = await orpc.recovery.request.call({ email: value.email });
      } finally {
        isSubmitting = false;
      }
    },
  }));
</script>

<div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <a href="/signin" class="text-center font-medium">← Back to sign in</a>
    <Card.Root>
      <Card.Header>
        <Card.Title>Forgot password</Card.Title>
        <Card.Description>Enter your email and we'll send a reset link.</Card.Description>
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
          <Button disabled={isSubmitting} type="submit" class="w-full">
            {#if isSubmitting}<Loader2Icon class="animate-spin" />{:else}Send reset link{/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
    {#if result}
      {#if result.links}
        <AuthLinkPair links={result.links} emailSent={result.emailSent} />
      {:else}
        <p class="text-muted-foreground text-center text-sm">
          If an account exists for that email, a reset link is ready. Contact an owner if you can't
          access it.
        </p>
      {/if}
    {/if}
  </div>
</div>
