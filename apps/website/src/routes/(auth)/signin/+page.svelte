<script lang="ts">
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
          callbackURL: page.url.searchParams.get("return_url") || "/",
        },
        {
          onError: ({ error }) => {
            if (error.status === 403) {
              isSubmitting = false;
              return void toast.error("Please verify your email address");
            }
            isSubmitting = false;
            return void toast.error(error.message);
          },
        },
      );
    },
  }));
</script>

<div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <a href="/" class="flex items-center gap-2 self-center font-medium">
      <img src="/logo.svg" class="size-5" alt="logo" />
      <span>{PUBLIC_SITE_NAME}</span>
    </a>

    <Card.Root>
      <Card.Header class="text-center">
        <Card.Title class="text-xl">Welcome back</Card.Title>
        <Card.Description>Enter your email below and sign in to your account.</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if page.url.searchParams.get("setup") === "1"}
          <p class="text-muted-foreground mb-6 text-sm">
            Owner account created. Check your email to verify it, then sign in.
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
                <Label for={field.name}>Email</Label>
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
                  <div class="flex items-center justify-between">
                    <Label for={field.name}>Password</Label>
                    <a
                      href={"/forgot-password".concat(page.url.search)}
                      class="text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
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
                Sign in
              {/if}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
