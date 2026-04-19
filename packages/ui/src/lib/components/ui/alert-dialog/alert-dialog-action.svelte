<script lang="ts">
	import { Button, type ButtonProps, buttonVariants } from '@lib/components/ui/button/index.js';
	import { cn } from '@lib/utils.js';
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		variant = 'default',
		class: className,
		loading = false,
		disabled = undefined,
		children,
		...restProps
	}: AlertDialogPrimitive.ActionProps & {
		variant?: ButtonProps['variant'];
		loading?: boolean;
	} = $props();
</script>

<AlertDialogPrimitive.Action
	bind:ref
	data-slot="alert-dialog-action"
	class={cn(buttonVariants({ variant }), className)}
	disabled={loading || disabled}
	{...restProps}
>
	{#snippet child({ props })}
		<Button {...props}>
			{@render children?.()}
		</Button>
	{/snippet}
</AlertDialogPrimitive.Action>
