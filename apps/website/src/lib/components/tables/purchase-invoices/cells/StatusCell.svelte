<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import { Badge } from "@repo/ui/badge";

  type Props = {
    status: string;
  };

  const { status }: Props = $props();

  const statusConfig: Record<string, { class: string; label: string }> = {
    VALIDATED: {
      class: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
      label: msg.ui_validated(),
    },
    PENDING: {
      class: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
      label: msg.ui_pending(),
    },
    AUTO_ACCEPTED: {
      class: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
      label: msg.ui_auto_accepted(),
    },
    REJECTED: {
      class: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
      label: msg.ui_rejected(),
    },
  };

  const config = $derived(
    statusConfig[status] ?? { class: "bg-gray-50 text-gray-700 border-gray-200", label: status },
  );
</script>

<Badge variant="outline" class={config.class}>
  {config.label}
</Badge>
