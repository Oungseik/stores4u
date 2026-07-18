<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { createForm } from "@tanstack/svelte-form";
  import { toast } from "svelte-sonner";

  const token = page.url.searchParams.get("token");
  let isSubmitting = $state(false);

  const form = createForm(() => ({
    defaultValues: { password: "", confirm: "" },
    onSubmit: async ({ value }) => {
      if (!token) {
        toast.error(msg.ui_reset_token_is_missing());
        return;
      }
      if (value.password !== value.confirm) {
        toast.error(msg.ui_passwords_do_not_match_f7c3cd4());
        return;
      }
      isSubmitting = true;
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, newPassword: value.password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message ?? "Reset failed. The link may be invalid or expired.");
        }
        toast.success(msg.ui_password_reset_sign_in());
        await goto(localizePath("/signin"));
      } catch (err) {
        toast.error(localizeError(err, "ui_reset_failed"));
      } finally {
        isSubmitting = false;
      }
    },
  }));
</script>

<div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <Card.Root>
      <Card.Header>
        <Card.Title>{msg.ui_set_a_new_password()}</Card.Title>
        <Card.Description>{msg.ui_choose_a_new_password_for_your_account()}</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if !token}
          <p class="text-destructive text-sm">
            {msg.ui_reset_token_is_missing_use_the_link_from_your_email_or_()}
          </p>
        {:else}
          <form
            class="space-y-4"
            onsubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field name="password">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>{msg.ui_new_password_d850ee1()}</Label>
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
            <form.Field name="confirm">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>{msg.ui_confirm_password()}</Label>
                  <Input
                    type="password"
                    id="confirm"
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
              {#if isSubmitting}<Loader2Icon class="animate-spin" />{:else}Reset password{/if}
            </Button>
          </form>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
