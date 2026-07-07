<script lang="ts">
	import { resolve } from '$app/paths';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import LockKeyhole from '@lucide/svelte/icons/lock-keyhole';
	import Mail from '@lucide/svelte/icons/mail';
	import { fieldWarning, formInput, type FieldWarnings } from '$lib/form-validation';
	import logo from '$lib/assets/logo/logo.svg';
	import type { PageProps } from './$types';

	type AuthForm = {
		mode?: 'login' | 'register';
		message?: string;
		values?: { email?: string };
		errors?: { email?: string; password?: string };
	};

	let { form }: PageProps = $props();
	let authForm = $derived((form ?? null) as AuthForm | null);
	let selectedMode = $state<'login' | 'register' | null>(null);
	let clientErrors = $state<FieldWarnings>({});
	let serverMode = $derived(authForm?.mode === 'register' ? 'register' : 'login');
	let mode = $derived(selectedMode ?? serverMode);
	let showPassword = $state(false);
	let title = $derived(mode === 'login' ? 'Sign in' : 'Create account');
	let action = $derived(mode === 'login' ? '?/login' : '?/register');
	let emailError = $derived(clientErrors.email ?? authForm?.errors?.email);
	let passwordError = $derived(clientErrors.password ?? authForm?.errors?.password);
	let passwordAutocomplete = $derived(
		mode === 'login' ? ('current-password' as const) : ('new-password' as const)
	);

	function clearClientError(field: 'email' | 'password') {
		if (!clientErrors[field]) return;
		clientErrors = { ...clientErrors, [field]: undefined };
	}

	function validateAuth(event: SubmitEvent) {
		const form = event.currentTarget;
		if (!(form instanceof HTMLFormElement)) return;

		const email = formInput(form, 'email');
		const password = formInput(form, 'password');
		const nextErrors: FieldWarnings = {
			email: email ? fieldWarning(email, 'Email address') : undefined,
			password: password ? fieldWarning(password, 'Password') : undefined
		};

		clientErrors = nextErrors;
		if (nextErrors.email || nextErrors.password) event.preventDefault();
	}
</script>

<!-- Cozy auth page for Google and email/password sign-in. -->

<svelte:head>
	<title>Purrward | Sign in</title>
</svelte:head>

<section class="auth-screen" aria-labelledby="auth-title">
	<div class="cat-badge" aria-hidden="true">
		<img src={logo} alt="" width="96" height="96" />
	</div>

	<div class="auth-card">
		<div class="auth-heading">
			<h1 id="auth-title">{title}</h1>
			<p>{mode === 'login' ? 'Welcome back' : 'Start saving care'}</p>
		</div>

		<div class="mode-switch" role="tablist" aria-label="Choose auth mode">
			<button
				type="button"
				role="tab"
				aria-selected={mode === 'login'}
				class={mode === 'login' ? 'active' : undefined}
				onclick={() => (selectedMode = 'login')}
			>
				Sign in
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={mode === 'register'}
				class={mode === 'register' ? 'active' : undefined}
				onclick={() => (selectedMode = 'register')}
			>
				Create
			</button>
		</div>

		<!-- data-sveltekit-reload: /auth/google is a server endpoint that 302s to Google;
		     force a full navigation so the browser follows the redirect instead of the SPA router. -->
		<a class="google-button" href={resolve('/auth/google')} data-sveltekit-reload>
			<span class="google-mark" aria-hidden="true">G</span>
			<span>Continue with Google</span>
		</a>

		<div class="divider"><span>or</span></div>

		<form method="POST" action="?/guest">
			<button class="guest-button" type="submit">Continue as guest</button>
		</form>

		<div class="divider"><span>or</span></div>

		<form
			method="POST"
			{action}
			class="email-form"
			aria-describedby="auth-feedback"
			novalidate
			onsubmit={validateAuth}
		>
			<label class="field">
				<span>Email address</span>
				<span class="input-wrap">
					<Mail size={18} strokeWidth={2.1} aria-hidden="true" />
					<input
						name="email"
						type="email"
						autocomplete="email"
						inputmode="email"
						maxlength="254"
						value={authForm?.values?.email ?? ''}
						aria-invalid={Boolean(emailError)}
						oninput={() => clearClientError('email')}
						required
					/>
				</span>
				{#if emailError}
					<small>{emailError}</small>
				{/if}
			</label>

			<label class="field">
				<span>Password</span>
				<span class="input-wrap">
					<LockKeyhole size={18} strokeWidth={2.1} aria-hidden="true" />
					<input
						name="password"
						type={showPassword ? 'text' : 'password'}
						autocomplete={passwordAutocomplete}
						minlength="10"
						maxlength="128"
						aria-invalid={Boolean(passwordError)}
						oninput={() => clearClientError('password')}
						required
					/>
					<button
						class="show-password"
						type="button"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}
							<EyeOff size={17} strokeWidth={2.1} aria-hidden="true" />
						{:else}
							<Eye size={17} strokeWidth={2.1} aria-hidden="true" />
						{/if}
					</button>
				</span>
				{#if passwordError}
					<small>{passwordError}</small>
				{/if}
			</label>

			{#if mode === 'login'}
				<a class="forgot-link" href={resolve('/auth/forgot')}>Forgot password?</a>
			{/if}

			{#if authForm?.message}
				<p id="auth-feedback" class="form-message" aria-live="polite">{authForm.message}</p>
			{:else}
				<p id="auth-feedback" class="sr-only">Use Google or email to continue.</p>
			{/if}

			<button class="submit-button" type="submit">
				{mode === 'login' ? 'Login' : 'Create account'}
			</button>
		</form>
	</div>
</section>

<style>
	.auth-screen {
		display: grid;
		min-height: calc(100svh - 36px);
		align-content: center;
		gap: 10px;
		padding-block: clamp(10px, 3dvh, 24px);
	}

	@supports (height: 100dvh) {
		.auth-screen {
			min-height: calc(100dvh - 36px);
		}
	}

	.cat-badge {
		position: relative;
		z-index: 1;
		display: grid;
		width: 76px;
		height: 76px;
		justify-self: center;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--color-line) 86%, transparent);
		border-radius: 30px;
		background:
			radial-gradient(
				circle at 38% 26%,
				color-mix(in srgb, var(--color-peach-soft) 68%, transparent),
				transparent 56%
			),
			var(--color-paper-2);
		box-shadow: var(--shadow-card);
	}

	.cat-badge img {
		width: 62px;
		height: 62px;
		object-fit: contain;
		filter: drop-shadow(0 2px 6px color-mix(in srgb, var(--color-charcoal) 16%, transparent));
	}

	.auth-card {
		display: grid;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 34px;
		background:
			radial-gradient(
				circle at 16% 0%,
				color-mix(in srgb, var(--color-sky-soft) 38%, transparent),
				transparent 36%
			),
			radial-gradient(
				circle at 100% 24%,
				color-mix(in srgb, var(--color-peach-soft) 42%, transparent),
				transparent 34%
			),
			var(--color-paper-2);
		padding: 18px 18px 16px;
		box-shadow: var(--shadow-float);
	}

	.auth-heading {
		display: grid;
		gap: 4px;
		text-align: center;
	}

	.auth-heading p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 850;
	}

	.auth-heading h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: clamp(1.72rem, 7vw, 2.08rem);
		line-height: 1.02;
	}

	.mode-switch {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
		border-radius: var(--radius-pill);
		background: var(--color-paper);
		padding: 5px;
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-line) 84%, transparent);
	}

	.mode-switch button {
		min-height: 36px;
		border: 0;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 900;
		cursor: pointer;
	}

	.mode-switch button.active {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		box-shadow: 0 8px 16px color-mix(in srgb, var(--color-charcoal) 12%, transparent);
	}

	.google-button,
	.guest-button,
	.submit-button {
		display: inline-flex;
		width: 100%;
		min-height: 46px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border: 0;
		border-radius: var(--radius-pill);
		font-size: 0.96rem;
		font-weight: 900;
		text-decoration: none;
		cursor: pointer;
		transition: transform 120ms ease;
	}

	.google-button {
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 10px 22px color-mix(in srgb, var(--color-charcoal) 6%, transparent);
	}

	.guest-button {
		border: 1px solid color-mix(in srgb, var(--color-charcoal) 18%, var(--color-line));
		background: var(--color-sage-soft);
		color: var(--color-charcoal);
	}

	.google-button:active,
	.guest-button:active,
	.submit-button:active {
		transform: translateY(1px);
	}

	.google-mark {
		display: grid;
		width: 26px;
		height: 26px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-sky-soft);
		color: var(--color-ink);
		font-size: 0.88rem;
		font-weight: 900;
	}

	.divider {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 12px;
		color: var(--color-muted);
		font-size: 0.76rem;
		font-weight: 800;
	}

	.divider::before,
	.divider::after {
		content: '';
		height: 1px;
		background: var(--color-line);
	}

	.email-form {
		display: grid;
		gap: 10px;
	}

	.field {
		display: grid;
		gap: 7px;
	}

	.field > span:first-child {
		color: var(--color-charcoal);
		font-size: 0.78rem;
		font-weight: 850;
	}

	.input-wrap {
		display: grid;
		grid-template-columns: 22px 1fr auto;
		gap: 9px;
		align-items: center;
		min-height: 46px;
		border: 1px solid color-mix(in srgb, var(--color-line) 92%, transparent);
		border-radius: 18px;
		background: var(--color-paper);
		padding: 0 12px;
		color: var(--color-muted);
		box-shadow: inset 0 1px 0 color-mix(in srgb, var(--color-paper-2) 80%, transparent);
	}

	.input-wrap:focus-within {
		border-color: color-mix(in srgb, var(--color-charcoal) 30%, var(--color-line));
		background: var(--color-paper-2);
	}

	.input-wrap input {
		min-width: 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: var(--color-ink);
		font-size: 0.94rem;
		font-weight: 650;
	}

	.show-password {
		display: grid;
		width: 30px;
		height: 30px;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--color-muted);
		cursor: pointer;
	}

	.field small,
	.form-message {
		margin: 0;
		border-radius: 16px;
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
		padding: 9px 11px;
		font-size: 0.78rem;
		font-weight: 750;
		line-height: 1.34;
	}

	.forgot-link {
		justify-self: start;
		color: var(--color-info-text);
		font-size: 0.82rem;
		font-weight: 850;
		text-decoration: none;
	}

	.submit-button {
		margin-top: 0;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 18%, transparent);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}

	@media (max-width: 360px) {
		.auth-card {
			padding-inline: 16px;
		}

		.google-button,
		.guest-button,
		.submit-button {
			font-size: 0.9rem;
		}
	}

	@media (max-height: 640px) {
		.auth-screen {
			gap: 8px;
			padding-block: 8px;
		}

		.cat-badge {
			width: 62px;
			height: 62px;
			border-radius: 24px;
		}

		.cat-badge img {
			width: 52px;
			height: 52px;
		}

		.auth-card {
			gap: 9px;
			padding-block: 14px;
		}

		.auth-heading h1 {
			font-size: 1.58rem;
		}

		.mode-switch button,
		.google-button,
		.guest-button,
		.submit-button,
		.input-wrap {
			min-height: 42px;
		}
	}
</style>
