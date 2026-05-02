<script lang="ts" module>
	import type { ButtonSize } from '@lib/components/ui/button';

	const sizeMap = {
		default: 'icon',
		xs: 'icon-xs',
		sm: 'icon-sm',
		lg: 'icon-lg',
		icon: 'icon',
		'icon-xs': 'icon-xs',
		'icon-sm': 'icon-sm',
		'icon-lg': 'icon-lg'
	} satisfies Record<NonNullable<ButtonSize>, ButtonSize>;

	export type LightSwitchProps = {
		variant?: 'outline' | 'ghost';
		size?: ButtonSize;
	};
</script>

<script lang="ts">
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '@lib/components/ui/button';

	let { variant = 'outline', size = 'default' }: LightSwitchProps = $props();
</script>

<Button onclick={toggleMode} {variant} size={sizeMap[size]}>
	<SunIcon class="scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90" />
	<MoonIcon class="absolute scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0" />
	<span class="sr-only">Toggle theme</span>
</Button>
