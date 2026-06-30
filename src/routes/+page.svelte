<script lang="ts">
	import { resolve } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import Camera from '@lucide/svelte/icons/camera';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Star from '@lucide/svelte/icons/star';
	import type { TaskType } from '$lib/server/security';
	import type { PageProps } from './$types';

	type VerifyBody = {
		verified?: boolean;
		reason?: string;
		pointsAwarded?: number;
		error?: string;
	};
	type TaskMeta = {
		id: TaskType;
		chip: string;
		need: string;
		action: string;
		tone: 'peach' | 'sky' | 'lavender' | 'butter' | 'sage';
	};

	// Real-cat-first copy: every line points at the user's actual cat, not an avatar.
	const TASKS: TaskMeta[] = [
		{
			id: 'feeding',
			chip: 'Feed',
			need: 'Mochi hasn’t eaten today',
			action: 'I fed Mochi — add photo',
			tone: 'peach'
		},
		{
			id: 'water',
			chip: 'Water',
			need: 'Mochi’s water needs refreshing',
			action: 'I refilled water — add photo',
			tone: 'sky'
		},
		{
			id: 'litter',
			chip: 'Litter',
			need: 'The litter box needs cleaning',
			action: 'I cleaned the litter — add photo',
			tone: 'lavender'
		},
		{
			id: 'play',
			chip: 'Play',
			need: 'Mochi wants to play',
			action: 'We played — add photo',
			tone: 'butter'
		},
		{
			id: 'grooming',
			chip: 'Groom',
			need: 'Mochi needs brushing',
			action: 'I brushed Mochi — add photo',
			tone: 'sage'
		},
		{
			id: 'meds',
			chip: 'Meds',
			need: 'Mochi’s medication is due',
			action: 'I gave meds — add photo',
			tone: 'peach'
		}
	];
	const REWARD = 10;

	let { data }: PageProps = $props();

	let override = $state<TaskType | null>(null);
	let verifying = $state(false);
	let result = $state<VerifyBody | null>(null);

	let completed = $derived(new Set(data.completedTasks));
	let doneCount = $derived(TASKS.filter((t) => completed.has(t.id)).length);
	let allDone = $derived(doneCount === TASKS.length);
	let nextTask = $derived(TASKS.find((t) => !completed.has(t.id)) ?? TASKS[0]);
	let active = $derived(
		TASKS.find((t) => t.id === (override ?? data.selectedTask ?? nextTask.id)) ?? nextTask
	);

	let profileInitial = $derived(data.user?.displayName?.slice(0, 1).toUpperCase() ?? 'P');
	let firstName = $derived(data.user?.displayName?.split(' ')[0] ?? 'cat parent');
	let balance = $derived(data.user?.purrpoints ?? 0);
	let progressPercent = $derived(Math.round((doneCount / TASKS.length) * 100));

	async function captureProof(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !data.user || verifying) return;

		verifying = true;
		result = null;

		const body = new FormData();
		body.set('taskType', active.id);
		body.set('photo', file);

		try {
			const response = await fetch('/api/verify', { method: 'POST', body });
			const json = (await response.json()) as VerifyBody;
			result = json;
			if (response.ok && json.verified) {
				override = null;
				await invalidateAll();
			}
		} catch {
			result = { error: 'Couldn’t reach verification. Try again.' };
		} finally {
			verifying = false;
			input.value = '';
		}
	}

	function selectTask(id: TaskType) {
		if (verifying) return;
		override = id;
		result = null;
	}
</script>

<!-- Home: one real care need, one proof CTA, one reward. The cat is a companion, not the product. -->

<svelte:head>
	<title>Purrward | Home</title>
	<meta
		name="description"
		content="Care for your real cat, prove it with a photo, and earn Purrpoints."
	/>
</svelte:head>

<div class="home">
	<header class="top">
		<div>
			<p>Hi {firstName}</p>
			<h1>{allDone ? 'All cared for today' : 'Your cat needs you'}</h1>
		</div>
		<a class="avatar" href={resolve('/profile')} aria-label="Profile and settings">
			{#if data.user?.avatarUrl}
				<img src={data.user.avatarUrl} alt="" />
			{:else}
				<span>{profileInitial}</span>
			{/if}
		</a>
	</header>

	<div class="progress" aria-label={`${doneCount} of ${TASKS.length} care tasks done today`}>
		<div class="progress-bar"><span style={`width:${progressPercent}%`}></span></div>
		<small>{doneCount} of {TASKS.length} cared today</small>
	</div>

	<section class={['hero', allDone ? 'sage' : active.tone]} aria-labelledby="hero-need">
		<div class="cat" aria-hidden="true">
			<svg viewBox="0 0 120 110" role="img">
				<path class="head" d="M22 48c0-30 76-30 76 0 0 26-16 40-38 40S22 74 22 48Z" />
				<path class="ear" d="M31 28 25 6l21 16M89 28l6-22-21 16" />
				<path class="ear-in" d="M32 24 29 12l10 9M88 24l3-12-10 9" />
				{#if allDone}
					<path class="eye-happy" d="M42 50c2 2 7 2 9 0" />
					<path class="eye-happy" d="M69 50c2 2 7 2 9 0" />
				{:else}
					<circle class="eye" cx="46" cy="50" r="3.4" />
					<circle class="eye" cx="74" cy="50" r="3.4" />
				{/if}
				<path
					class="face"
					d="M60 56v6M53 66c4 4 10 4 14 0M44 60l-18-4M44 68l-18 3M76 60l18-4M76 68l18 3"
				/>
				<path class="collar" d="M40 78c12 7 28 7 40 0" />
				<circle class="bell" cx="60" cy="84" r="4.2" />
			</svg>
		</div>

		<div class="hero-copy">
			{#if allDone}
				<h2 id="hero-need">Mochi’s all set 🐾</h2>
				<p>Every routine done today. +{doneCount * REWARD} Purrpoints earned.</p>
			{:else if result?.verified}
				<h2 id="hero-need">Nice. Done.</h2>
				<p>+{result.pointsAwarded ?? REWARD} Purrpoints. Up next below.</p>
			{:else}
				<h2 id="hero-need">{active.need}</h2>
				<p>Do it for real, then snap a photo. +{REWARD} Purrpoints.</p>
			{/if}
		</div>

		{#if allDone}
			<p class="hero-rest">Come back tomorrow for the next round of care.</p>
		{:else if data.user}
			<label class={['cta', verifying && 'busy']}>
				<Camera size={20} strokeWidth={2.3} aria-hidden="true" />
				<span>{verifying ? 'Checking your proof…' : active.action}</span>
				<input
					type="file"
					accept="image/jpeg,image/png"
					capture="environment"
					disabled={verifying}
					onchange={captureProof}
				/>
			</label>
		{:else}
			<a class="cta" href={resolve('/auth/google')}>
				<Camera size={20} strokeWidth={2.3} aria-hidden="true" />
				<span>Sign in to start caring</span>
			</a>
		{/if}

		{#if result && !result.verified}
			<p class="hero-warn">{result.reason ?? result.error ?? 'Upload a clearer proof photo.'}</p>
		{/if}
	</section>

	{#if !allDone}
		<section class="others" aria-labelledby="others-title">
			<div class="others-head">
				<h2 id="others-title">Other care today</h2>
				<a href={resolve('/care')}
					>All <ChevronRight size={15} strokeWidth={2.3} aria-hidden="true" /></a
				>
			</div>
			<div class="chips">
				{#each TASKS as task (task.id)}
					{@const isDone = completed.has(task.id)}
					<button
						class={['chip', task.tone, active.id === task.id && 'active', isDone && 'done']}
						type="button"
						disabled={isDone || verifying}
						onclick={() => selectTask(task.id)}
						aria-label={isDone ? `${task.chip} done` : `Switch to ${task.chip}`}
					>
						<span class="chip-dot"></span>
						{task.chip}
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<a class="points" href={resolve('/rewards')}>
		<span class="points-icon"><Star size={18} strokeWidth={2.3} aria-hidden="true" /></span>
		<strong>{balance} Purrpoints</strong>
		<span class="points-go"
			>Rewards <ChevronRight size={17} strokeWidth={2.3} aria-hidden="true" /></span
		>
	</a>
</div>

<style>
	.home {
		display: grid;
		gap: 18px;
		padding-bottom: 4px;
	}

	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-top: 6px;
	}

	.top p {
		margin: 0 0 3px;
		color: var(--color-muted);
		font-size: 0.95rem;
		font-weight: 700;
	}

	.top h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: clamp(1.7rem, 7vw, 2rem);
		line-height: 1.05;
	}

	.avatar {
		display: grid;
		width: 52px;
		height: 52px;
		flex: 0 0 auto;
		place-items: center;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: 50%;
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		font-size: 1.15rem;
		font-weight: 900;
		text-decoration: none;
		box-shadow: var(--shadow-card);
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.progress {
		display: grid;
		gap: 7px;
	}

	.progress-bar {
		height: 10px;
		border-radius: var(--radius-pill);
		background: var(--color-paper-3);
		overflow: hidden;
	}

	.progress-bar span {
		display: block;
		height: 100%;
		border-radius: var(--radius-pill);
		background: var(--color-sage);
		transition: width 320ms ease;
	}

	.progress small {
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}

	/* Hero: the one thing that matters right now */
	.hero {
		display: grid;
		justify-items: center;
		gap: 14px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card-lg);
		background: var(--color-paper-2);
		padding: 26px 22px 24px;
		text-align: center;
		box-shadow: var(--shadow-card);
	}

	.hero.peach {
		background: linear-gradient(180deg, #fff3ec 0%, var(--color-paper-2) 70%);
	}
	.hero.sky {
		background: linear-gradient(180deg, #ecf8fb 0%, var(--color-paper-2) 70%);
	}
	.hero.lavender {
		background: linear-gradient(180deg, #f1edff 0%, var(--color-paper-2) 70%);
	}
	.hero.butter {
		background: linear-gradient(180deg, #fff6dd 0%, var(--color-paper-2) 70%);
	}
	.hero.sage {
		background: linear-gradient(180deg, #eef6ea 0%, var(--color-paper-2) 70%);
	}

	.cat {
		width: 124px;
		height: 114px;
	}

	.cat svg {
		width: 100%;
		height: 100%;
	}

	.cat path,
	.cat circle {
		fill: none;
		stroke: #695841;
		stroke-width: 2.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.cat .head,
	.cat .ear {
		fill: #fffbf0;
	}

	.cat .ear-in {
		fill: var(--color-peach-soft);
		stroke: none;
	}

	.cat .eye,
	.cat .bell {
		fill: var(--color-charcoal);
		stroke: none;
	}

	.cat .bell {
		fill: var(--color-butter);
		stroke: #8a651b;
	}

	.cat .eye-happy {
		fill: none;
		stroke-width: 2.6;
	}

	.cat .collar {
		stroke: #c66f52;
		stroke-width: 3.2;
	}

	.hero-copy h2 {
		margin: 0 0 5px;
		font-size: 1.42rem;
		line-height: 1.08;
	}

	.hero-copy p {
		margin: 0;
		color: var(--color-charcoal);
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.hero-rest {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.88rem;
		font-weight: 600;
	}

	.cta {
		display: inline-flex;
		width: 100%;
		min-height: 58px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		font-size: 1rem;
		font-weight: 800;
		text-decoration: none;
		cursor: pointer;
		box-shadow: 0 14px 30px rgba(36, 38, 38, 0.16);
		transition: transform 120ms ease;
		position: relative;
		overflow: hidden;
	}

	.cta:active {
		transform: translateY(1px);
	}

	.cta.busy {
		background: var(--color-muted);
		cursor: progress;
	}

	.cta input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.cta input:disabled {
		cursor: progress;
	}

	.hero-warn {
		width: 100%;
		margin: 0;
		border-radius: 16px;
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
		padding: 10px 12px;
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.3;
	}

	/* Secondary: switch the active care task */
	.others {
		display: grid;
		gap: 11px;
	}

	.others-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.others-head h2 {
		margin: 0;
		font-size: 1.12rem;
	}

	.others-head a {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 800;
		text-decoration: none;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		min-height: 40px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		color: var(--color-charcoal);
		padding: 0 15px;
		font-size: 0.88rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			border-color 120ms ease,
			transform 120ms ease;
	}

	.chip:active {
		transform: translateY(1px);
	}

	.chip-dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--color-peach);
	}

	.chip.sky .chip-dot {
		background: var(--color-sky);
	}
	.chip.lavender .chip-dot {
		background: #b9a7e9;
	}
	.chip.butter .chip-dot {
		background: var(--color-butter);
	}
	.chip.sage .chip-dot {
		background: var(--color-sage);
	}

	.chip.active {
		border-color: var(--color-charcoal);
		box-shadow: 0 6px 16px rgba(36, 38, 38, 0.1);
	}

	.chip.done {
		color: var(--color-muted);
		background: var(--color-sage-soft);
		border-color: transparent;
		cursor: default;
	}

	.chip.done .chip-dot {
		background: var(--color-success-text);
	}

	/* Points: a chip, not a billboard */
	.points {
		display: flex;
		align-items: center;
		gap: 11px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		padding: 12px 16px;
		color: var(--color-ink);
		text-decoration: none;
		box-shadow: var(--shadow-card);
	}

	.points-icon {
		display: grid;
		width: 34px;
		height: 34px;
		place-items: center;
		border-radius: 50%;
		background: #fff2cf;
		color: #8a651b;
	}

	.points strong {
		flex: 1;
		font-size: 1rem;
		font-weight: 800;
	}

	.points-go {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 800;
	}

	@media (max-width: 360px) {
		.cta {
			font-size: 0.92rem;
		}
	}
</style>
