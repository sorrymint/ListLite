<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly, fade, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { PageData } from './$types';

	interface Task {
		id: string;
		title: string;
		is_complete: boolean;
		created_at: string;
		updated_at: string;
	}

	interface Member {
		user_id: string;
		profiles: { display_name: string; id: string } | null;
	}

	let { data }: { data: PageData } = $props();

	let tasks: Task[] = $state(data.tasks);
	let newTaskTitle = $state('');
	let isCreatingTask = $state(false);
	let showMembers = $state(false);
	let showInvite = $state(false);
	let inviteLinkCopied = $state(false);

	$effect(() => {
		tasks = data.tasks;
	});

	const userId = $derived(data.user?.id);
	const isOwner = $derived(data.isOwner);
	const listId = $derived(data.list.id);
	const listName = $derived(data.list.name);
	const members = $derived(data.members as Member[]);

	const createTask = async () => {
		if (!newTaskTitle.trim() || isCreatingTask) return;

		isCreatingTask = true;
		try {
			const response = await fetch(`/api/lists/${listId}/tasks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: newTaskTitle.trim() })
			});

			if (response.ok) {
				const newTask = await response.json();
				tasks = [newTask, ...tasks];
				newTaskTitle = '';
			}
		} finally {
			isCreatingTask = false;
		}
	};

	const toggleTask = async (task: Task) => {
		try {
			const response = await fetch(`/api/lists/${listId}/tasks/${task.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_complete: !task.is_complete })
			});

			if (response.ok) {
				const updated = await response.json();
				tasks = tasks.map((t) => (t.id === task.id ? updated : t));
			}
		} catch (e) {
			console.error('Error updating task:', e);
		}
	};

	const deleteTask = async (taskId: string) => {
		try {
			const response = await fetch(`/api/lists/${listId}/tasks/${taskId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				tasks = tasks.filter((t) => t.id !== taskId);
			}
		} catch (e) {
			console.error('Error deleting task:', e);
		}
	};

	const copyInviteLink = async () => {
		if (!isOwner) return;

		try {
			const response = await fetch(`/api/lists/${listId}/invite`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ expiresIn: 7 })
			});

			if (response.ok) {
				const { link } = await response.json();
				await navigator.clipboard.writeText(link);
				inviteLinkCopied = true;
				setTimeout(() => {
					inviteLinkCopied = false;
				}, 2000);
			}
		} catch (e) {
			console.error('Error creating invite:', e);
		}
	};

	const removeMember = async (memberId: string) => {
		if (!isOwner) return;

		try {
			const response = await fetch(`/api/lists/${listId}/members/${memberId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				window.location.reload();
			}
		} catch (e) {
			console.error('Error removing member:', e);
		}
	};

	const leaveList = async () => {
		if (!confirm('Leave this list? Other members can still access it.')) return;

		try {
			const response = await fetch(`/api/lists/${listId}/members/leave`, {
				method: 'POST'
			});

			if (response.ok) {
				goto('/lists');
			}
		} catch (e) {
			console.error('Error leaving list:', e);
		}
	};
</script>

<svelte:head>
	<title>{listName} - LiteList</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<header class="sticky top-0 z-40 border-b border-slate-200 bg-white">
		<div class="mx-auto max-w-2xl px-4 py-4 sm:py-6">
			<div class="mb-4 flex items-center justify-between gap-4">
				<div class="min-w-0 flex-1">
					<h1 class="truncate text-2xl font-bold text-slate-900 sm:text-3xl">{listName}</h1>
				</div>
				<a
					href="/lists"
					class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
				>
					Back
				</a>
			</div>
			<div class="flex gap-2">
				<button
					onclick={() => {
						showMembers = !showMembers;
						showInvite = false;
					}}
					class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
				>
					Members
				</button>
				{#if isOwner}
					<button
						onclick={() => {
							showInvite = !showInvite;
							showMembers = false;
						}}
						class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
					>
						Invite
					</button>
				{:else}
					<button
						onclick={leaveList}
						class="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
					>
						Leave
					</button>
				{/if}
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-2xl px-4 py-6 sm:py-8">
		{#if showMembers}
			<section
				transition:slide={{ duration: 200 }}
				class="mb-8 rounded-lg border border-slate-200 bg-white p-4"
				aria-labelledby="members-heading"
			>
				<h2 id="members-heading" class="mb-4 text-lg font-bold text-slate-900">Members</h2>
				<div class="space-y-2">
					{#each members as member (member.user_id)}
						<div class="flex items-center justify-between">
							<div>
								<span class="font-semibold text-slate-900"
									>{member.profiles?.display_name || 'Unknown'}</span
								>
								{#if member.user_id === data.list.owner_id}
									<span class="ml-2 text-xs font-semibold text-slate-500">owner</span>
								{/if}
							</div>
							{#if isOwner && member.user_id !== userId && member.user_id !== data.list.owner_id}
								<button
									onclick={() => removeMember(member.user_id)}
									class="text-sm font-semibold text-red-600 hover:text-red-700"
								>
									Remove
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if showInvite && isOwner}
			<section
				transition:slide={{ duration: 200 }}
				class="mb-8 rounded-lg border border-slate-200 bg-white p-4"
				aria-labelledby="invite-heading"
			>
				<h2 id="invite-heading" class="mb-4 text-lg font-bold text-slate-900">Invite members</h2>
				<p class="mb-4 text-sm text-slate-600">
					Generate a link to invite others to this list. Links expire after 7 days.
				</p>
				<button
					onclick={copyInviteLink}
					class="w-full rounded-lg bg-teal-700 px-4 py-2 font-bold text-white transition-colors hover:bg-teal-800"
				>
					{inviteLinkCopied ? '✓ Copied!' : 'Copy invite link'}
				</button>
			</section>
		{/if}

		<section class="mb-6" aria-labelledby="new-task-heading">
			<h2 id="new-task-heading" class="sr-only">Add a new task</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					createTask();
				}}
				class="flex gap-2"
			>
				<input
					type="text"
					placeholder="Add a new task..."
					bind:value={newTaskTitle}
					maxlength="500"
					disabled={isCreatingTask}
					class="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={isCreatingTask || !newTaskTitle.trim()}
					class="min-h-11 rounded-lg bg-teal-700 px-6 py-2 font-bold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isCreatingTask ? 'Adding...' : 'Add'}
				</button>
			</form>
		</section>

		{#if tasks.length === 0}
			<div transition:fade={{ duration: 200 }} class="py-12 text-center">
				<p class="text-slate-600">No tasks yet. Add one to get started!</p>
			</div>
		{:else}
			<section aria-labelledby="tasks-heading">
				<h2 id="tasks-heading" class="sr-only">Tasks in this list</h2>
				<p class="m-2 text-sm text-slate-500">
					{tasks.length === 1 ? 'Task: ' : 'Tasks: '}
					{tasks.length}
				</p>
				<div class="space-y-2">
					{#each tasks as task (task.id)}
						<div
							animate:flip={{ duration: 200 }}
							transition:fly={{ y: -10, duration: 150 }}
							class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
						>
							<button
								onclick={() => toggleTask(task)}
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 border-slate-300 transition-colors hover:border-teal-500"
								class:bg-teal-500={task.is_complete}
								class:border-teal-500={task.is_complete}
								aria-label={task.is_complete ? 'Mark incomplete' : 'Mark complete'}
							>
								{#if task.is_complete}
									<span class="font-bold text-white">✓</span>
								{/if}
							</button>
							<span
								class="flex-1 font-semibold text-slate-900"
								class:line-through={task.is_complete}
								class:text-slate-400={task.is_complete}
							>
								{task.title}
							</span>
							<button
								onclick={() => deleteTask(task.id)}
								class="px-2 py-1 text-sm font-semibold text-red-600 hover:text-red-700"
							>
								Delete
							</button>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</main>
</div>
