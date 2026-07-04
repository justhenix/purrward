<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Brush from '@lucide/svelte/icons/brush';
	import Camera from '@lucide/svelte/icons/camera';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Droplet from '@lucide/svelte/icons/droplet';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Pill from '@lucide/svelte/icons/pill';
	import Star from '@lucide/svelte/icons/star';
	import Toilet from '@lucide/svelte/icons/toilet';
	import Utensils from '@lucide/svelte/icons/utensils';
	import { deriveParentName } from '$lib/account-identity';
	import { getCatAvatar } from '$lib/cat-avatars';
	import { resolveProfileAvatar } from '$lib/profile-avatar';
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
		heroTitle: string;
		log: string;
		reward: number;
		tone: 'peach' | 'sky' | 'rose' | 'butter' | 'sage';
	};

	const TASKS: TaskMeta[] = [
		{
			id: 'feeding',
			label: 'Feed',
			heroTitle: 'Breakfast',
			log: 'breakfast',
			reward: 10,
			tone: 'peach'
		},
		{
			id: 'water',
			label: 'Water',
			heroTitle: 'Fresh water',
			log: 'water',
			reward: 10,
			tone: 'sky'
		},
		{ id: 'litter', label: 'Litter', heroTitle: 'Litter', log: 'litter', reward: 10, tone: 'rose' },
		{ id: 'play', label: 'Play', heroTitle: 'Playtime', log: 'play', reward: 10, tone: 'butter' },
		{
			id: 'grooming',
			label: 'Groom',
			heroTitle: 'Grooming',
			log: 'grooming',
			reward: 10,
			tone: 'sage'
		},
		{ id: 'meds', label: 'Meds', heroTitle: 'Medicine', log: 'meds', reward: 10, tone: 'peach' },
		{
			id: 'street_feeding',
			label: 'Street',
			heroTitle: 'Street feeding',
			log: 'feeding',
			reward: 10,
			tone: 'peach'
		},
		{
			id: 'shelter_care',
			label: 'Shelter',
			heroTitle: 'Shelter care',
			log: 'care',
			reward: 10,
			tone: 'sage'
		}
	];

	let { data }: PageProps = $props();

	let switcherOpen = $state(false);
	let cats = $derived(data.cats ?? []);
	let activeCatAvatar = $derived(data.activeCat ? getCatAvatar(data.activeCat.avatarId) : null);
	let canSwitch = $derived(cats.length > 1);

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
	let profileAvatar = $derived(resolveProfileAvatar(data.user, data.preferences.avatarChoice));
	let firstName = $derived(deriveParentName(data.user).split(' ')[0]);
	let sandboxMode = $derived(data.preferences.sandboxMode);
	let balance = $derived(sandboxMode ? 999999 : (data.user?.purrpoints ?? 0));
	// Hero mascot uses the active cat's chosen avatar; falls back to the orange mascot.
	let heroAvatar = $derived(data.activeCat ? getCatAvatar(data.activeCat.avatarId) : null);
	let heroBase = $derived(heroAvatar?.src ?? orangeCat);
	// The orange face overlay only matches the orange mascot art.
	let showExpression = $derived(!data.activeCat || data.activeCat.avatarId === 'orange');
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
			return { title: 'All done today', body: `+${doneCount * 10} pts` };
		}
		return {
			title: active.heroTitle,
			body: `+${sandboxMode ? 1000 : active.reward} pts`
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
			<h1>Today’s care</h1>
		</div>
		<a class="avatar" href={resolve('/profile')} aria-label="Profile and settings">
			{#if profileAvatar.kind === 'image'}
				<img
					class={profileAvatar.cat ? 'cat-avatar-img' : undefined}
					src={profileAvatar.src}
					alt=""
				/>
			{:else}
				<span>{profileAvatar.letter}</span>
			{/if}
		</a>
	</header>

	{#if data.user && data.activeCat}
		<div class="switcher">
			<button
				type="button"
				class="switcher-current"
				aria-haspopup="true"
				aria-expanded={switcherOpen}
				onclick={() => (switcherOpen = !switcherOpen)}
			>
				<span class="switcher-avatar" aria-hidden="true">
					{#if activeCatAvatar}<img src={activeCatAvatar.src} alt="" />{/if}
				</span>
				<span class="switcher-copy">
					<small>Active cat</small>
					<strong>{data.activeCat.name}</strong>
				</span>
				{#if canSwitch}
					<ChevronDown size={18} strokeWidth={2.3} aria-hidden="true" />
				{/if}
			</button>
		</div>

		{#if switcherOpen && canSwitch}
			<button
				type="button"
				class="sheet-backdrop"
				aria-label="Close cat picker"
				onclick={() => (switcherOpen = false)}
			></button>
			<div class="sheet" role="dialog" aria-label="Choose a cat">
				<p class="sheet-title">Choose a cat</p>
				<ul class="sheet-list">
					{#each cats as cat (cat.id)}
						{@const avatar = getCatAvatar(cat.avatarId)}
						{@const isActive = cat.id === data.activeCat.id}
						<li>
							<form
								method="POST"
								action="?/select"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
										switcherOpen = false;
									};
								}}
							>
								<input type="hidden" name="catId" value={cat.id} />
								<button type="submit" class={['sheet-row', isActive && 'active']}>
									<span class="sheet-avatar" aria-hidden="true">
										{#if avatar}<img src={avatar.src} alt="" />{/if}
									</span>
									<span class="sheet-name">{cat.name}</span>
									{#if isActive}
										<Check size={17} strokeWidth={3} aria-hidden="true" />
									{/if}
								</button>
							</form>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}

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
				<span>Log {active.log}</span>
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
				<p>Routines</p>
				<h2 id="today-title">{doneCount} of {tasks.length} done</h2>
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
						{:else if active.id === task.id}
							<span class="marker-next">Next</span>
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

	.switcher {
		margin-top: -6px;
	}

	.switcher-current {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-pill);
		background: var(--color-paper-2);
		padding: 8px 14px 8px 8px;
		color: var(--color-charcoal);
		cursor: pointer;
		box-shadow: var(--shadow-card);
	}

	.switcher-avatar {
		display: grid;
		width: 42px;
		height: 42px;
		flex: none;
		place-items: center;
		overflow: hidden;
		border-radius: 14px;
		background: var(--color-peach-soft);
	}

	.switcher-avatar img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 4px;
	}

	.switcher-copy {
		display: grid;
		flex: 1;
		min-width: 0;
		text-align: left;
	}

	.switcher-copy small {
		color: var(--color-muted);
		font-size: 0.72rem;
		font-weight: 800;
	}

	.switcher-copy strong {
		overflow: hidden;
		color: var(--color-ink);
		font-size: 1rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sheet-backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		border: 0;
		background: color-mix(in srgb, var(--color-charcoal) 32%, transparent);
		cursor: pointer;
	}

	.sheet {
		position: fixed;
		left: 50%;
		bottom: 0;
		z-index: 61;
		width: min(100%, 430px);
		transform: translateX(-50%);
		border-radius: 28px 28px 0 0;
		background: var(--color-paper-2);
		padding: 16px 18px calc(20px + env(safe-area-inset-bottom));
		box-shadow: 0 -14px 40px color-mix(in srgb, var(--color-charcoal) 16%, transparent);
	}

	.sheet-title {
		margin: 4px 0 12px;
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 800;
		text-align: center;
	}

	.sheet-list {
		display: grid;
		gap: 8px;
		margin: 0;
		padding: 0;
		max-height: 52vh;
		overflow-y: auto;
		list-style: none;
	}

	.sheet-row {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: var(--color-paper);
		padding: 10px 12px;
		color: var(--color-charcoal);
		font-size: 0.95rem;
		font-weight: 800;
		cursor: pointer;
	}

	.sheet-row.active {
		background: var(--color-sage-soft);
		color: var(--color-success-text);
		border-color: color-mix(in srgb, var(--color-success-text) 24%, var(--color-line));
	}

	.sheet-avatar {
		display: grid;
		width: 40px;
		height: 40px;
		flex: none;
		place-items: center;
		overflow: hidden;
		border-radius: 13px;
		background: var(--color-peach-soft);
	}

	.sheet-avatar img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 4px;
	}

	.sheet-name {
		flex: 1;
		overflow: hidden;
		text-align: left;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		grid-template-columns: 24px 1fr auto;
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
		min-width: 22px;
		height: 22px;
		place-items: center;
		border-radius: 50%;
		color: var(--color-success-text);
	}

	.marker.done .marker-check {
		background: var(--color-paper-2);
	}

	.marker-next {
		font-size: 0.6rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-muted);
	}

	.marker.active .marker-next {
		color: var(--color-charcoal);
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
