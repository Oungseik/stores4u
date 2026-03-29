<script lang="ts">
  import { Badge } from "@repo/ui/badge";

  type Props = {
    status: string;
  };

  const { status }: Props = $props();

  const statusConfig: Record<
    string,
    { variant: "secondary" | "default" | "destructive" | "outline"; label: string; class?: string }
  > = {
    UPLOADED: { variant: "secondary", label: "Uploaded" },
    PROCESSING: {
      variant: "default",
      label: "Processing",
      class:
        "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10 dark:text-amber-400",
    },
    PROCESSED: {
      variant: "default",
      label: "Ready to Review",
      class:
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10 dark:text-emerald-400",
    },
    FAILED: {
      variant: "default",
      label: "Failed",
      class: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10 dark:text-red-400",
    },
    REVIEWED: {
      variant: "default",
      label: "Reviewed",
      class:
        "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 dark:text-blue-400",
    },
    REJECTED: {
      variant: "default",
      label: "Rejected",
      class: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10 dark:text-red-400",
    },
  };

  const config = $derived(statusConfig[status] ?? { variant: "secondary" as const, label: status });
</script>

<Badge variant={config.variant} class={config.class}>
  {config.label}
</Badge>
