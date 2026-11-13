<script lang="ts">
	import type { PageData } from './$types';

	type ActionFeedback = {
		error?: string;
		message?: string;
	} | null;

	let { data, form }: { data: PageData; form: ActionFeedback } = $props();
</script>

<main class="page-shell">
	<div class="auth-card">
		<header class="page-header">
			<p class="eyebrow">LiteList</p>
			<h1 id="page-title">Your lists, all in one place.</h1>
			<p class="intro">Sign in or create an account to keep your lists close at hand.</p>
		</header>

		{#if form?.error}
			<p class="feedback feedback-error" role="alert">{form.error}</p>
		{/if}
		{#if form?.message}
			<p class="feedback feedback-message" role="status">{form.message}</p>
		{/if}

		{#if data.user}
			<section class="signed-in" aria-labelledby="signed-in-heading">
				<h2 id="signed-in-heading">You're signed in</h2>
				<p class="account-detail">
					Signed in as <strong>{data.user.email ?? 'your account'}</strong>
				</p>
				{#if !data.profile}
					<form method="POST" action="?/completeProfile">
						<h2>Complete your profile</h2>
						<div class="field">
							<label for="profile-display-name">Display name</label>
							<input
								id="profile-display-name"
								name="displayName"
								type="text"
								autocomplete="nickname"
								maxlength="100"
								required
							/>
						</div>
						<button class="button" type="submit">Save profile</button>
					</form>
				{:else}
					<p class="account-detail">Display name: {data.profile.display_name}</p>
				{/if}
				<form method="POST" action="?/signOut">
					<button class="button button-secondary" type="submit">Sign out</button>
				</form>
			</section>
		{:else}
			<div class="form-grid">
				<section class="form-section" aria-labelledby="sign-in-heading">
					<h2 id="sign-in-heading">Sign in</h2>
					<form method="POST" action="?/signIn">
						<div class="field">
							<label for="sign-in-email">Email address</label>
							<input id="sign-in-email" name="email" type="email" autocomplete="email" required />
						</div>
						<div class="field">
							<label for="sign-in-password">Password</label>
							<input
								id="sign-in-password"
								name="password"
								type="password"
								autocomplete="current-password"
								required
							/>
						</div>
						<button class="button" type="submit">Sign in</button>
					</form>
				</section>

				<section class="form-section" aria-labelledby="sign-up-heading">
					<h2 id="sign-up-heading">Create an account</h2>
					<form method="POST" action="?/signUp">
						<div class="field">
							<label for="sign-up-display-name">Display name</label>
							<input
								id="sign-up-display-name"
								name="displayName"
								type="text"
								autocomplete="nickname"
								maxlength="100"
								required
							/>
						</div>
						<div class="field">
							<label for="sign-up-email">Email address</label>
							<input id="sign-up-email" name="email" type="email" autocomplete="email" required />
						</div>
						<div class="field">
							<label for="sign-up-password">Password</label>
							<input
								id="sign-up-password"
								name="password"
								type="password"
								autocomplete="new-password"
								required
							/>
						</div>
						<button class="button" type="submit">Create account</button>
					</form>
				</section>
			</div>
		{/if}
	</div>
</main>

<style>
	.page-shell {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 2rem 1rem;
		background: #f5f7f6;
		color: #18312a;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	.auth-card {
		width: min(100%, 48rem);
		padding: clamp(1.5rem, 5vw, 3rem);
		border: 1px solid #dfe7e2;
		border-radius: 1.25rem;
		background: #fff;
		box-shadow: 0 1.25rem 3.5rem rgb(24 49 42 / 8%);
	}

	.page-header {
		max-width: 34rem;
		margin-bottom: 2rem;
	}

	.eyebrow {
		margin: 0 0 0.65rem;
		color: #34775d;
		font-size: 0.8rem;
		font-weight: 750;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h1,
	h2,
	p {
		margin-top: 0;
	}

	h1 {
		margin-bottom: 0.75rem;
		font-size: clamp(1.8rem, 5vw, 2.5rem);
		line-height: 1.15;
		letter-spacing: -0.035em;
	}

	h2 {
		margin-bottom: 1.25rem;
		font-size: 1.2rem;
		letter-spacing: -0.02em;
	}

	.intro,
	.account-detail {
		margin-bottom: 0;
		color: #5b6d65;
		line-height: 1.6;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2rem;
	}

	.form-section {
		padding-top: 1.5rem;
		border-top: 1px solid #e7ece9;
	}

	.field {
		display: grid;
		gap: 0.45rem;
		margin-bottom: 1rem;
	}

	label {
		font-size: 0.9rem;
		font-weight: 650;
	}

	input {
		width: 100%;
		min-height: 2.8rem;
		padding: 0.65rem 0.75rem;
		border: 1px solid #cbd7d0;
		border-radius: 0.55rem;
		background: #fff;
		color: inherit;
		font: inherit;
	}

	input:focus-visible,
	button:focus-visible {
		outline: 3px solid #78b99a;
		outline-offset: 2px;
	}

	.button {
		min-height: 2.8rem;
		padding: 0.65rem 1rem;
		border: 1px solid #246447;
		border-radius: 0.55rem;
		background: #246447;
		color: #fff;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.button:hover {
		background: #1b5138;
	}

	.button-secondary {
		margin-top: 1.5rem;
		border-color: #b9c9c0;
		background: #fff;
		color: #18312a;
	}

	.button-secondary:hover {
		background: #f1f6f3;
	}

	.feedback {
		margin: 0 0 1.25rem;
		padding: 0.8rem 1rem;
		border: 1px solid;
		border-radius: 0.6rem;
		line-height: 1.5;
	}

	.feedback-error {
		border-color: #e8b8b2;
		background: #fff5f3;
		color: #8d3026;
	}

	.feedback-message {
		border-color: #b8d9c6;
		background: #f1faf4;
		color: #215b3e;
	}

	.signed-in {
		padding-top: 1.5rem;
		border-top: 1px solid #e7ece9;
	}

	@media (max-width: 38rem) {
		.form-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>
