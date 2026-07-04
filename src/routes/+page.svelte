<script lang="ts">
	import { resolve } from '$app/paths';
	import Brush from '@lucide/svelte/icons/brush';
	import Camera from '@lucide/svelte/icons/camera';
	import Check from '@lucide/svelte/icons/check';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Droplet from '@lucide/svelte/icons/droplet';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Pill from '@lucide/svelte/icons/pill';
	import Star from '@lucide/svelte/icons/star';
	import Toilet from '@lucide/svelte/icons/toilet';
	import Utensils from '@lucide/svelte/icons/utensils';
	import { isRenderableAvatarUrl } from '$lib/avatar-url';
	import { getCatAvatar } from '$lib/cat-avatars';
	import { deriveCatState } from '$lib/cat-state';
	import { habitSetFor } from '$lib/tasks';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import House from '@lucide/svelte/icons/house';
	import orangeCat from '$lib/assets/cats/cats_types/orange_sit.webp';
	import happyFace from '$lib/assets/cats/expressions/happy.webp';
	import normalFace from '$lib/assets/cats/expressions/normal_orange.webp';
	import sadFace from '$lib/assets/cats/expressions/sad_orange.webp';
	import sleepFace from '$lib/assets/cats/expressions/sleep.webp';
	import type { TaskType } from '$lib/tasks';
	import type { PageProps } from './$types';

	type TaskMeta = {
		id: TaskType;
		label: string;
		need: string;
		action: string;
		reward: number;
		tone: 'peach' | 'sky' | 'rose' | 'butter' | 'sage';
	};

	const TASKS: TaskMeta[] = [
		{
			id: 'feeding',
			label: 'Feed',
			need: 'Breakfast time',
			action: 'Take feeding photo',
			reward: 10,
			tone: 'peach'
		},
		{
			id: 'water',
			label: 'Water',
			need: 'Fresh water time',
			action: 'Take water photo',
			reward: 10,
			tone: 'sky'
		},
		{
			id: 'litter',
			label: 'Litter',
			need: 'Clean litter time',
			action: 'Take litter photo',
			reward: 10,
			tone: 'rose'
		},
		{
			id: 'play',
			label: 'Play',
			need: 'Play time',
			action: 'Take play photo',
			reward: 10,
			tone: 'butter'
		},
		{
			id: 'grooming',
			label: 'Groom',
			need: 'Brush time',
			action: 'Take grooming photo',
			reward: 10,
			tone: 'sage'
		},
		{
			id: 'meds',
			label: 'Meds',
			need: 'Medicine time',
			action: 'Take medicine photo',
			reward: 10,
			tone: 'peach'
		},
		{
			id: 'street_feeding',
			label: 'Street',
			need: 'Street feeding time',
			action: 'Take feeding photo',
			reward: 10,
			tone: 'peach'
		},
		{
			id: 'shelter_care',
			label: 'Shelter',
			need: 'Shelter care time',
			action: 'Take shelter photo',
			reward: 10,
			tone: 'sage'
		}
	];

	let { data }: PageProps = $props();

	let avatarFailed = $state(false);

	let catName = $derived(data.activeCat?.name ?? 'your cat');
	// Show the habit set that matches the active cat's care mode.
	let habitSet = $derived(habitSetFor(data.activeCat?.careMode ?? 'owned'));
	let tasks = $derived(TASKS.filter((task) => habitSet.includes(task.id)));
	let completed = $derived(new Set(data.completedTasks));
	let doneCount = $derived(tasks.filter((task) => completed.has(task.id)).length);
	let allDone = $derived(doneCount === tasks.length);
	let nextTask = $derived(tasks.find((task) => !completed.has(task.id)) ?? tasks[0]);
	let requestedTask = $derived(
		data.selectedTask && !completed.has(data.selectedTask) ? data.selectedTask : nextTask.id
	);
	let active = $derived(tasks.find((task) => task.id === requestedTask) ?? nextTask);
	let profileInitial = $derived(data.user?.displayName?.slice(0, 1).toUpperCase() ?? 'P');
	let firstName = $derived(data.user?.displayName?.split(' ')[0] ?? 'cat parent');
	let sandboxMode = $derived(data.preferences.sandboxMode);
	let balance = $derived(sandboxMode ? 999999 : (data.user?.purrpoints ?? 0));
	// Hero mascot uses the active cat's chosen avatar; falls back to the orange mascot.
	let heroAvatar = $derived(data.activeCat ? getCatAvatar(data.activeCat.avatarId) : null);
	let heroBase = $derived(heroAvatar?.src ?? orangeCat);
	// The orange face overlay only matches the orange mascot art.
	let showExpression = $derived(!data.activeCat || data.activeCat.avatarId === 'orange');
	let selectedCatAvatar = $derived(data.user ? getCatAvatar(data.preferences.avatarChoice) : null);
	let avatarUrl = $derived(selectedCatAvatar?.src ?? data.user?.avatarUrl ?? null);
	let canRenderAvatar = $derived(!avatarFailed && isRenderableAvatarUrl(avatarUrl));
	let catState = $derived(
		deriveCatState({ completed: data.completedTasks, required: tasks.map((task) => task.id) })
	);
	let catFace = $derived(
		catState === 'happy'
			? happyFace
			: catState === 'hungry'
				? sadFace
				: catState === 'sleeping'
					? sleepFace
					: normalFace
	);
	let heroCopy = $derived.by(() => {
		if (allDone) {
			return {
				title: `${catName} is cared for today`,
				body: `All routines done. +${doneCount * 10} Purrpoints.`
			};
		}
		return {
			title: active.need,
			body: `+${sandboxMode ? 1000 : active.reward} pts.`
		};
	});
</script>

<!-- Home screen focused on one daily care moment, then progress and rewards. -->

{#snippet taskIcon(taskId: TaskType, size = 14)}
	{#if taskId === 'feeding'}
		<Utensils {size} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'water'}
		<Droplet {size} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'litter'}
		<Toilet {size} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'play'}
		<Gamepad2 {size} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'grooming'}
		<Brush {size} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'meds'}
		<Pill {size} strokeWidth={2.5} aria-hidden="true" />
	{:else if taskId === 'street_feeding'}
		<HeartHandshake {size} strokeWidth={2.5} aria-hidden="true" />
	{:else}
		<House {size} strokeWidth={2.5} aria-hidden="true" />
	{/if}
{/snippet}

<svelte:head>
	<title>Purrward | Home</title>
	<meta
		name="description"
		content="Care for your cat, open the proof camera, and earn Purrpoints."
	/>
</svelte:head>

<div class="home">
	<header class="top">
		<div class="greeting">
			<p>Hi {firstName}</p>
			<h1>{allDone ? `${catName} is settled in` : `${catName} needs care`}</h1>
		</div>
		<a class="avatar" href={resolve('/profile')} aria-label="Profile and settings">
			{#if canRenderAvatar && avatarUrl}
				<img
					class={selectedCatAvatar ? 'cat-avatar-img' : undefined}
					src={avatarUrl}
					alt=""
					onerror={() => (avatarFailed = true)}
				/>
			{:else}
				<span>{profileInitial}</span>
			{/if}
		</a>
	</header>

	<section
		id="care-proof"
		class={['hero', active.tone, allDone && 'complete']}
		aria-labelledby="hero-need"
	>
		<div class="hero-stage" aria-hidden="true">
			<span class="cat-shadow"></span>
			<div class="cat">
				<img class="cat-base" src={heroBase} alt="" width="196" height="196" />
				{#if showExpression}
					<img class="cat-face" src={catFace} alt="" width="196" height="196" />
				{/if}
			</div>
		</div>

		<div class="hero-copy">
			<h2 id="hero-need">{heroCopy.title}</h2>
			<p>{heroCopy.body}</p>
		</div>

		{#if allDone}
			<p class="hero-rest">Tomorrow needs you too.</p>
		{:else if data.user}
			<a class="cta" href={resolve(`/care-proof?task=${active.id}`)}>
				<Camera size={20} strokeWidth={2.3} aria-hidden="true" />
				<span>Open proof camera</span>
			</a>
		{:else}
			<a class="cta" href={resolve('/auth/login')}>
				<Camera size={20} strokeWidth={2.3} aria-hidden="true" />
				<span>Sign in to log care</span>
			</a>
		{/if}
	</section>

	<section class="today" aria-labelledby="today-title">
		<div class="section-head">
			<div>
				<p>Today’s care</p>
				<h2 id="today-title">{doneCount} of {tasks.length} routines done</h2>
			</div>
			<a href={resolve('/care')} aria-label="Open full care plan">
				View all <ChevronRight size={15} strokeWidth={2.3} aria-hidden="true" />
			</a>
		</div>

		<ul class="markers" aria-label={`${doneCount} of ${tasks.length} care tasks done today`}>
			{#each tasks as task (task.id)}
				{@const isDone = completed.has(task.id)}
				<li
					class={['marker', task.tone, active.id === task.id && 'active', isDone && 'done']}
					aria-label={isDone ? `${task.label} done` : `${task.label} not done yet`}
				>
					<span class="marker-icon">{@render taskIcon(task.id, 13)}</span>
					<span>{task.label}</span>
					<span class="marker-check" aria-hidden="true">
						{#if isDone}
							<Check size={14} strokeWidth={3} />
						{/if}
					</span>
				</li>
			{/each}
		</ul>
	</section>

	<a class="points" href={resolve('/rewards')}>
		<span class="points-icon"><Star size={18} strokeWidth={2.3} aria-hidden="true" /></span>
		<span>
			<strong>{balance} Purrpoints</strong>
			<small>{sandboxMode ? 'Sandbox test balance' : 'Redeem treats, toys, and more'}</small>
		</span>
		<span class="points-go">
			Rewards <ChevronRight size={17} strokeWidth={2.3} aria-hidden="true" />
		</span>
	</a>
</div>

<style>
	.home {
		display: grid;
		gap: 18px;
		padding-bottom: 6px;
	}

	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-top: 4px;
	}

	.greeting p,
	.section-head p {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.88rem;
		font-weight: 800;
	}

	.greeting h1 {
		margin: 3px 0 0;
		color: var(--color-ink);
		font-size: clamp(1.9rem, 8vw, 2.28rem);
		line-height: 1.02;
	}

	.avatar {
		display: grid;
		width: 50px;
		height: 50px;
		flex: 0 0 auto;
		place-items: center;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: 50%;
		background:
			radial-gradient(
				circle at 32% 24%,
				color-mix(in srgb, var(--color-peach-soft) 72%, transparent),
				transparent 44%
			),
			var(--color-paper-2);
		color: var(--color-charcoal);
		font-size: 1rem;
		font-weight: 900;
		text-decoration: none;
		box-shadow: 0 10px 26px color-mix(in srgb, var(--color-charcoal) 8%, transparent);
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar img.cat-avatar-img {
		padding: 7px;
		object-fit: contain;
	}

	.hero {
		display: grid;
		justify-items: center;
		gap: 11px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-card-lg);
		background: var(--color-paper-2);
		padding: 14px 18px 16px;
		text-align: center;
		box-shadow: var(--shadow-card);
	}

	.hero.peach {
		background:
			radial-gradient(
				circle at 50% 22%,
				color-mix(in srgb, var(--color-peach-soft) 74%, transparent),
				transparent 58%
			),
			var(--color-paper-2);
	}

	.hero.sky {
		background:
			radial-gradient(
				circle at 50% 22%,
				color-mix(in srgb, var(--color-sky-soft) 74%, transparent),
				transparent 58%
			),
			var(--color-paper-2);
	}

	.hero.rose {
		background:
			radial-gradient(
				circle at 50% 22%,
				color-mix(in srgb, var(--color-rose) 30%, transparent),
				transparent 58%
			),
			var(--color-paper-2);
	}

	.hero.butter {
		background:
			radial-gradient(
				circle at 50% 22%,
				color-mix(in srgb, var(--color-butter) 34%, transparent),
				transparent 58%
			),
			var(--color-paper-2);
	}

	.hero.sage,
	.hero.complete {
		background:
			radial-gradient(
				circle at 50% 22%,
				color-mix(in srgb, var(--color-sage-soft) 74%, transparent),
				transparent 58%
			),
			var(--color-paper-2);
	}

	.hero-stage {
		position: relative;
		display: grid;
		width: min(58vw, 210px);
		min-height: 122px;
		place-items: end center;
	}

	.hero-stage::before {
		content: '';
		position: absolute;
		inset: auto 13% 7px;
		height: 44px;
		border: 1px solid color-mix(in srgb, var(--color-line) 74%, transparent);
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-paper-3) 70%, var(--color-paper-2));
	}

	.cat-shadow {
		position: absolute;
		right: 19%;
		bottom: 14px;
		left: 19%;
		height: 14px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-charcoal) 11%, transparent);
		filter: blur(10px);
	}

	.cat {
		position: relative;
		width: min(36vw, 122px);
		aspect-ratio: 1;
	}

	.cat img {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.cat-base,
	.cat-face {
		mix-blend-mode: multiply;
	}

	.hero-copy h2 {
		margin: 0 0 7px;
		color: var(--color-ink);
		font-size: clamp(1.28rem, 5.2vw, 1.5rem);
		line-height: 1.08;
	}

	.hero-copy p {
		overflow: hidden;
		max-width: 290px;
		margin: 0 auto;
		color: var(--color-charcoal);
		font-size: 0.98rem;
		font-weight: 650;
		line-height: 1.38;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hero-rest {
		overflow: hidden;
		margin: 0;
		color: var(--color-muted);
		font-size: 0.88rem;
		font-weight: 650;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cta {
		position: relative;
		display: inline-flex;
		width: 100%;
		min-height: 52px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		overflow: hidden;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--color-charcoal);
		color: var(--color-paper-2);
		font-size: 1rem;
		font-weight: 800;
		text-decoration: none;
		box-shadow: 0 12px 26px color-mix(in srgb, var(--color-charcoal) 18%, transparent);
		cursor: pointer;
		transition: transform 120ms ease;
	}

	.cta:active {
		transform: translateY(1px);
	}

	.today {
		display: grid;
		gap: 12px;
	}

	.section-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 12px;
	}

	.section-head h2 {
		margin: 2px 0 0;
		color: var(--color-ink);
		font-size: 1.2rem;
		line-height: 1.1;
	}

	.section-head a {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		color: var(--color-muted);
		font-size: 0.86rem;
		font-weight: 800;
		text-decoration: none;
		white-space: nowrap;
	}

	.markers {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.marker {
		display: grid;
		grid-template-columns: 24px 1fr 22px;
		min-height: 44px;
		align-items: center;
		gap: 9px;
		border: 0;
		border-radius: 18px;
		background: color-mix(in srgb, var(--color-paper-2) 82%, transparent);
		color: var(--color-charcoal);
		padding: 8px 10px;
		font-size: 0.78rem;
		font-weight: 800;
		cursor: default;
		box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--color-line) 62%, transparent);
	}

	.marker-icon {
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--color-peach-soft);
		color: var(--color-success-text);
	}

	.marker-icon {
		width: 24px;
		height: 24px;
		border-radius: 9px;
	}

	.marker-check {
		display: grid;
		width: 22px;
		height: 22px;
		place-items: center;
		border-radius: 50%;
		color: var(--color-success-text);
	}

	.marker.done .marker-check {
		background: var(--color-paper-2);
	}

	.marker.sky .marker-icon {
		background: var(--color-sky-soft);
	}

	.marker.rose .marker-icon {
		background: color-mix(in srgb, var(--color-rose) 34%, var(--color-paper-2));
	}

	.marker.butter .marker-icon {
		background: var(--color-warning-bg);
	}

	.marker.sage .marker-icon {
		background: var(--color-sage-soft);
	}

	.marker.active {
		background: var(--color-paper-2);
		box-shadow: 0 8px 18px color-mix(in srgb, var(--color-charcoal) 6%, transparent);
	}

	.marker.done {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
	}

	.points {
		display: grid;
		grid-template-columns: 40px 1fr auto;
		gap: 11px;
		align-items: center;
		border: 1px solid var(--color-line);
		border-radius: 28px;
		background: var(--color-paper-2);
		padding: 13px 14px;
		color: var(--color-ink);
		text-decoration: none;
		box-shadow: var(--shadow-card);
	}

	.points-icon {
		display: grid;
		width: 40px;
		height: 40px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.points strong,
	.points small {
		display: block;
	}

	.points strong {
		font-size: 1rem;
		font-weight: 850;
	}

	.points small {
		overflow: hidden;
		margin-top: 2px;
		color: var(--color-muted);
		font-size: 0.76rem;
		font-weight: 650;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.points-go {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 850;
	}

	@media (max-width: 360px) {
		.home {
			gap: 15px;
		}

		.hero {
			padding-inline: 16px;
		}

		.cta {
			font-size: 0.92rem;
		}
	}
</style>
