<!-- First-run onboarding: a warm 3-step flow to pick a care path, build a cat profile, and start caring. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import Cat from '@lucide/svelte/icons/cat';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import Check from '@lucide/svelte/icons/check';
	import CalendarCheck from '@lucide/svelte/icons/calendar-check';
	import Camera from '@lucide/svelte/icons/camera';
	import Star from '@lucide/svelte/icons/star';
	import logo from '$lib/assets/logo/logo.svg';
	import catPolaroid from '$lib/assets/cats/misc/cat-polaroid.webp';
	import { getCatAvatar } from '$lib/cat-avatars';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let step = $state(1);
	let mode = $state<'owned' | 'community'>('owned');
	let name = $state('');
	let selectedAvatar = $state<string>('orange');
	let multipleCats = $state(false);
	let submitting = $state(false);

	const isCommunity = $derived(mode === 'community');
	const action = $derived(isCommunity ? '?/community' : '?/owned');
	const stepLabel = $derived(`Step ${step} of 3`);

	// Step 2 copy adapts to the chosen care path.
	const profileTitle = $derived(isCommunity ? 'Care profile' : 'Name and look');
	const profileSubtitle = $derived(
		isCommunity ? 'Name the cat or group you care for.' : "Create your cat's profile."
	);
	const nameLabel = $derived(isCommunity ? 'Care name' : 'Cat name');
	const namePlaceholder = $derived(
		isCommunity ? 'Campus Cats, Shelter A, Orange...' : 'Mochi, Luna, Orange...'
	);

	// Preview + summary state.
	const trimmedName = $derived(name.trim());
	const placeholderName = $derived(isCommunity ? 'Care group' : 'Your cat');
	const previewName = $derived(trimmedName || placeholderName);
	const careTypeLabel = $derived(isCommunity ? 'Community cats' : 'My cat');
	const previewAvatar = $derived(getCatAvatar(selectedAvatar));
	const canContinue = $derived(trimmedName.length > 0);

	// Step 3 benefit labels shift with the care path (routine vs logs, check vs proof).
	const routineLabel = $derived(isCommunity ? 'Care logs' : 'Daily routine');
	const photoLabel = $derived(isCommunity ? 'Photo proof' : 'Photo check');

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
	<header class="ob-header">
		<span class="ob-mark">
			<img src={logo} alt="Purrward" width="56" height="56" />
		</span>
		<div class="progress" aria-hidden="true">
			<div class="bars">
				<span class="bar" class:filled={step > 1} class:current={step === 1}></span>
				<span class="bar" class:filled={step > 2} class:current={step === 2}></span>
				<span class="bar" class:current={step === 3}></span>
			</div>
			<span class="progress-label">{stepLabel}</span>
		</div>
	</header>

	<form
		class="ob-form"
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
		<input type="hidden" name="name" value={trimmedName} />
		<input type="hidden" name="avatarId" value={selectedAvatar} />

		{#if step === 1}
			<section class="step" aria-label={stepLabel}>
				<div class="step-content">
					<span class="welcome-polaroid" aria-hidden="true">
						{#if previewAvatar}<img class="polaroid-subject" src={previewAvatar.src} alt="" />{/if}
						<img class="polaroid-frame" src={catPolaroid} alt="" />
					</span>

					<div class="step-head">
						<p class="eyebrow">Let's set up care</p>
						<h1>Who are you caring for?</h1>
						<p class="subtitle">Choose your care path.</p>
					</div>

					<div class="path-grid" role="radiogroup" aria-label="Care path">
						<button
							type="button"
							class={['path-card', !isCommunity && 'active']}
							role="radio"
							aria-checked={!isCommunity}
							onclick={() => (mode = 'owned')}
						>
							<span class="path-icon"><Cat size={24} strokeWidth={2.1} aria-hidden="true" /></span>
							<span class="path-text">
								<span class="path-title">My cat</span>
								<span class="path-body">Daily care for your own cat.</span>
							</span>
							<span class="path-check" aria-hidden="true">
								{#if !isCommunity}<Check size={15} strokeWidth={3} />{/if}
							</span>
						</button>

						<button
							type="button"
							class={['path-card', isCommunity && 'active']}
							role="radio"
							aria-checked={isCommunity}
							onclick={() => (mode = 'community')}
						>
							<span class="path-icon">
								<HeartHandshake size={24} strokeWidth={2.1} aria-hidden="true" />
							</span>
							<span class="path-text">
								<span class="path-title">Community cats</span>
								<span class="path-body">Care logs for street, shelter, or shared cats.</span>
							</span>
							<span class="path-check" aria-hidden="true">
								{#if isCommunity}<Check size={15} strokeWidth={3} />{/if}
							</span>
						</button>
					</div>

					<label class={['multi-toggle', multipleCats && 'active']}>
						<input type="checkbox" bind:checked={multipleCats} />
						<span class="multi-box" aria-hidden="true">
							{#if multipleCats}<Check size={13} strokeWidth={3} />{/if}
						</span>
						<span class="multi-label">I care for more than one cat</span>
					</label>
				</div>

				<div class="actions">
					<button class="btn btn-primary" type="button" onclick={next}>Next</button>
				</div>
			</section>
		{/if}

		{#if step === 2}
			<section class="step" aria-label={stepLabel}>
				<div class="step-content">
					<div class="step-head">
						<h1>{profileTitle}</h1>
						<p class="subtitle">{profileSubtitle}</p>
					</div>

					<div class="preview-box">
						<span class="preview-portrait" aria-hidden="true">
							{#if previewAvatar}<img src={previewAvatar.src} alt="" />{/if}
						</span>
						<span class="preview-name" class:muted={!trimmedName}>{previewName}</span>
						<span class="preview-path">{careTypeLabel}</span>
					</div>

					<label class="field">
						<span class="field-label">{nameLabel}</span>
						<input
							bind:value={name}
							placeholder={namePlaceholder}
							maxlength="40"
							autocomplete="off"
							aria-invalid={form?.field === 'name' ? true : undefined}
						/>
					</label>

					<fieldset class="avatar-grid">
						<legend>Pick a look</legend>
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
				</div>

				<div class="actions actions-stacked">
					{#if !canContinue}
						<p class="helper">Enter a name to continue.</p>
					{:else if form?.field === 'name'}
						<p class="helper error">{form.message}</p>
					{/if}
					<div class="actions-row">
						<button class="btn btn-ghost" type="button" onclick={previous}>Previous</button>
						<button class="btn btn-primary" type="button" onclick={next} disabled={!canContinue}>
							Next
						</button>
					</div>
				</div>
			</section>
		{/if}

		{#if step === 3}
			<section class="step" aria-label={stepLabel}>
				<div class="step-content">
					<div class="step-head">
						<h1>Ready to care?</h1>
						<p class="subtitle">Here's your care profile.</p>
					</div>

					<div class="summary-card">
						<span class="summary-portrait" aria-hidden="true">
							{#if previewAvatar}<img src={previewAvatar.src} alt="" />{/if}
						</span>
						<div class="summary-copy">
							<strong>{previewName}</strong>
							<span class="summary-path">{careTypeLabel}</span>
							{#if multipleCats}<span class="summary-tag">More than one cat</span>{/if}
						</div>
					</div>

					<ul class="benefits">
						<li>
							<span class="benefit-icon">
								<CalendarCheck size={18} strokeWidth={2.1} aria-hidden="true" />
							</span>
							<span>{routineLabel}</span>
						</li>
						<li>
							<span class="benefit-icon">
								<Camera size={18} strokeWidth={2.1} aria-hidden="true" />
							</span>
							<span>{photoLabel}</span>
						</li>
						<li>
							<span class="benefit-icon">
								<Star size={18} strokeWidth={2.1} aria-hidden="true" />
							</span>
							<span>Purrpoints</span>
						</li>
					</ul>

					{#if form?.message && form?.field !== 'name'}
						<p class="helper error">{form.message}</p>
					{/if}
				</div>

				<div class="actions">
					<button class="btn btn-ghost" type="button" onclick={previous} disabled={submitting}>
						Previous
					</button>
					<button class="btn btn-primary" type="submit" disabled={submitting}>
						{submitting ? 'Starting...' : 'Start caring'}
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
		gap: 20px;
		max-width: 480px;
		min-height: calc(100svh - 36px);
		margin-inline: auto;
	}

	/* Header: brand mark + progress bars with a readable step label. */
	.ob-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-top: 4px;
	}

	.ob-mark {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		flex: none;
		border-radius: 20px;
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		box-shadow: var(--shadow-card);
	}

	.ob-mark img {
		width: 42px;
		height: 42px;
		object-fit: contain;
	}

	.progress {
		display: grid;
		justify-items: end;
		gap: 8px;
	}

	.bars {
		display: flex;
		gap: 7px;
	}

	.bar {
		width: 26px;
		height: 6px;
		border-radius: var(--radius-pill);
		background: var(--color-line);
		transition:
			background 220ms ease,
			width 220ms var(--ease-mobile);
	}

	.bar.filled {
		background: color-mix(in srgb, var(--color-charcoal) 45%, var(--color-line));
	}

	.bar.current {
		width: 34px;
		background: var(--color-charcoal);
	}

	.progress-label {
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.ob-form {
		display: flex;
		flex: 1;
		flex-direction: column;
	}

	/* Center the content + actions cluster so tall screens feel balanced, not top-heavy. */
	.step {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		gap: 22px;
		padding-bottom: max(16px, env(safe-area-inset-bottom));
	}

	.step-content {
		display: grid;
		gap: 18px;
	}

	.step-head {
		display: grid;
		gap: 5px;
	}

	.welcome-polaroid {
		position: relative;
		display: block;
		justify-self: center;
		width: min(38vw, 150px);
		aspect-ratio: 3 / 4;
		filter: drop-shadow(0 10px 18px color-mix(in srgb, var(--color-charcoal) 12%, transparent));
	}

	.polaroid-frame,
	.polaroid-subject {
		position: absolute;
		object-fit: contain;
	}

	.polaroid-frame {
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.polaroid-subject {
		top: 18%;
		left: 18%;
		width: 64%;
		height: 48%;
	}

	.eyebrow {
		margin: 0;
		color: var(--color-success-text);
		font-size: 0.9rem;
		font-weight: 800;
	}

	.step-head h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 2rem;
		line-height: 1.06;
	}

	.subtitle {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.98rem;
		font-weight: 500;
	}

	/* Step 1 — care path cards (both first-class). */
	.path-grid {
		display: grid;
		gap: 12px;
	}

	.path-card {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 14px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		background: var(--color-paper-2);
		padding: 16px;
		color: var(--color-charcoal);
		text-align: left;
		cursor: pointer;
		box-shadow: var(--shadow-card);
		transition:
			background 160ms ease,
			border-color 160ms ease,
			transform 160ms var(--ease-mobile);
	}

	.path-card:active {
		transform: scale(0.99);
	}

	.path-icon {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		flex: none;
		border-radius: 18px;
		background: var(--color-peach-soft);
		color: var(--color-charcoal);
	}

	.path-text {
		display: grid;
		gap: 3px;
		min-width: 0;
	}

	.path-title {
		font-size: 1.08rem;
		font-weight: 800;
	}

	.path-body {
		color: var(--color-muted);
		font-size: 0.88rem;
		font-weight: 500;
		line-height: 1.35;
	}

	.path-check {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		flex: none;
		border-radius: 50%;
		border: 1.5px solid var(--color-line);
		background: var(--color-paper);
		color: var(--color-success-text);
	}

	.path-card.active {
		border-color: color-mix(in srgb, var(--color-success-text) 32%, var(--color-line));
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.path-card.active .path-icon {
		background: color-mix(in srgb, var(--color-paper-2) 66%, var(--color-sage-soft));
		color: var(--color-success-text);
	}

	.path-card.active .path-body {
		color: color-mix(in srgb, var(--color-success-text) 82%, transparent);
	}

	.path-card.active .path-check {
		border-color: transparent;
		background: color-mix(in srgb, var(--color-success-text) 20%, var(--color-paper-2));
	}

	/* Secondary multi-cat setting — visually subordinate to the two path cards. */
	.multi-toggle {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		border: 1px dashed var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		padding: 11px 16px;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 160ms ease,
			border-color 160ms ease,
			color 160ms ease;
	}

	.multi-toggle.active {
		border-style: solid;
		border-color: color-mix(in srgb, var(--color-success-text) 24%, var(--color-line));
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.multi-toggle input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.multi-box {
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		flex: none;
		border-radius: 7px;
		border: 1.5px solid var(--color-line);
		background: var(--color-paper);
		color: var(--color-success-text);
	}

	.multi-toggle.active .multi-box {
		border-color: transparent;
		background: color-mix(in srgb, var(--color-paper-2) 78%, var(--color-sage-soft));
	}

	/* Step 2 — large profile preview. */
	.preview-box {
		display: grid;
		justify-items: center;
		gap: 10px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card-lg);
		background:
			radial-gradient(
				circle at 50% 22%,
				color-mix(in srgb, var(--color-peach-soft) 60%, transparent),
				transparent 60%
			),
			var(--color-paper-2);
		padding: 22px 20px;
		box-shadow: var(--shadow-card);
	}

	.preview-portrait {
		display: grid;
		place-items: center;
		width: 112px;
		height: 112px;
		border-radius: 32px;
		background: var(--color-peach-soft);
		overflow: hidden;
	}

	.preview-portrait img {
		width: 88px;
		height: 88px;
		object-fit: contain;
	}

	.preview-name {
		max-width: 100%;
		overflow: hidden;
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.preview-name.muted {
		color: var(--color-muted);
	}

	.preview-path {
		border-radius: var(--radius-pill);
		background: var(--color-sage-soft);
		color: var(--color-success-text);
		padding: 4px 13px;
		font-size: 0.8rem;
		font-weight: 800;
	}

	.field {
		display: grid;
		gap: 7px;
	}

	.field-label {
		color: var(--color-charcoal);
		font-size: 0.84rem;
		font-weight: 800;
	}

	.field input {
		width: 100%;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper-2);
		color: var(--color-ink);
		padding: 14px 16px;
		font: inherit;
		font-size: 0.98rem;
	}

	.field input:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-peach) 60%, transparent);
		outline-offset: 1px;
		border-color: color-mix(in srgb, var(--color-peach) 50%, var(--color-line));
	}

	/* Step 2 — avatar picker, consistent with path cards, soft selected state. */
	.avatar-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}

	.avatar-grid legend {
		float: left;
		width: 100%;
		margin-bottom: 10px;
		padding: 0;
		color: var(--color-charcoal);
		font-size: 0.84rem;
		font-weight: 800;
	}

	.avatar-choice {
		display: grid;
		justify-items: center;
		gap: 6px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper-2);
		padding: 11px 6px;
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
		border-color: color-mix(in srgb, var(--color-success-text) 26%, var(--color-line));
		color: var(--color-success-text);
	}

	.avatar-choice input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.avatar-choice:focus-within {
		outline: 2px solid color-mix(in srgb, var(--color-peach) 55%, transparent);
		outline-offset: 2px;
	}

	.avatar-choice img {
		width: 46px;
		height: 46px;
		object-fit: contain;
	}

	/* Step 3 — summary + benefits. */
	.summary-card {
		display: flex;
		align-items: center;
		gap: 16px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card-lg);
		background:
			radial-gradient(
				circle at 14% 0%,
				color-mix(in srgb, var(--color-sky-soft) 46%, transparent),
				transparent 42%
			),
			var(--color-paper-2);
		padding: 18px;
		box-shadow: var(--shadow-float);
	}

	.summary-portrait {
		display: grid;
		place-items: center;
		width: 78px;
		height: 78px;
		flex: none;
		border-radius: 24px;
		background: var(--color-peach-soft);
		overflow: hidden;
	}

	.summary-portrait img {
		width: 62px;
		height: 62px;
		object-fit: contain;
	}

	.summary-copy {
		display: grid;
		gap: 5px;
		min-width: 0;
	}

	.summary-copy strong {
		overflow: hidden;
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.summary-path {
		justify-self: start;
		border-radius: var(--radius-pill);
		background: var(--color-sage-soft);
		color: var(--color-success-text);
		padding: 3px 12px;
		font-size: 0.78rem;
		font-weight: 800;
	}

	.summary-tag {
		justify-self: start;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 700;
	}

	.benefits {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.benefits li {
		display: grid;
		justify-items: center;
		gap: 9px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card);
		background: var(--color-paper-2);
		padding: 15px 8px;
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--color-charcoal);
		text-align: center;
	}

	.benefit-icon {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 14px;
		background: var(--color-peach-soft);
		color: var(--color-charcoal);
	}

	/* Actions — sit close to content on tall screens, sticky only on short ones. */
	.actions {
		display: flex;
		gap: 12px;
	}

	.actions-stacked {
		flex-direction: column;
		gap: 12px;
	}

	.actions-row {
		display: flex;
		gap: 12px;
	}

	.helper {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 600;
		text-align: center;
	}

	.helper.error {
		color: var(--color-danger-text);
		font-weight: 700;
	}

	.btn {
		flex: 1;
		min-height: 54px;
		border-radius: var(--radius-pill);
		font-size: 1rem;
		font-weight: 700;
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
		opacity: 0.5;
		cursor: not-allowed;
		box-shadow: none;
	}

	.btn-ghost {
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
	}

	.btn-ghost:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Short viewports: don't center; keep actions reachable at the bottom. */
	@media (max-height: 660px) {
		.step {
			justify-content: flex-start;
		}

		.actions,
		.actions-stacked {
			position: sticky;
			bottom: 0;
			margin-top: auto;
			padding-top: 12px;
			padding-bottom: max(12px, env(safe-area-inset-bottom));
			background: linear-gradient(to top, var(--color-paper) 72%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.path-card,
		.multi-toggle,
		.avatar-choice,
		.btn,
		.bar {
			transition: none;
		}
	}

	@media (max-width: 360px) {
		.step-head h1 {
			font-size: 1.8rem;
		}

		.avatar-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
