<script lang="ts">
  import type { MovementType } from "@repo/perstore-db";

  type Props = {
    movementType: MovementType;
  };

  const { movementType }: Props = $props();

  const badgeStyles: Record<MovementType, string> = {
    PURCHASE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    SALE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    RETURN: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    WASTAGE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    ADJUSTMENT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    CORRECTION: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };
</script>

<span
  class={[
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ",
    badgeStyles[movementType],
  ]}
>
  {movementType.toLowerCase()}
</span>
