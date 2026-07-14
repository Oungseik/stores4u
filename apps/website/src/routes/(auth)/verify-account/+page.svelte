<script lang="ts">
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
        toast.success("Email verified.");
        redirect = setTimeout(() => goto("/signin"), 1200);
      } catch {
        if (cancelled) return;
        status = "error";
        toast.error("Could not verify email. The link may be invalid or expired.");
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
          <Card.Description>Verifying your email…</Card.Description>
        {:else if status === "ok"}
          <Card.Title>Verified</Card.Title>
          <Card.Description>Redirecting you to sign in…</Card.Description>
        {:else}
          <Card.Title>Verification failed</Card.Title>
          <Card.Description>Ask for a new link, or sign in if already verified.</Card.Description>
          <a href="/signin" class="text-primary text-sm">Go to sign in</a>
        {/if}
      </Card.Header>
    </Card.Root>
  </div>
</div>
