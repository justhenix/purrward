<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto, invalidateAll } from '$app/navigation';
	import { onDestroy, onMount, tick } from 'svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Camera from '@lucide/svelte/icons/camera';
	import Check from '@lucide/svelte/icons/check';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Send from '@lucide/svelte/icons/send';
	import Upload from '@lucide/svelte/icons/upload';
	import { habitSetFor, type TaskType } from '$lib/tasks';
	import type { PageProps } from './$types';

	type VerifyBody = {
		verified?: boolean;
		reason?: string;
		pointsAwarded?: number;
		error?: string;
	};

	type ProofTask = {
		id: TaskType;
		title: string;
		need: string;
		success: string;
		points: number;
	};

	const TASKS: ProofTask[] = [
		{
			id: 'feeding',
			title: 'Breakfast',
			need: 'Breakfast time',
			success: 'Breakfast proof submitted',
			points: 10
		},
		{
			id: 'water',
			title: 'Water',
			need: 'Fresh water time',
			success: 'Water proof submitted',
			points: 10
		},
		{
			id: 'litter',
			title: 'Litter',
			need: 'Clean litter time',
			success: 'Litter proof submitted',
			points: 10
		},
		{
			id: 'play',
			title: 'Play',
			need: 'Play time',
			success: 'Play proof submitted',
			points: 10
		},
		{
			id: 'grooming',
			title: 'Grooming',
			need: 'Brush time',
			success: 'Grooming proof submitted',
			points: 10
		},
		{
			id: 'meds',
			title: 'Medicine',
			need: 'Medicine time',
			success: 'Medicine proof submitted',
			points: 10
		},
		{
			id: 'street_feeding',
			title: 'Street Feeding',
			need: 'Street feeding time',
			success: 'Street feeding proof submitted',
			points: 10
		},
		{
			id: 'shelter_care',
			title: 'Shelter Care',
			need: 'Shelter care time',
			success: 'Shelter care proof submitted',
			points: 10
		}
	];

	let { data }: PageProps = $props();

	let catName = $derived(data.activeCat?.name ?? 'your cat');
	let habitSet = $derived(habitSetFor(data.activeCat?.careMode ?? 'owned'));
	let tasks = $derived(TASKS.filter((task) => habitSet.includes(task.id)));
	let cameraOpen = $state(false);
	let cameraReady = $state(false);
	let cameraError = $state('');
	let submitting = $state(false);
	let submitted = $state(false);
	let result = $state<VerifyBody | null>(null);
	let capturedPhoto = $state<Blob | null>(null);
	let capturedUrl = $state('');
	let stream = $state<MediaStream | null>(null);
	let videoElement = $state<HTMLVideoElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	let sandboxMode = $derived(data.preferences.sandboxMode);
	let balance = $derived(sandboxMode ? 999999 : (data.user?.purrpoints ?? 0));
	let completed = $derived(new Set(data.completedTasks));
	let nextTask = $derived(tasks.find((task) => !completed.has(task.id)) ?? tasks[0]);
	let active = $derived(
		tasks.find((task) => task.id === (data.selectedTask ?? nextTask.id)) ?? nextTask
	);
	let statusText = $derived.by(() => {
		if (submitting)
			return data.preferences.sandboxMode
				? 'Accepting sandbox proof...'
				: `Checking ${catName}'s proof...`;
		if (result?.verified)
			return `${active.success}. +${result.pointsAwarded ?? active.points} pts.`;
		if (result?.reason) return result.reason;
		if (result?.error) return result.error;
		if (capturedPhoto) return 'Photo ready to submit';
		return 'No photo captured yet';
	});

	function revokeCapturedUrl() {
		if (capturedUrl) URL.revokeObjectURL(capturedUrl);
		capturedUrl = '';
	}

	function stopCamera() {
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
		cameraReady = false;
	}

	async function openCamera() {
		if (!data.user) {
			await goto(resolve('/auth/login'));
			return;
		}
		if (cameraOpen || submitting) return;
		if (!navigator.mediaDevices?.getUserMedia) {
			result = { error: 'Camera access is required to earn Purrpoints.' };
			return;
		}

		cameraOpen = true;
		cameraError = '';
		result = null;
		revokeCapturedUrl();
		capturedPhoto = null;
		stopCamera();
		await tick();

		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: 'environment' } },
				audio: false
			});
			if (!videoElement) {
				mediaStream.getTracks().forEach((track) => track.stop());
				cameraError = 'Camera preview unavailable. Close and try again.';
				return;
			}
			stream = mediaStream;
			videoElement.srcObject = mediaStream;
			await videoElement.play();
			cameraReady = videoElement.videoWidth > 0;
		} catch {
			cameraOpen = false;
			stopCamera();
			result = { error: 'Camera access is required to earn Purrpoints.' };
		}
	}

	function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
		const canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const context = canvas.getContext('2d');
		if (!context) return Promise.resolve(null);
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		return new Promise((resolveBlob) => canvas.toBlob(resolveBlob, 'image/jpeg', 0.88));
	}

	async function takePhoto() {
		if (!videoElement || !stream || submitting) return;
		if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
			cameraError = 'Camera is still waking up.';
			return;
		}

		const photo = await captureFrame(videoElement);
		if (!photo) {
			cameraError = 'Could not capture photo.';
			return;
		}

		revokeCapturedUrl();
		capturedPhoto = photo;
		capturedUrl = URL.createObjectURL(photo);
		result = null;
		stopCamera();
		cameraOpen = false;
	}

	async function retakePhoto() {
		revokeCapturedUrl();
		capturedPhoto = null;
		submitted = false;
		result = null;
		await openCamera();
	}

	function openFilePicker() {
		if (submitting || submitted) return;
		fileInput?.click();
	}

	// Upload fallback: feeds the same proof state as the camera and submits to /api/verify.
	function onFileSelected(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/webp') {
			result = { error: 'Use a JPEG, PNG, or WebP image.' };
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			result = { error: 'Image too large. Maximum 5MB.' };
			return;
		}

		stopCamera();
		cameraOpen = false;
		cameraError = '';
		revokeCapturedUrl();
		capturedPhoto = file;
		capturedUrl = URL.createObjectURL(file);
		result = null;
		submitted = false;
	}

	async function submitProof() {
		if (!capturedPhoto || !data.user || submitting || submitted) return;

		submitting = true;
		result = null;

		const body = new FormData();
		body.set('taskType', active.id);
		body.set('photo', capturedPhoto, `${active.id}-proof.jpg`);

		try {
			const response = await fetch('/api/verify', { method: 'POST', body });
			const json = (await response.json()) as VerifyBody;
			result = json;
			if (response.ok && json.verified) {
				submitted = true;
				await invalidateAll();
			}
		} catch {
			result = { error: 'Could not reach verification. Try again.' };
		} finally {
			submitting = false;
		}
	}

	onDestroy(() => {
		stopCamera();
		revokeCapturedUrl();
	});

	onMount(() => {
		void openCamera();
	});
</script>

<!-- Focused care proof camera capture workflow. -->

<svelte:head>
	<title>Purrward | Care Proof</title>
	<meta name="description" content="Take a live camera proof photo for today's cat care." />
</svelte:head>

<div class="proof-page">
	<header class="proof-top">
		<a class="back-button" href={resolve('/care')} aria-label="Back to Care">
			<ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" />
		</a>
		<div>
			<p>{active.need}</p>
			<h1>Care Proof</h1>
			<span>
				{data.preferences.sandboxMode
					? 'Sandbox proof auto-passes for +1000 test pts.'
					: `Capture a photo of ${catName} or upload one as proof.`}
			</span>
		</div>
	</header>

	<main class="proof-flow" aria-label="Care proof camera">
		<section class="preview-wrap" aria-label="Camera preview">
			{#if capturedUrl}
				<img class="captured-preview" src={capturedUrl} alt="Captured care proof" />
			{:else if cameraOpen}
				<video
					bind:this={videoElement}
					class="camera-preview"
					autoplay
					playsinline
					muted
					onloadedmetadata={() => (cameraReady = true)}
					aria-label="Live camera preview"
				></video>
			{:else}
				<div class="empty-preview">
					<Camera size={34} strokeWidth={1.9} aria-hidden="true" />
					<p>No camera preview. You can upload a photo instead.</p>
					<button class="empty-upload" type="button" onclick={openFilePicker}>
						<Upload size={16} strokeWidth={2.3} aria-hidden="true" />
						Upload photo
					</button>
				</div>
			{/if}
		</section>

		{#if cameraError}
			<p class="status warn" aria-live="polite">{cameraError}</p>
		{:else}
			<p class={['status', result?.verified && 'ok', result?.error && 'warn']} aria-live="polite">
				{statusText}
			</p>
		{/if}

		<input
			bind:this={fileInput}
			class="file-input"
			type="file"
			accept="image/jpeg,image/png,image/webp"
			tabindex="-1"
			aria-hidden="true"
			onchange={onFileSelected}
		/>

		{#if submitted && result?.verified}
			<section class="success-card" aria-label="Proof verified">
				<span class="success-badge" aria-hidden="true">
					<Check size={26} strokeWidth={3} />
				</span>
				<h2>Proof verified</h2>
				<p class="success-points">+{result.pointsAwarded ?? active.points} Purrpoints</p>
				<p class="success-balance">
					{sandboxMode ? 'Sandbox balance' : 'Balance'}: {balance} pts
				</p>
				<div class="success-actions">
					<a class="success-primary" href={resolve('/rewards')}>See rewards</a>
					<a class="success-secondary" href={resolve('/')}>Next care task</a>
				</div>
			</section>
		{:else}
			<section class="proof-actions" aria-label="Photo capture actions">
				<button
					class="primary-action"
					type="button"
					disabled={!cameraReady || submitting}
					onclick={takePhoto}
				>
					<Camera size={18} strokeWidth={2.3} aria-hidden="true" />
					Take photo
				</button>
				<button
					class="secondary-action"
					type="button"
					disabled={submitting}
					onclick={openFilePicker}
				>
					<Upload size={17} strokeWidth={2.3} aria-hidden="true" />
					Upload
				</button>
				<button
					class="secondary-action"
					type="button"
					disabled={!capturedPhoto || submitting}
					onclick={retakePhoto}
				>
					<RotateCcw size={17} strokeWidth={2.3} aria-hidden="true" />
					Retake
				</button>
				<button
					class="submit-action"
					type="button"
					disabled={!capturedPhoto || submitting}
					onclick={submitProof}
					aria-busy={submitting}
				>
					{#if submitting}
						<span class="spin" aria-hidden="true">
							<LoaderCircle size={17} strokeWidth={2.3} />
						</span>
						Checking...
					{:else}
						<Send size={17} strokeWidth={2.3} aria-hidden="true" />
						Submit proof
					{/if}
				</button>
			</section>
		{/if}
	</main>
</div>

<style>
	.proof-page {
		display: grid;
		min-height: 100dvh;
		align-content: start;
		gap: 18px;
		padding-bottom: calc(112px + env(safe-area-inset-bottom) + 24px);
	}

	.proof-top {
		display: grid;
		grid-template-columns: 42px 1fr;
		gap: 12px;
		align-items: start;
	}

	.back-button {
		display: grid;
		width: 42px;
		height: 42px;
		place-items: center;
		border: 1px solid var(--color-line);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		box-shadow: 0 8px 22px color-mix(in srgb, var(--color-charcoal) 8%, transparent);
	}

	.proof-top p,
	.proof-top span {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.84rem;
		font-weight: 750;
		line-height: 1.35;
	}

	.proof-top h1 {
		margin: 2px 0 4px;
		color: var(--color-ink);
		font-size: 1.72rem;
		line-height: 1.04;
	}

	.proof-flow {
		display: grid;
		gap: 14px;
	}

	.preview-wrap {
		display: grid;
		min-height: min(72vw, 340px);
		overflow: hidden;
		place-items: center;
		border: 1px solid var(--color-line);
		border-radius: 32px;
		background: var(--color-paper-2);
		box-shadow: var(--shadow-card);
	}

	.camera-preview,
	.captured-preview {
		width: 100%;
		aspect-ratio: 3 / 4;
		max-height: 440px;
		object-fit: cover;
	}

	.empty-preview {
		display: grid;
		gap: 12px;
		justify-items: center;
		color: var(--color-muted);
		padding: 42px 24px;
		text-align: center;
	}

	.empty-preview p {
		margin: 0;
		font-size: 0.96rem;
		font-weight: 800;
	}

	.status {
		margin: 0;
		border-radius: 20px;
		background: var(--color-paper-3);
		color: var(--color-charcoal);
		padding: 12px 14px;
		font-size: 0.88rem;
		font-weight: 800;
		line-height: 1.35;
	}

	.status.ok {
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.status.warn {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.empty-upload {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		padding: 10px 16px;
		font-size: 0.86rem;
		font-weight: 800;
		cursor: pointer;
	}

	.proof-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.primary-action,
	.submit-action {
		grid-column: 1 / -1;
	}

	.success-card {
		display: grid;
		justify-items: center;
		gap: 8px;
		border: 1px solid var(--color-line);
		border-radius: 28px;
		background:
			radial-gradient(
				circle at 50% 0%,
				color-mix(in srgb, var(--color-sage-soft) 74%, transparent),
				transparent 60%
			),
			var(--color-paper-2);
		padding: 26px 20px;
		text-align: center;
		box-shadow: var(--shadow-card);
	}

	.success-badge {
		display: grid;
		width: 56px;
		height: 56px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.success-card h2 {
		margin: 4px 0 0;
		color: var(--color-ink);
		font-size: 1.4rem;
	}

	.success-points {
		margin: 0;
		color: var(--color-success-text);
		font-size: 1.12rem;
		font-weight: 900;
	}

	.success-balance {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 750;
	}

	.success-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		width: 100%;
		margin-top: 8px;
	}

	.success-primary,
	.success-secondary {
		display: inline-flex;
		min-height: 48px;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-pill);
		font-size: 0.9rem;
		font-weight: 900;
		text-decoration: none;
	}

	.success-primary {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 15%, transparent);
	}

	.success-secondary {
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
	}

	.proof-actions button {
		display: inline-flex;
		min-height: 48px;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 0;
		border-radius: var(--radius-pill);
		padding: 12px 14px;
		font-size: 0.9rem;
		font-weight: 900;
		text-decoration: none;
		cursor: pointer;
	}

	.primary-action,
	.submit-action {
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 15%, transparent);
	}

	.secondary-action {
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
	}

	.proof-actions button:disabled {
		background: var(--color-paper-3);
		color: var(--color-muted);
		box-shadow: none;
		cursor: not-allowed;
	}

	.spin {
		display: inline-flex;
		animation: spin 850ms linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 360px) {
		.proof-actions {
			grid-template-columns: 1fr;
		}
	}
</style>
