<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { PageData } from './$types';

	interface List {
		id: string;
		name: string;
		owner_id: string;
		created_at: string;
		updated_at: string;
	}

	let { data }: { data: PageData } = $props();

	let lists: List[] = $derived(data.lists);
	let newListName = $state('');
	let isCreatingList = $state(false);
	let createListError = $state('');

	const userId = $derived(data.user?.id);

	const createList = async () => {
		if (!newListName.trim() || isCreatingList) return;

		isCreatingList = true;
		createListError = '';
		try {
			const response = await fetch('/api/lists', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newListName.trim() })
			});

			if (!response.ok) {
				createListError = 'Unable to create list. Please try again.';
				return;
			}

			const newList = await response.json();
			lists = [newList, ...lists];
			newListName = '';
		} catch {
			createListError = 'Unable to create list. Please try again.';
		} finally {
			isCreatingList = false;
		}
	};

	const deleteList = async (listId: string) => {
		if (!confirm('Delete this list? This cannot be undone.')) return;

		try {
			const response = await fetch(`/api/lists/${listId}`, { method: 'DELETE' });
			if (response.ok) {
				lists = lists.filter((l) => l.id !== listId);
			}
		} catch (e) {
			console.error('Error deleting list:', e);
		}
	};
</script>

<svelte:head>
	<title>Your Lists - LiteList</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<header class="sticky top-0 z-40 border-b border-slate-200 bg-white">
		<div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:py-6">
			<div>
				<h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Your Lists</h1>
			</div>
			<form action="/auth?/signOut" method="POST">
				<button
					type="submit"
					class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
				>
					Sign out
				</button>
			</form>
		</div>
	</header>

	<main class="mx-auto max-w-2xl px-4 py-6 sm:py-8">
		<section class="mb-8" aria-labelledby="new-list-heading">
			<h2 id="new-list-heading" class="mb-4 text-lg font-bold text-slate-900">Create a new list</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createList();
				}}
				class="flex gap-2"
			>
				<input
					type="text"
					placeholder="List name"
					bind:value={newListName}
					maxlength="120"
					disabled={isCreatingList}
					class="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={isCreatingList || !newListName.trim()}
					class="min-h-11 rounded-lg bg-teal-700 px-6 py-2 font-bold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isCreatingList ? 'Creating...' : 'Create'}
				</button>
			</form>
			{#if createListError}
				<p role="alert" class="mt-2 text-sm text-red-700">{createListError}</p>
			{/if}
		</section>

		{#if lists.length === 0}
			<div transition:fade={{ duration: 200 }} class="py-12 text-center">
				<p class="text-slate-600">No lists yet. Create one to get started!</p>
			</div>
		{:else}
			<section aria-labelledby="lists-heading">
				<h2 id="lists-heading" class="sr-only">Your lists</h2>
				<div class="space-y-3">
					{#each lists as list (list.id)}
						<div
							animate:flip={{ duration: 200 }}
							transition:fly={{ y: -10, duration: 150 }}
							class="rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
						>
							<div class="flex items-center justify-between gap-4">
								<div class="min-w-0 flex-1">
									<a
										href="/lists/{list.id}"
										class="block truncate text-lg font-semibold text-teal-700 hover:text-teal-800"
									>
										{list.name}
									</a>
									<p class="mt-1 text-sm text-slate-500">
										{list.owner_id === userId ? 'Your list' : 'Shared list'}
									</p>
								</div>
								{#if list.owner_id === userId}
									<button
										onclick={() => deleteList(list.id)}
										class="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
									>
										Delete
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</main>
</div>
