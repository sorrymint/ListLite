<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
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

	interface DeletedTask extends Task {
		deleted_at: string | null;
	}

	interface Member {
		user_id: string;
		profiles: { display_name: string; id: string } | null;
	}

	let { data }: { data: PageData } = $props();

	let tasks: Task[] = $derived(data.tasks);
	let deletedTasks: DeletedTask[] = $derived(data.deletedTasks);
	let activeTasks: Task[] = $derived(tasks.filter((task) => !task.is_complete));
	let completedTasks: Task[] = $derived(tasks.filter((task) => task.is_complete));
	let newTaskTitle = $state('');
	let busyTaskAction = $state('');
	let taskError = $state('');
	let taskNotice = $state('');
	let showMembers = $state(false);
	let showInvite = $state(false);
	let inviteLinkCopied = $state(false);

	const userId = $derived(data.user?.id);
	const isOwner = $derived(data.isOwner);
	const listId = $derived(data.list.id);
	const listName = $derived(data.list.name);
	const members = $derived(data.members as Member[]);

	class TaskRequestError extends Error {}

	const checkTaskResponse = async (response: Response) => {
		if (response.ok) return;
		const body = await response.json().catch(() => null);
		throw new TaskRequestError(
			typeof body?.message === 'string' ? body.message : 'Please try again.'
		);
	};

	const reportTaskError = (action: string, error: unknown) => {
		taskError = `${action}: ${error instanceof TaskRequestError ? error.message : 'Please try again.'}`;
	};

	const refreshTasks = async () => {
		try {
			await invalidateAll();
		} catch {
			taskError =
				'The change was saved, but the list could not be refreshed. Reload the page to sync.';
		}
	};

	const createTask = async () => {
		if (!newTaskTitle.trim() || busyTaskAction) return;

		busyTaskAction = 'create';
		taskError = '';
		taskNotice = '';
		try {
			const response = await fetch(`/api/lists/${listId}/tasks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: newTaskTitle.trim() })
			});

			await checkTaskResponse(response);
			const newTask = await response.json();
			tasks = [newTask, ...tasks];
			newTaskTitle = '';
		} catch (error) {
			reportTaskError('Could not add task', error);
		} finally {
			busyTaskAction = '';
		}
	};

	const toggleTask = async (task: Task) => {
		if (busyTaskAction) return;
		busyTaskAction = `toggle:${task.id}`;
		taskError = '';
		taskNotice = '';
		try {
			const response = await fetch(`/api/lists/${listId}/tasks/${task.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_complete: !task.is_complete })
			});

			await checkTaskResponse(response);
			const updated = await response.json();
			tasks = tasks.map((t) => (t.id === task.id ? updated : t));
		} catch (error) {
			reportTaskError('Could not update task', error);
		} finally {
			busyTaskAction = '';
		}
	};

	const deleteTask = async (taskId: string) => {
		if (busyTaskAction) return;
		const task = tasks.find((item) => item.id === taskId);
		if (!task) return;
		busyTaskAction = `delete:${taskId}`;
		taskError = '';
		taskNotice = '';
		try {
			const response = await fetch(`/api/lists/${listId}/tasks/${taskId}`, {
				method: 'DELETE'
			});

			await checkTaskResponse(response);
			tasks = tasks.filter((t) => t.id !== taskId);
			deletedTasks = [{ ...task, deleted_at: null }, ...deletedTasks];
			taskNotice = `${task.title} moved to Removed.`;
			await refreshTasks();
		} catch (error) {
			reportTaskError('Could not move task to Removed', error);
		} finally {
			busyTaskAction = '';
		}
	};

	const restoreTask = async (task: DeletedTask) => {
		if (busyTaskAction) return;
		busyTaskAction = `restore:${task.id}`;
		taskError = '';
		taskNotice = '';
		try {
			const response = await fetch(`/api/lists/${listId}/tasks/${task.id}/restore`, {
				method: 'POST'
			});
			await checkTaskResponse(response);
			deletedTasks = deletedTasks.filter((item) => item.id !== task.id);
			tasks = [task, ...tasks];
			taskNotice = `${task.title} restored.`;
			await refreshTasks();
		} catch (error) {
			reportTaskError('Could not restore task', error);
		} finally {
			busyTaskAction = '';
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
		<p role="status" class="sr-only">{taskNotice}</p>

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
					aria-label="New task title"
					bind:value={newTaskTitle}
					maxlength="500"
					disabled={!!busyTaskAction}
					class="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={!!busyTaskAction || !newTaskTitle.trim()}
					class="min-h-11 rounded-lg bg-teal-700 px-6 py-2 font-bold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{busyTaskAction === 'create' ? 'Adding...' : 'Add'}
				</button>
			</form>
		</section>

		{#if taskError}
			<p
				role="alert"
				class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
			>
				{taskError}
			</p>
		{/if}

		<section class="mb-8" aria-labelledby="tasks-heading">
			<h2 id="tasks-heading" class="mb-4 text-lg font-bold text-slate-900">
				Tasks <span class="text-sm font-medium text-slate-500">({activeTasks.length})</span>
			</h2>
			{#if activeTasks.length === 0}
				<div transition:fade={{ duration: 200 }} class="py-12 text-center">
					<p class="text-slate-600">
						{tasks.length === 0 ? 'No tasks yet. Add one to get started!' : 'No active tasks.'}
					</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each activeTasks as task (task.id)}
						<div
							animate:flip={{ duration: 200 }}
							transition:fly={{ y: -10, duration: 150 }}
							class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
						>
							<button
								onclick={() => toggleTask(task)}
								disabled={!!busyTaskAction}
								class={[
									'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 border-slate-300 transition-colors hover:border-teal-500 disabled:cursor-not-allowed disabled:opacity-50',
									{ 'bg-teal-500': task.is_complete, 'border-teal-500': task.is_complete }
								]}
								aria-label={`${task.is_complete ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
							>
								{#if task.is_complete}
									<span class="font-bold text-white">✓</span>
								{/if}
							</button>
							<span
								class={[
									'flex-1 font-semibold text-slate-900',
									{ 'line-through': task.is_complete, 'text-slate-400': task.is_complete }
								]}
							>
								{task.title}
							</span>
							<button
								onclick={() => deleteTask(task.id)}
								disabled={!!busyTaskAction}
								aria-label={`Move ${task.title} to Removed`}
								class="px-2 py-1 text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{busyTaskAction === `delete:${task.id}` ? 'Removing...' : 'Remove'}
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section class="mb-8" aria-labelledby="completed-heading">
			<h2 id="completed-heading" class="mb-4 text-lg font-bold text-slate-900">
				Completed <span class="text-sm font-medium text-slate-500">({completedTasks.length})</span>
			</h2>
			{#if completedTasks.length === 0}
				<p class="py-4 text-slate-600">No completed tasks.</p>
			{:else}
				<div class="space-y-2">
					{#each completedTasks as task (task.id)}
						<div
							animate:flip={{ duration: 200 }}
							transition:fly={{ y: -10, duration: 150 }}
							class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
						>
							<button
								onclick={() => toggleTask(task)}
								disabled={!!busyTaskAction}
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 border-teal-500 bg-teal-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
								aria-label={`Mark incomplete: ${task.title}`}
							>
								<span class="font-bold text-white">✓</span>
							</button>
							<span class="flex-1 font-semibold text-slate-400 line-through">
								{task.title}
							</span>
							<button
								onclick={() => deleteTask(task.id)}
								disabled={!!busyTaskAction}
								aria-label={`Move ${task.title} to Removed`}
								class="px-2 py-1 text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{busyTaskAction === `delete:${task.id}` ? 'Removing...' : 'Remove'}
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<details class="mb-8" aria-busy={!!busyTaskAction}>
			<summary class="mb-4 cursor-pointer text-lg font-bold text-slate-900">
				Removed <span class="text-sm font-medium text-slate-500">({deletedTasks.length})</span>
			</summary>
			{#if deletedTasks.length === 0}
				<p class="py-4 text-slate-600">No removed tasks.</p>
			{:else}
				<ul class="space-y-2">
					{#each deletedTasks as task (task.id)}
						<li
							class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
						>
							<span class="min-w-0 flex-1 font-semibold break-words text-slate-900"
								>{task.title}</span
							>
							<button
								type="button"
								onclick={() => restoreTask(task)}
								disabled={!!busyTaskAction}
								aria-label={`Restore ${task.title}`}
								class="px-2 py-1 text-sm font-semibold text-teal-700 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{busyTaskAction === `restore:${task.id}` ? 'Restoring...' : 'Restore'}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</details>
	</main>
</div>
