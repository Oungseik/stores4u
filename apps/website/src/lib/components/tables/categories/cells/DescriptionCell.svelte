<script lang="ts">
  type Props = {
    description: string | null;
  };

  const { description }: Props = $props();
</script>

<span class="text-muted-foreground line-clamp-1">{description ?? "—"}</span>
