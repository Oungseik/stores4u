<script lang="ts">
  import CopyIcon from "@lucide/svelte/icons/copy";
  import * as Card from "@repo/ui/card";
  import { copyText } from "@repo/ui/hooks";
  import { toast } from "svelte-sonner";
  import type { LinkPair } from "$lib/server/links";

  let { links, emailSent = false }: { links: LinkPair | null; emailSent?: boolean } = $props();

  // copyText guards window.isSecureContext and falls back to a legacy textarea
  // copy — required so this works over plain http on LAN, the exact offline
  // hand-over scenario these links are built for.
  async function copy(text: string) {
    if ((await copyText(text)) === "success") toast.success("Link copied");
    else toast.error("Copy failed — select the link and copy manually.");
  }
</script>

{#if links}
  <Card.Root>
    <Card.Header>
      <Card.Title class="text-lg">Your links</Card.Title>
      <Card.Description>
        {#if emailSent}
          We emailed the online link. If the email didn't arrive (spotty internet),
          copy a link below and send it manually — SMS, WhatsApp, or read it out.
        {:else}
          Email couldn't be sent right now. Copy a link below and deliver it manually.
        {/if}
        <span class="block pt-1">Offline link works on the same wifi; online works over the internet.</span>
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-3">
      {#each [{ label: "Online", url: links.online }, { label: "Offline (same wifi)", url: links.offline }] as row (row.label)}
        <div class="space-y-1">
          <p class="text-muted-foreground text-xs font-medium">{row.label}</p>
          <div class="flex items-center gap-2">
            <code class="bg-muted flex-1 truncate rounded px-2 py-1.5 text-xs">{row.url}</code>
            <button
              type="button"
              class="hover:bg-accent rounded-md border p-2"
              onclick={() => copy(row.url)}
              aria-label="Copy {row.label} link"
            >
              <CopyIcon class="size-4" />
            </button>
          </div>
        </div>
      {/each}
    </Card.Content>
  </Card.Root>
{/if}
