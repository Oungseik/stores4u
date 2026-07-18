<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import * as Card from "@repo/ui/card";
  import { toast } from "svelte-sonner";

  const token = page.url.searchParams.get("token");
  let status = $state<"loading" | "ok" | "error">("loading");

  // onMount (not $effect): this is a one-shot verify call on landing, not a
  // reactive sync. $effect would re-fire whenever `token` changes and left the
  // redirect setTimeout without cleanup. cancelled + clearTimeout guard a
  // navigation/unmount between the fetch resolving and state being set.
  onMount(() => {
    if (!token) {
      status = "error";
      return;
    }
    let cancelled = false;
    let redirect: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error("verification failed");
        if (cancelled) return;
        status = "ok";
        toast.success(msg.ui_email_verified());
        redirect = setTimeout(() => goto("/signin"), 1200);
      } catch {
        if (cancelled) return;
        status = "error";
        toast.error(msg.ui_could_not_verify_email_the_link_may_be_invalid_or_expir());
      }
    })();
    return () => {
      cancelled = true;
      if (redirect) clearTimeout(redirect);
    };
  });
</script>

<div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <Card.Root>
      <Card.Header class="text-center">
        {#if status === "loading"}
          <Card.Title><Loader2Icon class="animate-spin" /></Card.Title>
          <Card.Description>{msg.ui_verifying_your_email()}</Card.Description>
        {:else if status === "ok"}
          <Card.Title>{msg.ui_verified()}</Card.Title>
          <Card.Description>{msg.ui_redirecting_you_to_sign_in()}</Card.Description>
        {:else}
          <Card.Title>{msg.ui_verification_failed()}</Card.Title>
          <Card.Description
            >{msg.ui_ask_for_a_new_link_or_sign_in_if_already_verified()}</Card.Description
          >
          <a href="/signin" class="text-primary text-sm">{msg.ui_go_to_sign_in()}</a>
        {/if}
      </Card.Header>
    </Card.Root>
  </div>
</div>
