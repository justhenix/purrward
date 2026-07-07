<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import LockKeyhole from '@lucide/svelte/icons/lock-keyhole';
	import { fieldWarning, formInput, type FieldWarnings } from '$lib/form-validation';
	import type { PageProps } from './$types';

	type ResetForm = { message?: string };

	let { form }: PageProps = $props();
	let resetForm = $derived((form ?? null) as ResetForm | null);
	let showPassword = $state(false);
	let clientErrors = $state<FieldWarnings>({});
	let passwordError = $derived(clientErrors.password);
	let confirmPasswordError = $derived(clientErrors.confirmPassword);

	function clearClientError(field: 'password' | 'confirmPassword') {
		if (!clientErrors[field]) return;
		clientErrors = { ...clientErrors, [field]: undefined };
	}

	function validatePasswordReset(event: SubmitEvent) {
		const form = event.currentTarget;
		if (!(form instanceof HTMLFormElement)) return;

		const password = formInput(form, 'password');
		const confirmPassword = formInput(form, 'confirmPassword');
		const nextErrors: FieldWarnings = {
			password: password ? fieldWarning(password, 'Password') : undefined,
			confirmPassword: confirmPassword
				? fieldWarning(confirmPassword, 'Confirm password')
				: undefined
		};

		if (!nextErrors.password && !nextErrors.confirmPassword && password && confirmPassword) {
			nextErrors.confirmPassword =
				password.value === confirmPassword.value ? undefined : 'Passwords do not match.';
		}

		clientErrors = nextErrors;
		if (nextErrors.password || nextErrors.confirmPassword) event.preventDefault();
	}
</script>

<!-- Password reset page for one-time email reset links. -->

<svelte:head>
	<title>Purrward | New password</title>
</svelte:head>

<section class="new-password-screen" aria-labelledby="new-password-title">
	<a class="back-link" href={resolve('/auth/login')} aria-label="Back to sign in">
		<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
	</a>

	<div class="password-card">
		<div class="password-heading">
			<h1 id="new-password-title">New password</h1>
			<p>Email account</p>
		</div>

		<form
			method="POST"
			class="password-form"
			aria-describedby="password-feedback"
			novalidate
			onsubmit={validatePasswordReset}
		>
			<label class="field">
				<span>Password</span>
				<span class="input-wrap">
					<LockKeyhole size={18} strokeWidth={2.1} aria-hidden="true" />
					<input
						name="password"
						type={showPassword ? 'text' : 'password'}
						autocomplete="new-password"
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

			<label class="field">
				<span>Confirm password</span>
				<span class="input-wrap">
					<LockKeyhole size={18} strokeWidth={2.1} aria-hidden="true" />
					<input
						name="confirmPassword"
						type={showPassword ? 'text' : 'password'}
						autocomplete="new-password"
						minlength="10"
						maxlength="128"
						aria-invalid={Boolean(confirmPasswordError)}
						oninput={() => clearClientError('confirmPassword')}
						required
					/>
				</span>
				{#if confirmPasswordError}
					<small>{confirmPasswordError}</small>
				{/if}
			</label>

			{#if resetForm?.message}
				<p id="password-feedback" class="form-message" aria-live="polite">{resetForm.message}</p>
			{:else}
				<p id="password-feedback" class="helper">Use 10-128 characters.</p>
			{/if}

			<button class="submit-button" type="submit">Save password</button>
		</form>
	</div>
</section>

<style>
	.new-password-screen {
		display: grid;
		min-height: calc(100svh - 36px);
		align-content: center;
		gap: 16px;
	}

	@supports (height: 100dvh) {
		.new-password-screen {
			min-height: calc(100dvh - 36px);
		}
	}

	.back-link {
		display: grid;
		width: 46px;
		height: 46px;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 10px 24px color-mix(in srgb, var(--color-charcoal) 7%, transparent);
	}

	.password-card {
		display: grid;
		gap: 18px;
		border: 1px solid var(--color-line);
		border-radius: 34px;
		background:
			radial-gradient(
				circle at 100% 0%,
				color-mix(in srgb, var(--color-sage-soft) 42%, transparent),
				transparent 36%
			),
			var(--color-paper-2);
		padding: 24px 18px 20px;
		box-shadow: var(--shadow-float);
	}

	.password-heading {
		display: grid;
		gap: 4px;
	}

	.password-heading p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 850;
	}

	.password-heading h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: clamp(1.75rem, 8vw, 2.1rem);
		line-height: 1.05;
	}

	.password-form {
		display: grid;
		gap: 13px;
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
		min-height: 50px;
		border: 1px solid color-mix(in srgb, var(--color-line) 92%, transparent);
		border-radius: 18px;
		background: var(--color-paper);
		padding: 0 12px;
		color: var(--color-muted);
	}

	.field:nth-of-type(2) .input-wrap {
		grid-template-columns: 22px 1fr;
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

	.helper,
	.form-message,
	.field small {
		margin: 0;
		border-radius: 16px;
		padding: 10px 12px;
		font-size: 0.8rem;
		font-weight: 750;
		line-height: 1.36;
	}

	.helper {
		background: var(--color-info-bg);
		color: var(--color-info-text);
	}

	.form-message {
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
	}

	.field small {
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
	}

	.submit-button {
		display: inline-flex;
		width: 100%;
		min-height: 50px;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		font-size: 0.94rem;
		font-weight: 900;
		text-decoration: none;
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 18%, transparent);
		cursor: pointer;
	}
</style>
