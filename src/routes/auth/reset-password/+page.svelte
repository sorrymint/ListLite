<script lang="ts">
	import { resolve } from '$app/paths';

	let {
		data,
		form
	}: {
		data: { tokenHash: string | null; hasSession: boolean };
		form: { error?: string; verificationFailed?: boolean } | null;
	} = $props();
	let showPasswords = $state(false);
</script>

<svelte:head>
	<title>Reset password - LiteList</title>
</svelte:head>

<main class="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
	<div class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
		<header class="mb-8">
			<p class="mb-2 text-sm font-bold tracking-wide text-teal-700 uppercase">LiteList</p>
			<h1 class="mb-2 text-3xl font-bold text-slate-900">Reset password</h1>
		</header>

		{#if form?.error}
			<p
				class="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900"
				role="alert"
			>
				{form.error}
			</p>
		{/if}

		{#if form?.verificationFailed}
			<a
				href={resolve('/auth/forgot-password')}
				class="inline-block text-sm font-semibold text-teal-700 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
			>
				Request a new reset link
			</a>
		{:else if data.tokenHash}
			<p class="mb-6 text-base leading-relaxed text-slate-600">
				Confirm that you want to reset your password.
			</p>
			<form method="POST" action="?/verify">
				<input type="hidden" name="tokenHash" value={data.tokenHash} />
				<button
					type="submit"
					class="min-h-11 w-full rounded-lg bg-teal-700 px-4 py-2 font-bold text-white transition-colors hover:bg-teal-800"
				>
					Confirm reset
				</button>
			</form>
		{:else if data.hasSession}
			<p class="mb-6 text-base leading-relaxed text-slate-600">Choose a new password.</p>
			<form method="POST" action="?/update" class="space-y-5">
				<div>
					<label for="password" class="mb-2 block text-sm font-semibold text-slate-900">
						New password
					</label>
					<div class="flex gap-2">
						<input
							id="password"
							name="password"
							type={showPasswords ? 'text' : 'password'}
							autocomplete="new-password"
							required
							class="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
						/>
						<button
							type="button"
							aria-controls="password confirm-password"
							aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
							onclick={() => (showPasswords = !showPasswords)}
							class="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-teal-700 hover:bg-slate-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
						>
							{showPasswords ? 'Hide' : 'Show'}
						</button>
					</div>
				</div>
				<div>
					<label for="confirm-password" class="mb-2 block text-sm font-semibold text-slate-900">
						Confirm new password
					</label>
					<div class="flex gap-2">
						<input
							id="confirm-password"
							name="confirmPassword"
							type={showPasswords ? 'text' : 'password'}
							autocomplete="new-password"
							required
							class="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
						/>
						<button
							type="button"
							aria-controls="password confirm-password"
							aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
							onclick={() => (showPasswords = !showPasswords)}
							class="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-teal-700 hover:bg-slate-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
						>
							{showPasswords ? 'Hide' : 'Show'}
						</button>
					</div>
				</div>
				<button
					type="submit"
					class="min-h-11 w-full rounded-lg bg-teal-700 px-4 py-2 font-bold text-white transition-colors hover:bg-teal-800"
				>
					Update password
				</button>
			</form>
		{:else}
			<p class="mb-4 text-base leading-relaxed text-slate-600">
				This reset link is invalid or has expired. Request a new link to reset your password.
			</p>
			<a
				href={resolve('/auth/forgot-password')}
				class="inline-block text-sm font-semibold text-teal-700 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
			>
				Request a new reset link
			</a>
		{/if}

		<div class="mt-6">
			<a
				href={resolve('/auth')}
				class="inline-block text-sm font-semibold text-teal-700 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
			>
				Back to sign in
			</a>
		</div>
	</div>
</main>
