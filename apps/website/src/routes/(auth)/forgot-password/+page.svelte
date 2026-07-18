<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import * as msg from "$lib/paraglide/messages";
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
    <a href={localizePath("/signin")} class="text-center font-medium">{msg.ui_back_to_sign_in()}</a>
    <Card.Root>
      <Card.Header>
        <Card.Title>{msg.ui_forgot_password()}</Card.Title>
        <Card.Description>{msg.ui_enter_your_email_and_we_ll_send_a_reset_link()}</Card.Description>
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
                <Label for={field.name}>{msg.ui_email()}</Label>
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
          {msg.ui_if_an_account_exists_for_that_email_a_reset_link_is_rea()}
        </p>
      {/if}
    {/if}
  </div>
</div>
