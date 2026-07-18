<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import { Spinner } from "@repo/ui/spinner";
  import * as Table from "@repo/ui/table";

  type Props = {
    colspan: number;
  };

  const { colspan }: Props = $props();
</script>

<Table.Row>
  <Table.Cell {colspan} class="h-24 text-center">
    <Spinner class="mx-auto size-6" />
    <p class="mx-auto mt-2">{msg.ui_loading()}</p>
  </Table.Cell>
</Table.Row>
