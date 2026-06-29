<!-- Home dashboard: verified care upload flow for the Purrward demo. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	type TaskType = 'feeding' | 'water' | 'litter' | 'play' | 'grooming' | 'meds';
	type VerifyBody = {
		verified?: boolean;
		reason?: string;
		pointsAwarded?: number;
		error?: string;
	};

	const tasks: { id: TaskType; label: string; hint: string; icon: string }[] = [
		{ id: 'feeding', label: 'Feeding', hint: 'Bowl, meal, or snack proof', icon: 'F' },
		{ id: 'water', label: 'Water', hint: 'Fresh water or fountain refill', icon: 'W' },
		{ id: 'litter', label: 'Litter', hint: 'Clean litter box care', icon: 'L' },
		{ id: 'play', label: 'Play', hint: 'Toy, movement, or enrichment', icon: 'P' },
		{ id: 'grooming', label: 'Grooming', hint: 'Brush, wipe, or coat care', icon: 'G' },
		{ id: 'meds', label: 'Meds', hint: 'Medication routine proof', icon: 'M' }
	];

	let { data }: PageProps = $props();
	let selectedTask = $state<TaskType>('feeding');
	let selectedFile = $state('No photo chosen');
	let verifying = $state(false);
	let result = $state<VerifyBody | null>(null);
	let earnedPoints = $state(0);
	let points = $derived((data.user?.purrpoints ?? 0) + earnedPoints);

	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		selectedFile = input.files?.[0]?.name ?? 'No photo chosen';
		result = null;
	}

	async function verifyPhoto(event: SubmitEvent) {
		event.preventDefault();
		if (!data.user || verifying) return;

		verifying = true;
		result = null;

		const form = event.currentTarget as HTMLFormElement;
		const response = await fetch('/api/verify', {
			method: 'POST',
			body: new FormData(form)
		});
		const body = (await response.json()) as VerifyBody;
		result = body;
		if (response.ok && body.pointsAwarded) earnedPoints += body.pointsAwarded;
		verifying = false;
	}
</script>

<svelte:head>
	<title>Purrward</title>
	<meta
		name="description"
		content="Care-to-earn cat wellness app with photo verification and Purrpoints."
	/>
</svelte:head>

<main class="shell">
	<section class="hero">
		<div>
			<p class="eyebrow">Purrward</p>
			<h1>Care that earns rewards.</h1>
			<p class="lede">
				Log a cat-care habit, upload proof, and let server verification protect points.
			</p>
		</div>
		<div class="cat-card" aria-label="Cat avatar placeholder">
			<div class="cat-face">
				<span></span>
				<span></span>
			</div>
			<div class="cat-mouth"></div>
		</div>
	</section>

	<section class="status-card">
		<div>
			<p class="label">Today</p>
			<h2>
				{data.user
					? `Hello, ${data.user.displayName ?? 'cat parent'}`
					: 'Start secure care logging'}
			</h2>
			<p>
				{data.user
					? 'Your uploads are tied to your server session.'
					: 'Sign in before earning Purrpoints so rewards stay yours.'}
			</p>
		</div>
		<div class="points">
			<span>{points}</span>
			<small>Purrpoints</small>
		</div>
	</section>

	{#if data.user}
		<form class="verify-card" onsubmit={verifyPhoto}>
			<div class="section-head">
				<div>
					<p class="label">Photo proof</p>
					<h2>Verify one care task</h2>
				</div>
				<span class="cap">+10</span>
			</div>

			<div class="task-grid">
				{#each tasks as task (task.id)}
					<label class:selected={selectedTask === task.id}>
						<input type="radio" name="taskType" value={task.id} bind:group={selectedTask} />
						<span>{task.icon}</span>
						<strong>{task.label}</strong>
						<small>{task.hint}</small>
					</label>
				{/each}
			</div>

			<label class="upload">
				<span>Upload proof</span>
				<input
					name="photo"
					type="file"
					accept="image/jpeg,image/png,image/webp"
					required
					onchange={handleFileChange}
				/>
				<small>{selectedFile}</small>
			</label>

			<button type="submit" disabled={verifying}>
				{verifying ? 'Checking photo...' : 'Verify care'}
			</button>

			{#if result}
				<div class:ok={result.verified} class:warn={!result.verified} class="result">
					<strong>{result.verified ? 'Verified' : 'Needs another photo'}</strong>
					<p>{result.reason ?? result.error ?? 'Try again with a clearer care photo.'}</p>
					{#if result.pointsAwarded}
						<small>+{result.pointsAwarded} Purrpoints added</small>
					{/if}
				</div>
			{/if}
		</form>
	{:else}
		<section class="verify-card signed-out">
			<p class="label">Secure session required</p>
			<h2>Sign in to verify care</h2>
			<p>Points are awarded only from a server-owned account session.</p>
			<a class="button-link" href={resolve('/auth/google')}>Continue with Google</a>
		</section>
	{/if}

	<nav class="bottom-nav" aria-label="Main navigation">
		<a aria-current="page" href={resolve('/')}>Home</a>
		<a href={resolve('/rewards')}>Rewards</a>
		<a href={resolve('/vet')}>Vet</a>
		<a href={resolve('/dev')}>Dev</a>
	</nav>
</main>

<style>
	.shell {
		min-height: 100vh;
		width: min(100%, 480px);
		margin: 0 auto;
		padding: 20px 18px 104px;
		color: var(--color-ink);
	}

	.hero,
	.status-card,
	.verify-card {
		border: 1px solid var(--color-line);
		box-shadow: var(--shadow-card);
	}

	.hero {
		display: grid;
		grid-template-columns: 1fr 116px;
		gap: 18px;
		align-items: center;
		min-height: 228px;
		padding: 28px;
		border-radius: var(--radius-card-lg);
		background:
			radial-gradient(
				circle at 84% 22%,
				color-mix(in srgb, var(--color-peach) 28%, transparent),
				transparent 34%
			),
			radial-gradient(
				circle at 18% 82%,
				color-mix(in srgb, var(--color-sky) 24%, transparent),
				transparent 30%
			),
			var(--color-paper-2);
	}

	.eyebrow,
	.label,
	.cap {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		margin-top: 8px;
		max-width: 10ch;
		font-size: clamp(2.2rem, 12vw, 3.9rem);
		line-height: 0.92;
	}

	h2 {
		margin-top: 6px;
		font-size: 1.35rem;
		line-height: 1.15;
	}

	.lede,
	.status-card p,
	.verify-card p {
		margin-top: 10px;
		color: var(--color-muted);
		line-height: 1.5;
	}

	.cat-card {
		position: relative;
		aspect-ratio: 1;
		border-radius: 38px 38px 42px 42px;
		background:
			linear-gradient(
				140deg,
				color-mix(in srgb, var(--color-butter) 58%, white),
				var(--color-peach-soft)
			),
			var(--color-paper-3);
		border: 2px solid color-mix(in srgb, var(--color-charcoal) 72%, transparent);
	}

	.cat-card::before,
	.cat-card::after {
		content: '';
		position: absolute;
		top: -16px;
		width: 38px;
		height: 38px;
		background: var(--color-peach-soft);
		border: 2px solid color-mix(in srgb, var(--color-charcoal) 72%, transparent);
		transform: rotate(45deg);
	}

	.cat-card::before {
		left: 18px;
	}

	.cat-card::after {
		right: 18px;
	}

	.cat-face {
		position: absolute;
		inset: 42px 24px auto;
		display: flex;
		justify-content: space-between;
	}

	.cat-face span {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		background: var(--color-charcoal);
	}

	.cat-mouth {
		position: absolute;
		left: 50%;
		top: 70px;
		width: 26px;
		height: 12px;
		border-bottom: 3px solid var(--color-charcoal);
		border-radius: 0 0 999px 999px;
		transform: translateX(-50%);
	}

	.status-card,
	.verify-card {
		margin-top: 18px;
		padding: 22px;
		border-radius: var(--radius-card);
		background: var(--color-paper-2);
	}

	.status-card {
		display: flex;
		gap: 16px;
		align-items: center;
		justify-content: space-between;
	}

	.points {
		display: grid;
		min-width: 98px;
		place-items: center;
		padding: 16px 12px;
		border-radius: 24px;
		background: var(--color-butter);
		color: var(--color-charcoal);
	}

	.points span {
		font-size: 1.8rem;
		font-weight: 900;
		line-height: 1;
	}

	.points small {
		font-weight: 800;
	}

	.section-head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 16px;
	}

	.cap {
		display: inline-grid;
		min-width: 48px;
		place-items: center;
		padding: 10px 12px;
		border-radius: var(--radius-pill);
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.task-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
		margin-top: 20px;
	}

	.task-grid label {
		display: grid;
		gap: 7px;
		min-height: 126px;
		padding: 14px;
		border: 1px solid var(--color-line);
		border-radius: 22px;
		background: var(--color-paper);
		cursor: pointer;
	}

	.task-grid label.selected {
		border-color: var(--color-sage);
		background: var(--color-sage-soft);
	}

	.task-grid input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.task-grid span {
		display: grid;
		width: 34px;
		height: 34px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		font-weight: 900;
	}

	.task-grid strong,
	.upload span,
	button,
	.button-link,
	.result strong {
		font-weight: 850;
	}

	.task-grid small,
	.upload small,
	.result small {
		color: var(--color-muted);
		font-size: 0.82rem;
		line-height: 1.35;
	}

	.upload {
		display: grid;
		gap: 8px;
		margin-top: 18px;
		padding: 16px;
		border: 1px dashed var(--color-muted);
		border-radius: 24px;
		background: var(--color-paper);
	}

	.upload input {
		max-width: 100%;
	}

	button,
	.button-link {
		display: grid;
		width: 100%;
		min-height: 54px;
		margin-top: 16px;
		place-items: center;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		text-decoration: none;
		cursor: pointer;
	}

	button:disabled {
		background: var(--color-muted);
		cursor: wait;
	}

	.result {
		margin-top: 16px;
		padding: 16px;
		border-radius: 22px;
	}

	.result.ok {
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.result.warn {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.result p,
	.result small {
		color: inherit;
	}

	.signed-out {
		text-align: left;
	}

	.bottom-nav {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
		width: 100%;
		margin: 18px auto 0;
		padding: 8px;
		border-radius: 30px;
		background: var(--color-charcoal);
		box-shadow: var(--shadow-float);
	}

	.bottom-nav a {
		display: grid;
		min-height: 42px;
		place-items: center;
		border-radius: var(--radius-pill);
		color: var(--color-paper);
		font-size: 0.85rem;
		font-weight: 800;
		text-decoration: none;
	}

	.bottom-nav a[aria-current='page'] {
		background: var(--color-paper-2);
		color: var(--color-charcoal);
	}

	@media (max-width: 390px) {
		.hero {
			grid-template-columns: 1fr;
		}

		.cat-card {
			width: 118px;
			justify-self: end;
		}

		.task-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
