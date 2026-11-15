<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="LiteList - Simple collaborative to-do lists" />
	<meta name="theme-color" content="#f8fafc" />
</svelte:head>

{@render children()}
