<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isAccepting = $state(false);
	let error = $state('');

	const acceptInvite = async () => {
		isAccepting = true;
		error = '';

		try {
			const response = await fetch(`/api/invite/${data.token}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (response.ok) {
				goto(`/lists/${data.invitation.list_id}`);
			} else {
				error = 'Could not accept invitation. Please try again.';
			}
		} catch (e) {
			console.error('Error accepting invitation:', e);
			error = 'An error occurred. Please try again.';
		} finally {
			isAccepting = false;
		}
	};
</script>

<svelte:head>
	<title>Accept Invitation - LiteList</title>
</svelte:head>

<div class="min-h-screen grid place-items-center px-4 py-8 bg-slate-50">
	<div
		transition:fly={{ y: 20, duration: 300 }}
		class="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 shadow-sm"
	>
		<h1 class="text-3xl font-bold text-slate-900 mb-2">You're invited!</h1>
		<p class="text-slate-600 mb-8">
			You've been invited to join the list "<span class="font-semibold">{data.invitation.lists.name}</span>".
		</p>

		{#if error}
			<p class="mb-6 px-4 py-3 rounded-lg border border-red-300 bg-red-50 text-red-900 text-sm">
				{error}
			</p>
		{/if}

		<div class="space-y-3">
			<button
				onclick={acceptInvite}
				disabled={isAccepting}
				class="w-full min-h-11 px-4 py-2 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{isAccepting ? 'Accepting...' : 'Accept invitation'}
			</button>
			<a
				href="/lists"
				class="block text-center px-4 py-2 text-slate-700 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
			>
				Skip for now
			</a>
		</div>
	</div>
</div>
