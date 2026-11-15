<script lang="ts">
	type ActionFeedback = {
		error?: string;
		message?: string;
	} | null;

	let { form }: { form: ActionFeedback } = $props();
</script>

<svelte:head>
	<title>Sign in or create account - LiteList</title>
</svelte:head>

<main class="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
	<div class="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
		<header class="mb-8">
			<p class="mb-2 text-sm font-bold tracking-wide text-teal-700 uppercase">LiteList</p>
			<h1 class="-tracking-0.01em mb-2 text-3xl font-bold text-slate-900 sm:text-4xl">
				Your lists, all in one place.
			</h1>
			<p class="text-base leading-relaxed text-slate-600">
				Sign in or create an account to keep your lists close at hand.
			</p>
			<img src="/icons/icon.svg" class="mx-auto h-40" alt="LiteList icon" />
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

		<div class="grid gap-8 sm:grid-cols-2">
			<section aria-labelledby="sign-in-heading" class="sm:border-r sm:pr-8">
				<h2 id="sign-in-heading" class="mb-6 text-lg font-bold text-slate-900">Sign in</h2>
				<form method="POST" action="?/signIn" class="space-y-5">
					<div>
						<label for="sign-in-email" class="mb-2 block text-sm font-semibold text-slate-900">
							Email address
						</label>
						<input
							id="sign-in-email"
							name="email"
							type="email"
							autocomplete="email"
							required
							class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
						/>
					</div>
					<div>
						<label for="sign-in-password" class="mb-2 block text-sm font-semibold text-slate-900">
							Password
						</label>
						<input
							id="sign-in-password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
						/>
					</div>
					<button
						type="submit"
						class="min-h-11 w-full rounded-lg bg-teal-700 px-4 py-2 font-bold text-white transition-colors hover:bg-teal-800"
					>
						Sign in
					</button>
				</form>
			</section>

			<section aria-labelledby="sign-up-heading" class="sm:pl-8">
				<h2 id="sign-up-heading" class="mb-6 text-lg font-bold text-slate-900">Create account</h2>
				<form method="POST" action="?/signUp" class="space-y-5">
					<div>
						<label
							for="sign-up-display-name"
							class="mb-2 block text-sm font-semibold text-slate-900"
						>
							Display name
						</label>
						<input
							id="sign-up-display-name"
							name="displayName"
							type="text"
							autocomplete="nickname"
							maxlength="100"
							required
							class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
						/>
					</div>
					<div>
						<label for="sign-up-email" class="mb-2 block text-sm font-semibold text-slate-900">
							Email address
						</label>
						<input
							id="sign-up-email"
							name="email"
							type="email"
							autocomplete="email"
							required
							class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
						/>
					</div>
					<div>
						<label for="sign-up-password" class="mb-2 block text-sm font-semibold text-slate-900">
							Password
						</label>
						<input
							id="sign-up-password"
							name="password"
							type="password"
							autocomplete="new-password"
							required
							class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
						/>
					</div>
					<button
						type="submit"
						class="min-h-11 w-full rounded-lg bg-teal-700 px-4 py-2 font-bold text-white transition-colors hover:bg-teal-800"
					>
						Create account
					</button>
				</form>
			</section>
		</div>
	</div>
</main>
