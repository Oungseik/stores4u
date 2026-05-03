<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Password from "@repo/ui/password";
  import { createForm } from "@tanstack/svelte-form";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";

  import { page } from "$app/state";
  import { authClient } from "$lib/auth_client";
  import SocialOauthBtnsGroup from "$lib/components/groups/SocialOAuthBtnsGroup.svelte";
  import { returnUrlSchema } from "$lib/search_param";

  let isSubmitting = $state(false);
  const defaultValues = { email: "", password: "" };

  const params = useSearchParams(returnUrlSchema, { noScroll: true });

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      isSubmitting = true;
      authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
          rememberMe: true,
          callbackURL: params.return_url || "/",
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
        }
      );
    },
  }));
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <a href="/" class="flex items-center gap-2 self-center">
      <div
        class="flex size-8 items-center justify-center rounded-md bg-zinc-900 text-sm font-bold text-white"
      >
        S4
      </div>
    </a>

    <Card.Root>
      <Card.Header class="text-center">
        <Card.Title class="text-xl">Welcome back</Card.Title>
        <Card.Description>Enter your email below to sign in to your account</Card.Description>
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
                  id={field.name}
                  name={field.name}
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

          <form.Field name="password">
            {#snippet children(field)}
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <Label for={field.name}>Password</Label>
                  <a href="/forgot-password" class="text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </a>
                </div>
                <Password.Root>
                  <Password.Input
                    required
                    onchange={(e) => {
                      if (e.target instanceof HTMLInputElement) {
                        field.handleChange(e.target.value);
                      }
                    }}
                  >
                    <Password.ToggleVisibility />
                  </Password.Input>
                </Password.Root>
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
        </form>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
          </div>
        </div>

        <SocialOauthBtnsGroup />

        <div class="mt-6 text-center text-sm">
          Don't have an account?
          <a
            href={`/signup${page.url.search}`}
            class={buttonVariants({ variant: "link", class: "px-0" })}
          >
            Sign up
          </a>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</div>
