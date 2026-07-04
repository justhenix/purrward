<!-- First-run onboarding: pick an owned cat or join free (community) cat mode. -->
<script lang="ts">
	import Cat from '@lucide/svelte/icons/cat';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let mode = $state<'owned' | 'community'>('owned');
	let name = $state('');
	let selectedAvatar = $state<string>('orange');

	let action = $derived(mode === 'owned' ? '?/owned' : '?/community');
	let heading = $derived(mode === 'owned' ? 'Add your cat' : 'Care for a community cat');
	let namePlaceholder = $derived(mode === 'owned' ? 'e.g. Mochi' : 'Optional (we can name them)');
</script>

<svelte:head>
	<title>Purrward | Welcome</title>
</svelte:head>

<div class="onboard">
	<header class="onboard-head">
		<p>Welcome to Purrward</p>
		<h1>Who are you caring for?</h1>
	</header>

	<div class="mode-switch" aria-label="Cat type">
		<button
			type="button"
			class:active={mode === 'owned'}
			aria-pressed={mode === 'owned'}
			onclick={() => (mode = 'owned')}
		>
			<Cat size={18} strokeWidth={2.2} aria-hidden="true" />
			<span>My cat</span>
		</button>
		<button
			type="button"
			class:active={mode === 'community'}
			aria-pressed={mode === 'community'}
			onclick={() => (mode = 'community')}
		>
			<HeartHandshake size={18} strokeWidth={2.2} aria-hidden="true" />
			<span>Free cat mode</span>
		</button>
	</div>

	<p class="mode-hint">
		{mode === 'owned'
			? 'Track daily care for a cat you own.'
			: 'No pet needed. Log street feeding and shelter care for community cats.'}
	</p>

	<form class="onboard-form" method="POST" {action}>
		<h2>{heading}</h2>

		<label class="field">
			<span>Name</span>
			<input name="name" bind:value={name} placeholder={namePlaceholder} maxlength="40" />
		</label>
		{#if form?.field === 'name'}
			<p class="field-error">{form.message}</p>
		{/if}

		<fieldset class="avatar-grid">
			<legend>Choose an avatar</legend>
			{#each data.avatars as avatar (avatar.id)}
				<label class={['avatar-choice', selectedAvatar === avatar.id && 'active']}>
					<input
						type="radio"
						name="avatarId"
						value={avatar.id}
						checked={selectedAvatar === avatar.id}
						onchange={() => (selectedAvatar = avatar.id)}
					/>
					<img src={avatar.src} alt={avatar.label} />
					<span>{avatar.label}</span>
				</label>
			{/each}
		</fieldset>
		{#if form?.field === 'avatar'}
			<p class="field-error">{form.message}</p>
		{/if}

		{#if form && !form.field}
			<p class="field-error">{form.message}</p>
		{/if}

		<button class="submit" type="submit">
			{mode === 'owned' ? 'Start caring' : 'Join free cat mode'}
		</button>
	</form>
</div>

<style>
	.onboard {
		display: grid;
		gap: 16px;
		padding-top: 8px;
	}

	.onboard-head p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.9rem;
		font-weight: 800;
	}

	.onboard-head h1 {
		margin: 4px 0 0;
		color: var(--color-ink);
		font-size: 1.75rem;
		line-height: 1.05;
	}

	.mode-switch {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		border: 1px solid var(--color-line);
		border-radius: 22px;
		background: var(--color-paper-3);
		padding: 5px;
	}

	.mode-switch button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 0;
		border-radius: 18px;
		background: transparent;
		color: var(--color-muted);
		padding: 11px 8px;
		font-size: 0.85rem;
		font-weight: 800;
		cursor: pointer;
	}

	.mode-switch button.active {
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: var(--shadow-card);
	}

	.mode-hint {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.onboard-form {
		display: grid;
		gap: 14px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card-lg);
		background: var(--color-paper-2);
		padding: 18px;
		box-shadow: var(--shadow-card);
	}

	.onboard-form h2 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.24rem;
	}

	.field {
		display: grid;
		gap: 6px;
	}

	.field span {
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.field input {
		border: 1px solid var(--color-line);
		border-radius: 16px;
		background: var(--color-paper);
		color: var(--color-ink);
		padding: 12px 14px;
		font: inherit;
		font-size: 0.95rem;
	}

	.field-error {
		margin: 0;
		color: var(--color-danger-text);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.avatar-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		border: 0;
		margin: 0;
		padding: 0;
	}

	.avatar-grid legend {
		margin-bottom: 8px;
		padding: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
	}

	.avatar-choice {
		display: grid;
		justify-items: center;
		gap: 5px;
		border-radius: 18px;
		background: var(--color-paper);
		padding: 8px 6px;
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--color-charcoal);
		cursor: pointer;
		box-shadow: 0 6px 14px color-mix(in srgb, var(--color-charcoal) 5%, transparent);
	}

	.avatar-choice.active {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-success-text) 18%, transparent);
	}

	.avatar-choice input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.avatar-choice img {
		width: 42px;
		height: 42px;
		object-fit: contain;
	}

	.submit {
		min-height: 52px;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		font-size: 1rem;
		font-weight: 850;
		cursor: pointer;
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 18%, transparent);
	}

	@media (max-width: 360px) {
		.avatar-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
