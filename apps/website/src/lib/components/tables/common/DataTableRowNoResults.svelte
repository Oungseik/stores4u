<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import * as Table from "@repo/ui/table";

  type Props = {
    colspan: number;
  };

  const { colspan }: Props = $props();
</script>

<Table.Row>
  <Table.Cell {colspan} class="h-24 text-center">{msg.ui_no_results()}</Table.Cell>
</Table.Row>
