<script lang="ts">
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
        toast.error("Reset token is missing.");
        return;
      }
      if (value.password !== value.confirm) {
        toast.error("Passwords do not match.");
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
        toast.success("Password reset. Sign in.");
        await goto("/signin");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Reset failed.");
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
        <Card.Title>Set a new password</Card.Title>
        <Card.Description>Choose a new password for your account.</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if !token}
          <p class="text-destructive text-sm">Reset token is missing. Use the link from your email or administrator.</p>
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
                  <Label for={field.name}>New password</Label>
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
                  <Label for={field.name}>Confirm password</Label>
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
