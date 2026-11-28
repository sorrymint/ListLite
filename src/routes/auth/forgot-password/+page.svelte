<script lang="ts">
	import { resolve } from '$app/paths';

	let { form }: { form: { error?: string; message?: string } | null } = $props();
</script>

<svelte:head>
	<title>Forgot password - LiteList</title>
</svelte:head>

<main class="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
	<div class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
		<header class="mb-8">
			<p class="mb-2 text-sm font-bold tracking-wide text-teal-700 uppercase">LiteList</p>
			<h1 class="mb-2 text-3xl font-bold text-slate-900">Forgot password?</h1>
			<p class="text-base leading-relaxed text-slate-600">
				Enter your email address and we’ll send you a link to reset your password.
			</p>
		</header>

		{#if form?.error}
			<p
				class="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900"
				role="alert"
			>
				{form.error}
			</p>
		{/if}
		{#if form?.message}
			<p
				class="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm leading-relaxed text-green-900"
				role="status"
			>
				{form.message}
			</p>
		{/if}

		<form method="POST" class="space-y-5">
			<div>
				<label for="email" class="mb-2 block text-sm font-semibold text-slate-900">
					Email address
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
				/>
			</div>
			<button
				type="submit"
				class="min-h-11 w-full rounded-lg bg-teal-700 px-4 py-2 font-bold text-white transition-colors hover:bg-teal-800"
			>
				Send reset link
			</button>
		</form>

		<a
			href={resolve('/auth')}
			class="mt-6 inline-block text-sm font-semibold text-teal-700 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
		>
			Back to sign in
		</a>
	</div>
</main>
