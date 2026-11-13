<script lang="ts">
	import type { PageData } from './$types';

	type ActionFeedback = {
		error?: string;
		message?: string;
	} | null;

	let { data, form }: { data: PageData; form: ActionFeedback } = $props();
</script>

<svelte:head>
	<title>Sign in or create account - LiteList</title>
</svelte:head>

<main class="min-h-screen grid place-items-center px-4 py-8 bg-slate-50">
	<div class="w-full max-w-2xl bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
		<header class="mb-8">
			<p class="text-sm font-bold tracking-wide text-teal-700 uppercase mb-2">LiteList</p>
			<h1 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 -tracking-0.01em">
				Your lists, all in one place.
			</h1>
			<p class="text-base text-slate-600 leading-relaxed">
				Sign in or create an account to keep your lists close at hand.
			</p>
		</header>

		{#if form?.error}
			<p class="mb-6 px-4 py-3 rounded-lg border border-red-300 bg-red-50 text-red-900 text-sm leading-relaxed" role="alert">
				{form.error}
			</p>
		{/if}
		{#if form?.message}
			<p class="mb-6 px-4 py-3 rounded-lg border border-green-300 bg-green-50 text-green-900 text-sm leading-relaxed" role="status">
				{form.message}
			</p>
		{/if}

		<div class="grid sm:grid-cols-2 gap-8">
			<section aria-labelledby="sign-in-heading" class="sm:border-r sm:pr-8">
				<h2 id="sign-in-heading" class="text-lg font-bold text-slate-900 mb-6">Sign in</h2>
				<form method="POST" action="?/signIn" class="space-y-5">
					<div>
						<label for="sign-in-email" class="block text-sm font-semibold text-slate-900 mb-2">
							Email address
						</label>
						<input
							id="sign-in-email"
							name="email"
							type="email"
							autocomplete="email"
							required
							class="w-full min-h-11 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus-visible:outline-offset-2 focus-visible:outline-3 focus-visible:outline-teal-500"
						/>
					</div>
					<div>
						<label for="sign-in-password" class="block text-sm font-semibold text-slate-900 mb-2">
							Password
						</label>
						<input
							id="sign-in-password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							class="w-full min-h-11 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus-visible:outline-offset-2 focus-visible:outline-3 focus-visible:outline-teal-500"
						/>
					</div>
					<button
						type="submit"
						class="w-full min-h-11 px-4 py-2 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800 transition-colors"
					>
						Sign in
					</button>
				</form>
			</section>

			<section aria-labelledby="sign-up-heading" class="sm:pl-8">
				<h2 id="sign-up-heading" class="text-lg font-bold text-slate-900 mb-6">Create account</h2>
				<form method="POST" action="?/signUp" class="space-y-5">
					<div>
						<label for="sign-up-display-name" class="block text-sm font-semibold text-slate-900 mb-2">
							Display name
						</label>
						<input
							id="sign-up-display-name"
							name="displayName"
							type="text"
							autocomplete="nickname"
							maxlength="100"
							required
							class="w-full min-h-11 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus-visible:outline-offset-2 focus-visible:outline-3 focus-visible:outline-teal-500"
						/>
					</div>
					<div>
						<label for="sign-up-email" class="block text-sm font-semibold text-slate-900 mb-2">
							Email address
						</label>
						<input
							id="sign-up-email"
							name="email"
							type="email"
							autocomplete="email"
							required
							class="w-full min-h-11 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus-visible:outline-offset-2 focus-visible:outline-3 focus-visible:outline-teal-500"
						/>
					</div>
					<div>
						<label for="sign-up-password" class="block text-sm font-semibold text-slate-900 mb-2">
							Password
						</label>
						<input
							id="sign-up-password"
							name="password"
							type="password"
							autocomplete="new-password"
							required
							class="w-full min-h-11 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus-visible:outline-offset-2 focus-visible:outline-3 focus-visible:outline-teal-500"
						/>
					</div>
					<button
						type="submit"
						class="w-full min-h-11 px-4 py-2 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800 transition-colors"
					>
						Create account
					</button>
				</form>
			</section>
		</div>
	</div>
</main>
