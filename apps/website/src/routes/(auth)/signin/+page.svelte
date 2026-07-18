<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { createForm } from "@tanstack/svelte-form";
  import { toast } from "svelte-sonner";

  import { page } from "$app/state";
  import { PUBLIC_SITE_NAME } from "$env/static/public";
  import { authClient } from "$lib/auth_client";

  let isSubmitting = $state(false);
  const defaultValues = { email: "", password: "" };

  // Sign-in page stays email/password. Linked Google/Facebook accounts can use
  // OAuth directly; unlinked OAuth cannot create accounts after setup.

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      isSubmitting = true;
      authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
          rememberMe: true,
          callbackURL: localizePath(page.url.searchParams.get("return_url") || "/"),
        },
        {
          onError: ({ error }) => {
            isSubmitting = false;
            return void toast.error(localizeError(error, "error_invalid_credentials"));
          },
        },
      );
    },
  }));
</script>

<div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <a href={localizePath("/")} class="flex items-center gap-2 self-center font-medium">
      <img src="/logo.svg" class="size-5" alt={msg.ui_logo_5807dd6()} />
      <span>{PUBLIC_SITE_NAME}</span>
    </a>

    <Card.Root>
      <Card.Header class="text-center">
        <Card.Title class="text-xl">{msg.ui_welcome_back()}</Card.Title>
        <Card.Description
          >{msg.ui_enter_your_email_below_and_sign_in_to_your_account()}</Card.Description
        >
      </Card.Header>
      <Card.Content>
        {#if page.url.searchParams.get("setup") === "1"}
          <p class="text-muted-foreground mb-6 text-sm">
            {msg.ui_owner_account_created_sign_in_to_continue()}
          </p>
        {/if}
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
                  name="email"
                  value={field.state.value}
                  type="email"
                  onblur={field.handleBlur}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                  placeholder="m@example.com"
                  required
                />
              </div>
            {/snippet}
          </form.Field>

          <div class="space-y-4">
            <form.Field name="password">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>{msg.ui_password()}</Label>
                  <Input
                    type="password"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    required
                  />
                </div>
              {/snippet}
            </form.Field>

            <Button disabled={isSubmitting} type="submit" class="w-full">
              {#if isSubmitting}
                <Loader2Icon class="animate-spin" />
              {:else}
                {msg.ui_sign_in()}
              {/if}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
