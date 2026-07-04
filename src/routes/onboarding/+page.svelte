<!-- First-run welcome: a 3-step intro to pick a care type, name a cat, and start caring. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import Cat from '@lucide/svelte/icons/cat';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import Check from '@lucide/svelte/icons/check';
	import Bell from '@lucide/svelte/icons/bell';
	import Camera from '@lucide/svelte/icons/camera';
	import Star from '@lucide/svelte/icons/star';
	import logo from '$lib/assets/logo/logo.svg';
	import { getCatAvatar } from '$lib/cat-avatars';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let step = $state(1);
	let mode = $state<'owned' | 'community'>('owned');
	let name = $state('');
	let selectedAvatar = $state<string>('orange');
	let multipleCats = $state(false);
	let submitting = $state(false);

	let action = $derived(mode === 'owned' ? '?/owned' : '?/community');
	let nameLabel = $derived(mode === 'owned' ? 'Cat name' : 'Name');
	let namePlaceholder = $derived(mode === 'owned' ? 'Mochi, Luna, Orange...' : 'Optional');
	let multiLabel = $derived(
		mode === 'owned' ? 'I care for more than one cat' : 'I care for more than one community cat'
	);
	let finalCta = $derived(mode === 'owned' ? 'Start caring' : 'Start helping cats');
	let careTypeLabel = $derived(mode === 'owned' ? 'My cat' : 'Community cats');
	let previewName = $derived(name.trim() || 'Unnamed cat');
	let previewAvatar = $derived(getCatAvatar(selectedAvatar));
	let canContinue = $derived(mode === 'community' || name.trim().length > 0);

	function next() {
		step = Math.min(3, step + 1);
	}

	function previous() {
		step = Math.max(1, step - 1);
	}
</script>

<svelte:head>
	<title>Purrward | Welcome</title>
</svelte:head>

<div class="onboard">
	<header class="welcome">
		<span class="welcome-mark">
			<img src={logo} alt="Purrward" width="56" height="56" />
		</span>
		<ol class="steps" aria-label="Step {step} of 3">
			<li class:active={step >= 1}></li>
			<li class:active={step >= 2}></li>
			<li class:active={step >= 3}></li>
		</ol>
	</header>

	<form
		method="POST"
		{action}
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<input type="hidden" name="name" value={name} />
		<input type="hidden" name="avatarId" value={selectedAvatar} />

		{#if step === 1}
			<section class="step">
				<div class="step-head">
					<p class="eyebrow">Hey there!</p>
					<h1>Who do you care for?</h1>
					<p class="lede">Pick one.</p>
				</div>

				<div class="choice-grid" role="radiogroup" aria-label="Care type">
					<button
						type="button"
						class={['choice', mode === 'owned' && 'active']}
						role="radio"
						aria-checked={mode === 'owned'}
						onclick={() => (mode = 'owned')}
					>
						<span class="choice-icon"><Cat size={22} strokeWidth={2.1} aria-hidden="true" /></span>
						<span class="choice-title">My cat</span>
						<span class="choice-sub">Track food, water, and health.</span>
					</button>
					<button
						type="button"
						class={['choice', mode === 'community' && 'active']}
						role="radio"
						aria-checked={mode === 'community'}
						onclick={() => (mode = 'community')}
					>
						<span class="choice-icon">
							<HeartHandshake size={22} strokeWidth={2.1} aria-hidden="true" />
						</span>
						<span class="choice-title">Community cats</span>
						<span class="choice-sub">Help street and shelter cats.</span>
					</button>
				</div>

				<label class={['multi-chip', multipleCats && 'active']}>
					<input type="checkbox" bind:checked={multipleCats} />
					<span class="multi-check" aria-hidden="true">
						{#if multipleCats}<Check size={14} strokeWidth={3} />{/if}
					</span>
					<span class="multi-label">{multiLabel}</span>
				</label>

				<div class="actions">
					<button class="btn btn-primary" type="button" onclick={next}>Next</button>
				</div>
			</section>
		{/if}

		{#if step === 2}
			<section class="step">
				<div class="step-head">
					<h1>Name and look</h1>
				</div>

				<label class="field">
					<span>{nameLabel}</span>
					<input
						bind:value={name}
						placeholder={namePlaceholder}
						maxlength="40"
						autocomplete="off"
					/>
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
								value={avatar.id}
								checked={selectedAvatar === avatar.id}
								onchange={() => (selectedAvatar = avatar.id)}
							/>
							<img src={avatar.src} alt={avatar.label} />
							<span>{avatar.label}</span>
						</label>
					{/each}
				</fieldset>

				<div class="actions">
					<button class="btn btn-ghost" type="button" onclick={previous}>Previous</button>
					<button class="btn btn-primary" type="button" onclick={next} disabled={!canContinue}>
						Next
					</button>
				</div>
			</section>
		{/if}

		{#if step === 3}
			<section class="step">
				<div class="step-head">
					<h1>Ready to care?</h1>
				</div>

				<div class="preview">
					<span class="preview-avatar" aria-hidden="true">
						{#if previewAvatar}<img src={previewAvatar.src} alt="" />{/if}
					</span>
					<div class="preview-copy">
						<strong>{previewName}</strong>
						<span>{careTypeLabel}</span>
						{#if multipleCats}<span class="preview-tag">More than one</span>{/if}
					</div>
				</div>

				<ul class="summary">
					<li>
						<span class="summary-icon"><Bell size={17} strokeWidth={2.1} aria-hidden="true" /></span
						>
						<span>Daily reminder</span>
					</li>
					<li>
						<span class="summary-icon"
							><Camera size={17} strokeWidth={2.1} aria-hidden="true" /></span
						>
						<span>Photo check</span>
					</li>
					<li>
						<span class="summary-icon"><Star size={17} strokeWidth={2.1} aria-hidden="true" /></span
						>
						<span>Purrpoints</span>
					</li>
				</ul>

				{#if form?.message}
					<p class="field-error">{form.message}</p>
				{/if}

				<div class="actions">
					<button class="btn btn-ghost" type="button" onclick={previous} disabled={submitting}>
						Previous
					</button>
					<button class="btn btn-primary" type="submit" disabled={submitting}>
						{submitting ? 'Starting...' : finalCta}
					</button>
				</div>
			</section>
		{/if}
	</form>
</div>

<style>
	.onboard {
		display: flex;
		flex-direction: column;
		gap: 22px;
		max-width: 420px;
		min-height: calc(100dvh - 40px);
		margin: 0 auto;
		padding-top: 10px;
	}

	.welcome {
		display: grid;
		justify-items: start;
		gap: 14px;
	}

	.welcome-mark {
		display: grid;
		place-items: center;
		width: 60px;
		height: 60px;
		border-radius: 20px;
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		box-shadow: 0 10px 24px color-mix(in srgb, var(--color-charcoal) 9%, transparent);
	}

	.welcome-mark img {
		width: 46px;
		height: 46px;
		object-fit: contain;
	}

	.steps {
		display: flex;
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.steps li {
		width: 30px;
		height: 6px;
		border-radius: var(--radius-pill);
		background: var(--color-line);
		transition: background 200ms ease;
	}

	.steps li.active {
		background: var(--color-charcoal);
	}

	form {
		display: flex;
		flex: 1;
		flex-direction: column;
	}

	.step {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 16px;
	}

	.step-head {
		display: grid;
		gap: 4px;
	}

	.eyebrow {
		margin: 0;
		color: var(--color-peach);
		font-size: 0.9rem;
		font-weight: 800;
		filter: saturate(1.1) brightness(0.82);
	}

	.step-head h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.9rem;
		line-height: 1.08;
	}

	.lede {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.95rem;
		font-weight: 600;
	}

	.choice-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.choice {
		display: grid;
		justify-items: start;
		gap: 6px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		background: var(--color-paper-2);
		padding: 18px 14px;
		color: var(--color-charcoal);
		text-align: left;
		cursor: pointer;
		box-shadow: 0 8px 20px color-mix(in srgb, var(--color-charcoal) 5%, transparent);
		transition:
			background 160ms ease,
			border-color 160ms ease,
			transform 160ms var(--ease-mobile);
	}

	.choice:active {
		transform: scale(0.98);
	}

	.choice-icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 15px;
		background: var(--color-paper-3);
		color: var(--color-charcoal);
	}

	.choice.active {
		border-color: color-mix(in srgb, var(--color-success-text) 30%, var(--color-line));
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.choice.active .choice-icon {
		background: color-mix(in srgb, var(--color-paper-2) 70%, var(--color-sage-soft));
		color: var(--color-success-text);
	}

	.choice-title {
		font-size: 1rem;
		font-weight: 800;
	}

	.choice-sub {
		color: var(--color-muted);
		font-size: 0.76rem;
		font-weight: 600;
		line-height: 1.35;
	}

	.choice.active .choice-sub {
		color: color-mix(in srgb, var(--color-success-text) 80%, transparent);
	}

	.multi-chip {
		display: flex;
		align-items: center;
		gap: 10px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		padding: 12px 16px;
		font-size: 0.86rem;
		font-weight: 700;
		color: var(--color-charcoal);
		cursor: pointer;
		transition:
			background 160ms ease,
			border-color 160ms ease;
	}

	.multi-chip.active {
		background: var(--color-sage-soft);
		border-color: color-mix(in srgb, var(--color-success-text) 24%, var(--color-line));
		color: var(--color-success-text);
	}

	.multi-chip input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.multi-check {
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		flex: none;
		border-radius: 8px;
		border: 1.5px solid var(--color-line);
		background: var(--color-paper);
		color: var(--color-success-text);
	}

	.multi-chip.active .multi-check {
		border-color: color-mix(in srgb, var(--color-success-text) 40%, transparent);
		background: color-mix(in srgb, var(--color-paper-2) 80%, var(--color-sage-soft));
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
		background: var(--color-paper-2);
		color: var(--color-ink);
		padding: 13px 15px;
		font: inherit;
		font-size: 0.95rem;
	}

	.field input:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-peach) 60%, transparent);
		outline-offset: 1px;
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
		border: 1px solid transparent;
		border-radius: 16px;
		background: var(--color-paper-2);
		padding: 8px 6px;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--color-muted);
		cursor: pointer;
		transition:
			background 140ms ease,
			border-color 140ms ease,
			color 140ms ease;
	}

	.avatar-choice.active {
		background: var(--color-sage-soft);
		border-color: color-mix(in srgb, var(--color-success-text) 22%, transparent);
		color: var(--color-success-text);
	}

	.avatar-choice input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.avatar-choice img {
		width: 40px;
		height: 40px;
		object-fit: contain;
	}

	.preview {
		display: flex;
		align-items: center;
		gap: 14px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		background: var(--color-paper-2);
		padding: 16px;
		box-shadow: var(--shadow-card);
	}

	.preview-avatar {
		display: grid;
		place-items: center;
		width: 60px;
		height: 60px;
		flex: none;
		border-radius: 20px;
		background: var(--color-peach-soft);
		overflow: hidden;
	}

	.preview-avatar img {
		width: 48px;
		height: 48px;
		object-fit: contain;
	}

	.preview-copy {
		display: grid;
		gap: 3px;
		min-width: 0;
	}

	.preview-copy strong {
		color: var(--color-ink);
		font-size: 1.1rem;
		font-weight: 800;
	}

	.preview-copy span {
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.preview-tag {
		justify-self: start;
		border-radius: var(--radius-pill);
		background: var(--color-sage-soft);
		color: var(--color-success-text);
		padding: 2px 10px;
		font-size: 0.72rem;
		font-weight: 800;
	}

	.summary {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.summary li {
		display: grid;
		justify-items: center;
		gap: 8px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		background: var(--color-paper-2);
		padding: 14px 8px;
		font-size: 0.76rem;
		font-weight: 800;
		color: var(--color-charcoal);
		text-align: center;
	}

	.summary-icon {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 13px;
		background: var(--color-peach-soft);
		color: var(--color-charcoal);
	}

	.actions {
		display: flex;
		gap: 10px;
		margin-top: auto;
		padding-top: 8px;
	}

	.btn {
		flex: 1;
		min-height: 54px;
		border-radius: var(--radius-pill);
		font-size: 1rem;
		font-weight: 850;
		cursor: pointer;
		transition:
			transform 160ms var(--ease-mobile),
			opacity 160ms ease;
	}

	.btn:active {
		transform: translateY(1px) scale(0.99);
	}

	.btn-primary {
		border: 0;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 18%, transparent);
	}

	.btn-primary:disabled {
		opacity: 0.55;
		cursor: not-allowed;
		box-shadow: none;
	}

	.btn-ghost {
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
	}

	.btn-ghost:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	@media (prefers-reduced-motion: reduce) {
		.choice,
		.multi-chip,
		.avatar-choice,
		.btn,
		.steps li {
			transition: none;
		}
	}

	@media (max-width: 360px) {
		.avatar-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
