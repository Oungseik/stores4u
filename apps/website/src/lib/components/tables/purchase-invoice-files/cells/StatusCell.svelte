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
      class: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
    },
    PROCESSED: {
      variant: "default",
      label: "Ready to Review",
      class: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
    },
    FAILED: { variant: "destructive", label: "Failed" },
    REVIEWED: { variant: "outline", label: "Reviewed" },
    REJECTED: {
      variant: "default",
      label: "Rejected",
      class: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
    },
  };

  const config = $derived(statusConfig[status] ?? { variant: "secondary" as const, label: status });
</script>

<Badge variant={config.variant} class={config.class}>
  {config.label}
</Badge>
