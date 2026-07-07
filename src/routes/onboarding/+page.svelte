<!-- First-run onboarding: a warm 3-step flow to pick a care path, build a cat profile, and start caring. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Cat from '@lucide/svelte/icons/cat';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import Check from '@lucide/svelte/icons/check';
	import CalendarCheck from '@lucide/svelte/icons/calendar-check';
	import Camera from '@lucide/svelte/icons/camera';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Star from '@lucide/svelte/icons/star';
	import logo from '$lib/assets/logo/logo.svg';
	import { getCatAvatar } from '$lib/cat-avatars';
	import type { PageProps } from './$types';

	type AvatarMethod = 'scan' | 'manual';
	type ScanStatus = 'idle' | 'ready' | 'loading' | 'matched' | 'no-match' | 'error';
	type AvatarScanMatch = {
		matched: true;
		avatarId: string;
		confidence: 'good' | 'close';
		reason: string;
	};
	type AvatarScanPayload = AvatarScanMatch | { matched: false; reason: string };

	let { data, form }: PageProps = $props();

	let step = $state(1);
	let mode = $state<'owned' | 'community'>('owned');
	let name = $state('');
	let selectedAvatar = $state<string>('orange');
	let avatarMethod = $state<AvatarMethod>('manual');
	let scanFile = $state<File | null>(null);
	let scanPreviewUrl = $state<string | null>(null);
	let scanStatus = $state<ScanStatus>('idle');
	let scanMatch = $state<AvatarScanMatch | null>(null);
	let scanMessage = $state('');
	let cameraInput = $state<HTMLInputElement>();
	let uploadInput = $state<HTMLInputElement>();
	let multipleCats = $state(false);
	let submitting = $state(false);

	const isCommunity = $derived(mode === 'community');
	const action = $derived(isCommunity ? '?/community' : '?/owned');
	const stepLabel = $derived(`Step ${step} of 3`);

	const profileTitle = $derived('Name and look');
	const profileSubtitle = $derived('Cat profile.');
	const nameLabel = $derived('Cat name');
	const namePlaceholder = $derived('Mochi');

	// Preview + summary state.
	const trimmedName = $derived(name.trim());
	const placeholderName = $derived(isCommunity ? 'Care group' : 'Your cat');
	const previewName = $derived(trimmedName || placeholderName);
	const careTypeLabel = $derived(isCommunity ? 'Community cats' : 'My cat');
	const previewAvatar = $derived(getCatAvatar(selectedAvatar));
	const canContinue = $derived(trimmedName.length > 0);
	const suggestedAvatar = $derived(scanMatch ? getCatAvatar(scanMatch.avatarId) : null);
	const canSubmitScan = $derived(scanFile !== null && scanStatus !== 'loading');

	// Step 3 benefit labels shift with the care path (routine vs logs, check vs proof).
	const routineLabel = $derived(isCommunity ? 'Care logs' : 'Daily routine');
	const photoLabel = $derived(isCommunity ? 'Photo proof' : 'Photo check');

	$effect(() => {
		const url = scanPreviewUrl;
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	});

	function next() {
		step = Math.min(3, step + 1);
	}

	function previous() {
		step = Math.max(1, step - 1);
	}

	function chooseAvatarMethod(method: AvatarMethod) {
		avatarMethod = method;
		if (method === 'manual') {
			scanStatus = 'idle';
			scanMessage = '';
		}
	}

	function resetScan() {
		scanFile = null;
		scanPreviewUrl = null;
		scanStatus = 'idle';
		scanMatch = null;
		scanMessage = '';
	}

	function handleScanFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		input.value = '';
		if (!file) return;
		scanFile = file;
		scanPreviewUrl = URL.createObjectURL(file);
		scanStatus = 'ready';
		scanMatch = null;
		scanMessage = '';
		avatarMethod = 'scan';
	}

	function openCamera() {
		cameraInput?.click();
	}

	function openUpload() {
		uploadInput?.click();
	}

	function readError(payload: unknown): string {
		if (!payload || typeof payload !== 'object') return '';
		const error = (payload as { error?: unknown }).error;
		return typeof error === 'string' ? error : '';
	}

	function readAvatarMatchPayload(payload: unknown): AvatarScanPayload | null {
		if (!payload || typeof payload !== 'object') return null;
		const value = payload as {
			matched?: unknown;
			avatarId?: unknown;
			confidence?: unknown;
			reason?: unknown;
		};
		const reason = typeof value.reason === 'string' ? value.reason : '';
		if (value.matched === false) return { matched: false, reason };
		if (value.matched !== true || typeof value.avatarId !== 'string') return null;
		if (!data.avatars.some((avatar) => avatar.id === value.avatarId)) return null;
		const confidence = value.confidence === 'good' ? 'good' : 'close';
		return { matched: true, avatarId: value.avatarId, confidence, reason };
	}

	async function submitScan() {
		if (!scanFile) {
			scanStatus = 'error';
			scanMessage = 'Choose a photo first.';
			return;
		}

		scanStatus = 'loading';
		scanMatch = null;
		scanMessage = 'Finding match…';

		const body = new FormData();
		body.set('image', scanFile);
		try {
			const response = await fetch(resolve('/api/onboarding/avatar-match'), {
				method: 'POST',
				body
			});
			const payload: unknown = await response.json().catch(() => null);
			if (!response.ok) {
				const error = readError(payload);
				scanStatus = 'error';
				scanMessage = /too large|maximum 5mb/i.test(error)
					? 'Image too large. Pick manually.'
					: "Couldn't scan. Pick manually.";
				return;
			}

			const result = readAvatarMatchPayload(payload);
			if (!result) throw new Error('Bad avatar match response.');
			if (result.matched) {
				scanMatch = result;
				scanStatus = 'matched';
				scanMessage = result.reason;
			} else {
				scanStatus = 'no-match';
				scanMessage = 'Pick manually.';
			}
		} catch {
			scanStatus = 'error';
			scanMessage = "Couldn't scan. Pick manually.";
		}
	}

	function useSuggestedAvatar() {
		if (!scanMatch) return;
		selectedAvatar = scanMatch.avatarId;
		chooseAvatarMethod('manual');
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
					<div class="step-head">
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
			<section class="step profile-step" aria-label={stepLabel}>
				<div class="step-content profile-content">
					<div class="step-head profile-head">
						<h1>{profileTitle}</h1>
						<p class="subtitle">{profileSubtitle}</p>
					</div>

					<div class="preview-box">
						<span class="preview-portrait" aria-hidden="true">
							{#if previewAvatar}<img src={previewAvatar.src} alt="" />{/if}
						</span>
						<div class="preview-copy">
							<span class="preview-kicker">Preview</span>
							<span class="preview-name">{previewName}</span>
							{#if previewAvatar}<span class="preview-avatar-name">{previewAvatar.label}</span>{/if}
						</div>
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

					<section class="avatar-method" aria-labelledby="avatar-method-title">
						<div class="avatar-method-head">
							<h2 id="avatar-method-title">Avatar</h2>
						</div>

						<div class="method-segment" role="radiogroup" aria-label="Avatar method">
							<button
								type="button"
								class:active={avatarMethod === 'scan'}
								role="radio"
								aria-checked={avatarMethod === 'scan'}
								onclick={() => chooseAvatarMethod('scan')}
							>
								Scan
							</button>

							<button
								type="button"
								class:active={avatarMethod === 'manual'}
								role="radio"
								aria-checked={avatarMethod === 'manual'}
								onclick={() => chooseAvatarMethod('manual')}
							>
								Manual
							</button>
						</div>
					</section>

					{#if avatarMethod === 'scan'}
						<section class="scan-panel" aria-label="Scan cat">
							<div class="panel-head">
								<h3>Find match</h3>
								<p>Use a cat photo.</p>
							</div>

							<input
								bind:this={cameraInput}
								class="file-input"
								type="file"
								accept="image/jpeg,image/png,image/webp"
								capture="environment"
								onchange={handleScanFile}
							/>
							<input
								bind:this={uploadInput}
								class="file-input"
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onchange={handleScanFile}
							/>

							<div class="scan-actions">
								<button class="scan-button" type="button" onclick={openCamera}>
									<Camera size={18} strokeWidth={2.2} aria-hidden="true" />
									Open camera
								</button>
								<button class="scan-button" type="button" onclick={openUpload}>Upload</button>
							</div>

							{#if scanPreviewUrl}
								<div class="scan-preview">
									<img src={scanPreviewUrl} alt="Selected cat preview" />
								</div>
							{/if}

							<button
								class="btn btn-primary scan-submit"
								type="button"
								onclick={submitScan}
								disabled={!canSubmitScan}
							>
								{scanStatus === 'loading' ? 'Finding match…' : 'Find match'}
							</button>

							{#if scanStatus === 'matched' && scanMatch && suggestedAvatar}
								<div class="match-card">
									<div class="match-head">
										<strong>Best match</strong>
									</div>
									<span class="match-avatar">
										<img src={suggestedAvatar.src} alt={suggestedAvatar.label} />
									</span>
									<div class="match-actions">
										<button class="btn btn-primary" type="button" onclick={useSuggestedAvatar}>
											Use
										</button>
										<button class="btn btn-ghost" type="button" onclick={resetScan}>
											<RotateCcw size={15} strokeWidth={2.4} aria-hidden="true" />
											Try again
										</button>
										<button
											class="btn btn-ghost"
											type="button"
											onclick={() => chooseAvatarMethod('manual')}
										>
											Manual
										</button>
									</div>
								</div>
							{:else if scanStatus === 'no-match'}
								<div class="scan-state">
									<strong>No match</strong>
									<span>{scanMessage}</span>
									<button
										class="btn btn-ghost"
										type="button"
										onclick={() => chooseAvatarMethod('manual')}
									>
										Manual
									</button>
								</div>
							{:else if scanStatus === 'error'}
								<div class="scan-state error">
									<strong
										>{scanMessage.startsWith('Image') ? 'Image too large' : 'Couldn’t scan'}</strong
									>
									<span>Pick manually.</span>
									<button
										class="btn btn-ghost"
										type="button"
										onclick={() => chooseAvatarMethod('manual')}
									>
										Manual
									</button>
								</div>
							{/if}
						</section>
					{:else}
						<fieldset class="avatar-picker">
							<legend>Pick avatar</legend>
							<div class="avatar-grid">
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
							</div>
						</fieldset>
					{/if}
				</div>

				<div class="actions actions-stacked">
					{#if !canContinue}
						<p class="helper">Add a name to continue.</p>
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

	.step {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		gap: 18px;
		padding-bottom: max(20px, env(safe-area-inset-bottom));
	}

	.step-content {
		display: grid;
		gap: 14px;
		padding-bottom: 4px;
	}

	.step-head {
		display: grid;
		gap: 5px;
	}

	.profile-step {
		justify-content: flex-start;
		gap: 12px;
		padding-bottom: max(28px, calc(env(safe-area-inset-bottom) + 18px));
	}

	.profile-content {
		gap: 10px;
	}

	.profile-head {
		gap: 2px;
	}

	.step-head h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 2rem;
		line-height: 1.06;
	}

	.profile-head h1 {
		font-size: 1.5rem;
		line-height: 1.12;
	}

	.subtitle {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.98rem;
		font-weight: 500;
	}

	.profile-head .subtitle {
		font-size: 0.84rem;
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

	.preview-box {
		display: flex;
		align-items: center;
		gap: 10px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper-2);
		padding: 9px 10px;
	}

	.preview-portrait {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		flex: none;
		border-radius: 18px;
		background: var(--color-peach-soft);
		overflow: hidden;
	}

	.preview-portrait img {
		width: 46px;
		height: 46px;
		object-fit: contain;
	}

	.preview-copy {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.preview-kicker,
	.preview-avatar-name {
		color: var(--color-muted);
		font-size: 0.74rem;
		font-weight: 800;
	}

	.preview-name {
		max-width: 100%;
		overflow: hidden;
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: 0.98rem;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		padding: 12px 14px;
		font: inherit;
		font-size: 0.98rem;
	}

	.field input:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-peach) 60%, transparent);
		outline-offset: 1px;
		border-color: color-mix(in srgb, var(--color-peach) 50%, var(--color-line));
	}

	.avatar-method {
		display: grid;
		gap: 8px;
	}

	.avatar-method-head h2 {
		margin: 0;
		color: var(--color-charcoal);
		font-size: 0.84rem;
		font-weight: 800;
	}

	.method-segment {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		padding: 4px;
	}

	.method-segment button {
		min-height: 36px;
		border: 0;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--color-muted);
		font-size: 0.9rem;
		font-weight: 850;
		cursor: pointer;
	}

	.method-segment button.active {
		background: var(--color-paper-2);
		color: var(--color-ink);
		box-shadow: 0 6px 14px color-mix(in srgb, var(--color-charcoal) 8%, transparent);
	}

	.scan-panel {
		display: grid;
		gap: 8px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper-2);
		padding: 10px;
	}

	.panel-head {
		display: grid;
		gap: 2px;
	}

	.panel-head h3 {
		margin: 0;
		color: var(--color-ink);
		font-size: 0.98rem;
	}

	.panel-head p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 650;
	}

	.file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}

	.scan-actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	.scan-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 42px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		font-size: 0.86rem;
		font-weight: 800;
		cursor: pointer;
	}

	.scan-preview {
		display: grid;
		place-items: center;
		min-height: 86px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper-3);
		overflow: hidden;
	}

	.scan-preview img {
		width: 100%;
		max-height: 112px;
		object-fit: contain;
	}

	.scan-submit {
		width: 100%;
	}

	.match-card {
		display: grid;
		justify-items: center;
		gap: 8px;
		border: 1px solid color-mix(in srgb, var(--color-success-text) 26%, var(--color-line));
		border-radius: 18px;
		background: var(--color-sage-soft);
		padding: 10px;
	}

	.match-head {
		display: grid;
		justify-items: center;
	}

	.match-head strong {
		color: var(--color-success-text);
		font-size: 1rem;
	}

	.match-avatar {
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		border-radius: 18px;
		background: var(--color-paper-2);
		overflow: hidden;
	}

	.match-avatar img {
		width: 52px;
		height: 52px;
		object-fit: contain;
	}

	.match-actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
		width: 100%;
	}

	.match-actions .btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 42px;
		font-size: 0.84rem;
	}

	.match-actions .btn-primary {
		grid-column: 1 / -1;
	}

	.scan-state {
		display: grid;
		justify-items: center;
		gap: 9px;
		border: 1px dashed var(--color-line);
		border-radius: 20px;
		background: var(--color-paper-3);
		padding: 14px;
		text-align: center;
	}

	.scan-state strong {
		color: var(--color-ink);
		font-size: 1rem;
	}

	.scan-state span {
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 700;
	}

	.scan-state.error {
		border-color: color-mix(in srgb, var(--color-danger-text) 24%, var(--color-line));
		background: var(--color-danger-bg);
	}

	.scan-state.error strong {
		color: var(--color-danger-text);
	}

	.scan-state button {
		width: 100%;
		min-height: 44px;
	}

	/* Step 2 — avatar picker, consistent with path cards, soft selected state. */
	.avatar-picker {
		display: grid;
		gap: 9px;
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}

	.avatar-picker legend {
		padding: 0;
		color: var(--color-charcoal);
		font-size: 0.84rem;
		font-weight: 800;
	}

	.avatar-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 9px;
		margin-top: 10px;
		min-width: 0;
	}

	.avatar-choice {
		display: grid;
		justify-items: center;
		gap: 5px;
		border: 1px solid var(--color-line);
		border-radius: 16px;
		background: var(--color-paper-2);
		min-height: 82px;
		padding: 9px 5px;
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
		width: 44px;
		height: 44px;
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
		gap: 8px;
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
		min-height: 50px;
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
			padding-top: 10px;
			padding-bottom: max(14px, env(safe-area-inset-bottom));
			background: linear-gradient(to top, var(--color-paper) 78%, transparent);
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
