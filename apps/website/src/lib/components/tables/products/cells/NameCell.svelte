<script lang="ts">
  interface Props {
    name: string;
  }
  let { name }: Props = $props();
</script>

<span class="font-medium">{name}</span>
