<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Mail from '@lucide/svelte/icons/mail';
	import { fieldWarning, formInput, type FieldWarnings } from '$lib/form-validation';
	import type { PageProps } from './$types';

	type ForgotForm = {
		message?: string;
		devResetPath?: `/auth/reset/${string}`;
		values?: { email?: string };
	};

	let { form }: PageProps = $props();
	let resetForm = $derived((form ?? null) as ForgotForm | null);
	let clientErrors = $state<FieldWarnings>({});
	let emailError = $derived(clientErrors.email);

	function clearEmailError() {
		if (clientErrors.email) clientErrors = { ...clientErrors, email: undefined };
	}

	function validateResetRequest(event: SubmitEvent) {
		const form = event.currentTarget;
		if (!(form instanceof HTMLFormElement)) return;

		const email = formInput(form, 'email');
		clientErrors = { email: email ? fieldWarning(email, 'Email address') : undefined };
		if (clientErrors.email) event.preventDefault();
	}
</script>

<!-- Password reset request page for email accounts. -->

<svelte:head>
	<title>Purrward | Reset password</title>
</svelte:head>

<section class="reset-screen" aria-labelledby="reset-title">
	<a class="back-link" href={resolve('/auth/login')} aria-label="Back to sign in">
		<ChevronLeft size={22} strokeWidth={2.3} aria-hidden="true" />
	</a>

	<div class="reset-card">
		<div class="reset-heading">
			<h1 id="reset-title">Forgot password?</h1>
			<p>Email account</p>
		</div>

		<form
			method="POST"
			class="reset-form"
			aria-describedby="reset-feedback"
			novalidate
			onsubmit={validateResetRequest}
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
						value={resetForm?.values?.email ?? ''}
						aria-invalid={Boolean(emailError)}
						oninput={clearEmailError}
						required
					/>
				</span>
				{#if emailError}
					<small>{emailError}</small>
				{/if}
			</label>

			{#if resetForm?.message}
				<p id="reset-feedback" class="form-message" aria-live="polite">{resetForm.message}</p>
			{:else}
				<p id="reset-feedback" class="helper">Use the email on your Purrward password account.</p>
			{/if}

			{#if resetForm?.devResetPath}
				<a class="dev-reset-link" href={resolve(resetForm.devResetPath)}>Open reset link</a>
			{/if}

			<button class="submit-button" type="submit">Send reset link</button>
		</form>
	</div>
</section>

<style>
	.reset-screen {
		display: grid;
		min-height: calc(100svh - 36px);
		align-content: center;
		gap: 16px;
	}

	@supports (height: 100dvh) {
		.reset-screen {
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

	.reset-card {
		display: grid;
		gap: 18px;
		border: 1px solid var(--color-line);
		border-radius: 34px;
		background:
			radial-gradient(
				circle at 12% 0%,
				color-mix(in srgb, var(--color-sky-soft) 38%, transparent),
				transparent 36%
			),
			var(--color-paper-2);
		padding: 24px 18px 20px;
		box-shadow: var(--shadow-float);
	}

	.reset-heading {
		display: grid;
		gap: 4px;
	}

	.reset-heading p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 850;
	}

	.reset-heading h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: clamp(1.75rem, 8vw, 2.1rem);
		line-height: 1.05;
	}

	.reset-form {
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
		grid-template-columns: 22px 1fr;
		gap: 9px;
		align-items: center;
		min-height: 50px;
		border: 1px solid color-mix(in srgb, var(--color-line) 92%, transparent);
		border-radius: 18px;
		background: var(--color-paper);
		padding: 0 12px;
		color: var(--color-muted);
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
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.field small {
		background: var(--color-danger-bg);
		color: var(--color-danger-text);
	}

	.dev-reset-link,
	.submit-button {
		display: inline-flex;
		width: 100%;
		min-height: 50px;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: var(--radius-pill);
		font-size: 0.94rem;
		font-weight: 900;
		text-decoration: none;
		cursor: pointer;
	}

	.dev-reset-link {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.submit-button {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 18%, transparent);
	}
</style>
